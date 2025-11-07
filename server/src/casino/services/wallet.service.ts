/**
 * Wallet Service
 * Handles all wallet operations: deposits, withdrawals, balance management
 */

import { randomUUID } from 'crypto';
import { Database } from '../database/db.js';
import {
  Wallet,
  Transaction,
  DepositDto,
  WithdrawDto,
  InsufficientFundsError,
  CasinoError,
} from '../types/index.js';

export class WalletService {
  constructor(private db: Database) {}

  /**
   * Get wallet for user
   */
  async getWallet(userId: string): Promise<Wallet> {
    const wallet = await this.db.get<Wallet & { user_id: string; locked_balance: string; updated_at: number }>(
      'SELECT * FROM wallets WHERE user_id = ?',
      [userId]
    );

    if (!wallet) {
      throw new CasinoError('Wallet not found', 'WALLET_NOT_FOUND', 404);
    }

    return this.mapWallet(wallet);
  }

  /**
   * Internal method to credit wallet without transaction wrapper
   * Use this when already inside a transaction
   */
  async creditWalletInternal(userId: string, amount: string, transactionSignature: string): Promise<Transaction> {
    const wallet = await this.getWallet(userId);

    // Validate amount
    if (parseFloat(amount) <= 0) {
      throw new CasinoError('Amount must be positive', 'INVALID_AMOUNT', 400);
    }

    const balanceBefore = wallet.balance;
    const balanceAfter = this.addAmounts(balanceBefore, amount);

    const transaction: Transaction = {
      id: randomUUID(),
      userId,
      type: 'deposit',
      amount,
      balanceBefore,
      balanceAfter,
      transactionSignature,
      createdAt: Date.now(),
    };

    // Update wallet balance (no transaction wrapper - caller handles it)
    await this.db.run(
      'UPDATE wallets SET balance = ?, updated_at = ? WHERE user_id = ?',
      [balanceAfter, transaction.createdAt, userId]
    );

    // Record transaction
    await this.db.run(
      `INSERT INTO transactions (id, user_id, type, amount, balance_before, balance_after, transaction_signature, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transaction.id,
        transaction.userId,
        transaction.type,
        transaction.amount,
        transaction.balanceBefore,
        transaction.balanceAfter,
        transaction.transactionSignature,
        transaction.createdAt,
      ]
    );

    return transaction;
  }

  /**
   * Process deposit transaction
   */
  async deposit(userId: string, dto: DepositDto): Promise<Transaction> {
    let transaction: Transaction | null = null;

    await this.db.transaction(async () => {
      transaction = await this.creditWalletInternal(userId, dto.amount, dto.transactionSignature);
    });

    return transaction!;
  }

  /**
   * Process withdrawal transaction
   */
  async withdraw(userId: string, dto: WithdrawDto): Promise<Transaction> {
    const wallet = await this.getWallet(userId);
    const amount = dto.amount;

    // Validate amount
    if (parseFloat(amount) <= 0) {
      throw new CasinoError('Withdrawal amount must be positive', 'INVALID_AMOUNT', 400);
    }

    // Check sufficient funds
    const availableBalance = this.subtractAmounts(wallet.balance, wallet.lockedBalance);
    if (this.compareAmounts(availableBalance, amount) < 0) {
      throw new InsufficientFundsError(amount, availableBalance);
    }

    const balanceBefore = wallet.balance;
    const balanceAfter = this.subtractAmounts(balanceBefore, amount);

    // TODO: In production, integrate with Solana to actually send the transaction
    const mockTxSignature = `withdraw_${randomUUID()}`;

    const transaction: Transaction = {
      id: randomUUID(),
      userId,
      type: 'withdraw',
      amount,
      balanceBefore,
      balanceAfter,
      transactionSignature: mockTxSignature,
      metadata: JSON.stringify({ destinationAddress: dto.destinationAddress }),
      createdAt: Date.now(),
    };

    await this.db.transaction(async () => {
      // Update wallet balance
      await this.db.run(
        'UPDATE wallets SET balance = ?, updated_at = ? WHERE user_id = ?',
        [balanceAfter, transaction.createdAt, userId]
      );

      // Record transaction
      await this.db.run(
        `INSERT INTO transactions (id, user_id, type, amount, balance_before, balance_after, transaction_signature, metadata, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transaction.id,
          transaction.userId,
          transaction.type,
          transaction.amount,
          transaction.balanceBefore,
          transaction.balanceAfter,
          transaction.transactionSignature,
          transaction.metadata,
          transaction.createdAt,
        ]
      );
    });

    return transaction;
  }

  /**
   * Lock funds for pending bet
   */
  async lockFunds(userId: string, amount: string): Promise<void> {
    const wallet = await this.getWallet(userId);

    // Check sufficient funds
    const availableBalance = this.subtractAmounts(wallet.balance, wallet.lockedBalance);
    if (this.compareAmounts(availableBalance, amount) < 0) {
      throw new InsufficientFundsError(amount, availableBalance);
    }

    const newLockedBalance = this.addAmounts(wallet.lockedBalance, amount);

    await this.db.run(
      'UPDATE wallets SET locked_balance = ?, updated_at = ? WHERE user_id = ?',
      [newLockedBalance, Date.now(), userId]
    );
  }

  /**
   * Unlock funds after bet is settled
   */
  async unlockFunds(userId: string, amount: string): Promise<void> {
    const wallet = await this.getWallet(userId);
    const newLockedBalance = this.subtractAmounts(wallet.lockedBalance, amount);

    await this.db.run(
      'UPDATE wallets SET locked_balance = ?, updated_at = ? WHERE user_id = ?',
      [newLockedBalance, Date.now(), userId]
    );
  }

  /**
   * Deduct balance (for losing bet)
   */
  async deductBalance(userId: string, amount: string, metadata?: string): Promise<Transaction> {
    const wallet = await this.getWallet(userId);
    const balanceBefore = wallet.balance;
    const balanceAfter = this.subtractAmounts(balanceBefore, amount);

    const transaction: Transaction = {
      id: randomUUID(),
      userId,
      type: 'loss',
      amount,
      balanceBefore,
      balanceAfter,
      metadata,
      createdAt: Date.now(),
    };

    await this.db.transaction(async () => {
      await this.db.run(
        'UPDATE wallets SET balance = ?, updated_at = ? WHERE user_id = ?',
        [balanceAfter, transaction.createdAt, userId]
      );

      await this.db.run(
        `INSERT INTO transactions (id, user_id, type, amount, balance_before, balance_after, metadata, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transaction.id,
          transaction.userId,
          transaction.type,
          transaction.amount,
          transaction.balanceBefore,
          transaction.balanceAfter,
          transaction.metadata,
          transaction.createdAt,
        ]
      );
    });

    return transaction;
  }

  /**
   * Internal method to add balance without transaction wrapper
   * Use this when already inside a transaction
   */
  async addBalanceInternal(userId: string, amount: string, metadata?: string): Promise<Transaction> {
    const wallet = await this.getWallet(userId);
    const balanceBefore = wallet.balance;
    const balanceAfter = this.addAmounts(balanceBefore, amount);

    const transaction: Transaction = {
      id: randomUUID(),
      userId,
      type: 'win',
      amount,
      balanceBefore,
      balanceAfter,
      metadata,
      createdAt: Date.now(),
    };

    await this.db.run(
      'UPDATE wallets SET balance = ?, updated_at = ? WHERE user_id = ?',
      [balanceAfter, transaction.createdAt, userId]
    );

    await this.db.run(
      `INSERT INTO transactions (id, user_id, type, amount, balance_before, balance_after, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transaction.id,
        transaction.userId,
        transaction.type,
        transaction.amount,
        transaction.balanceBefore,
        transaction.balanceAfter,
        transaction.metadata,
        transaction.createdAt,
      ]
    );

    return transaction;
  }

  /**
   * Add to balance (for winning bet)
   */
  async addBalance(userId: string, amount: string, metadata?: string): Promise<Transaction> {
    let transaction: Transaction | null = null;

    await this.db.transaction(async () => {
      transaction = await this.addBalanceInternal(userId, amount, metadata);
    });

    return transaction!;
  }

  /**
   * Get transaction history for user
   */
  async getTransactions(userId: string, limit: number = 50, offset: number = 0): Promise<Transaction[]> {
    const rows = await this.db.all<
      Transaction & {
        user_id: string;
        balance_before: string;
        balance_after: string;
        transaction_signature?: string;
        created_at: number;
      }
    >(
      `SELECT * FROM transactions
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    return rows.map(this.mapTransaction);
  }

  /**
   * Helper: Add two amounts (as strings to preserve precision)
   */
  private addAmounts(a: string, b: string): string {
    return (parseFloat(a) + parseFloat(b)).toFixed(9);
  }

  /**
   * Helper: Subtract two amounts
   */
  private subtractAmounts(a: string, b: string): string {
    return (parseFloat(a) - parseFloat(b)).toFixed(9);
  }

  /**
   * Helper: Compare two amounts (-1: a < b, 0: a === b, 1: a > b)
   */
  private compareAmounts(a: string, b: string): number {
    const diff = parseFloat(a) - parseFloat(b);
    return diff < 0 ? -1 : diff > 0 ? 1 : 0;
  }

  /**
   * Map database row to Wallet object
   */
  private mapWallet(row: Wallet & { user_id: string; locked_balance: string; updated_at: number }): Wallet {
    return {
      userId: row.user_id,
      balance: row.balance,
      lockedBalance: row.locked_balance,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Map database row to Transaction object
   */
  private mapTransaction(
    row: Transaction & {
      user_id: string;
      balance_before: string;
      balance_after: string;
      transaction_signature?: string;
      created_at: number;
    }
  ): Transaction {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type as Transaction['type'],
      amount: row.amount,
      balanceBefore: row.balance_before,
      balanceAfter: row.balance_after,
      transactionSignature: row.transaction_signature,
      metadata: row.metadata,
      createdAt: row.created_at,
    };
  }
}
