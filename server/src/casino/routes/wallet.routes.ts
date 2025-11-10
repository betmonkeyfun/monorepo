/**
 * Wallet Routes
 * Manage user balance, deposits, and withdrawals
 */

import { Router, Request, Response } from 'express';
import { WalletService } from '../services/wallet.service.js';
import { UserService } from '../services/user.service.js';
import { WithdrawDto, WithdrawSchema } from '../types/index.js';

export function createWalletRoutes(walletService: WalletService, userService: UserService): Router {
  const router = Router();

  /**
   * GET /wallet/balance/:walletAddress
   * Get wallet balance for a user
   */
  router.get('/balance/:walletAddress', async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.params;

      // Get user
      const user = await userService.getUserByWallet(walletAddress);

      // Get wallet
      const wallet = await walletService.getWallet(user.id);

      res.json({
        success: true,
        data: {
          walletAddress,
          username: user.username,
          balance: wallet.balance,
          lockedBalance: wallet.lockedBalance,
          availableBalance: (parseFloat(wallet.balance) - parseFloat(wallet.lockedBalance)).toFixed(9),
          updatedAt: wallet.updatedAt,
        },
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error instanceof Error ? error.message : 'Wallet not found',
      });
    }
  });

  router.post('/deposit', async (req: Request, res: Response) => {
    try {
      const { amount } = req.body;

      if (!amount) {
        res.status(400).json({
          success: false,
          error: 'amount is required',
        });
        return;
      }

      const walletAddress = req.payment?.recipient;

      if (!walletAddress) {
        res.status(400).json({
          success: false,
          error: 'Payment information required',
        });
        return;
      }

      let user;
      try {
        user = await userService.getUserByWallet(walletAddress);
      } catch {
        user = await userService.createUser({
          walletAddress,
          username: `player_${walletAddress.slice(0, 8)}`,
        });
      }

      const transaction = await walletService.creditWalletInternal(
        user.id,
        amount,
        req.payment?.transactionSignature || ''
      );

      const wallet = await walletService.getWallet(user.id);

      res.json({
        success: true,
        data: {
          message: 'Deposit successful',
          transaction: {
            id: transaction.id,
            amount: transaction.amount,
            balanceBefore: transaction.balanceBefore,
            balanceAfter: transaction.balanceAfter,
            transactionSignature: transaction.transactionSignature,
            createdAt: transaction.createdAt,
          },
          wallet: {
            balance: wallet.balance,
            lockedBalance: wallet.lockedBalance,
            availableBalance: (parseFloat(wallet.balance) - parseFloat(wallet.lockedBalance)).toFixed(9),
          },
          payment: {
            verified: req.payment?.verified,
            amount: req.payment?.amount,
            transactionSignature: req.payment?.transactionSignature,
          },
        },
      });
    } catch (error) {
      console.error('Deposit error:', error);

      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Deposit failed',
      });
    }
  });

  /**
   * POST /wallet/withdraw
   * Withdraw funds from casino wallet to user's Solana wallet
   * Requires x402 payment for transaction fee
   */
  router.post('/withdraw', async (req: Request, res: Response) => {
    try {
      const validation = WithdrawSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid withdrawal data',
          details: validation.error.issues,
        });
        return;
      }

      const dto: WithdrawDto = validation.data;

      // Get wallet address from payment or body
      const walletAddress = dto.destinationAddress;

      // Get user
      const user = await userService.getUserByWallet(walletAddress);

      // Process withdrawal
      const transaction = await walletService.withdraw(user.id, dto);

      res.json({
        success: true,
        data: {
          message: 'Withdrawal processed successfully',
          transaction: {
            id: transaction.id,
            amount: transaction.amount,
            balanceBefore: transaction.balanceBefore,
            balanceAfter: transaction.balanceAfter,
            transactionSignature: transaction.transactionSignature,
            createdAt: transaction.createdAt,
          },
        },
      });
    } catch (error) {
      console.error('Withdrawal error:', error);

      const statusCode = (error as any).statusCode || 400;
      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : 'Withdrawal failed',
        code: (error as any).code || 'WITHDRAWAL_ERROR',
      });
    }
  });

  /**
   * GET /wallet/transactions/:walletAddress
   * Get transaction history for a wallet
   */
  router.get('/transactions/:walletAddress', async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      // Get user
      const user = await userService.getUserByWallet(walletAddress);

      // Get transactions
      const transactions = await walletService.getTransactions(user.id, limit, offset);

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            limit,
            offset,
          },
        },
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error instanceof Error ? error.message : 'User not found',
      });
    }
  });

  return router;
}
