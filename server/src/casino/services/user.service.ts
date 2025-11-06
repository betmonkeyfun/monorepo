/**
 * User Service
 * Clean business logic for user management
 */

import { randomUUID } from 'crypto';
import { Database } from '../database/db.js';
import { User, CreateUserDto, UserNotFoundError, CasinoError } from '../types/index.js';

export class UserService {
  constructor(private db: Database) {}

  /**
   * Create a new user
   */
  async createUser(dto: CreateUserDto): Promise<User> {
    // Check if wallet already exists
    const existing = await this.db.get<User>(
      'SELECT * FROM users WHERE wallet_address = ? OR username = ?',
      [dto.walletAddress, dto.username]
    );

    if (existing) {
      const existingWallet = (existing as any).wallet_address || existing.walletAddress;
      if (existingWallet === dto.walletAddress) {
        throw new CasinoError('Wallet address already registered', 'WALLET_EXISTS', 409);
      }
      throw new CasinoError('Username already taken', 'USERNAME_EXISTS', 409);
    }

    const now = Date.now();
    const user: User = {
      id: randomUUID(),
      walletAddress: dto.walletAddress,
      username: dto.username,
      createdAt: now,
      lastLoginAt: now,
    };

    await this.db.transaction(async () => {
      // Create user
      await this.db.run(
        `INSERT INTO users (id, wallet_address, username, created_at, last_login_at)
         VALUES (?, ?, ?, ?, ?)`,
        [user.id, user.walletAddress, user.username, user.createdAt, user.lastLoginAt]
      );

      // Create wallet
      await this.db.run(
        `INSERT INTO wallets (user_id, balance, locked_balance, updated_at)
         VALUES (?, ?, ?, ?)`,
        [user.id, '0', '0', now]
      );
    });

    return user;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User> {
    const user = await this.db.get<User & { wallet_address: string; last_login_at: number; created_at: number }>(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      throw new UserNotFoundError(userId);
    }

    return this.mapUser(user);
  }

  /**
   * Get user by wallet address
   */
  async getUserByWallet(walletAddress: string): Promise<User> {
    const user = await this.db.get<User & { wallet_address: string; last_login_at: number; created_at: number }>(
      'SELECT * FROM users WHERE wallet_address = ?',
      [walletAddress]
    );

    if (!user) {
      throw new UserNotFoundError(walletAddress);
    }

    return this.mapUser(user);
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<User> {
    const user = await this.db.get<User & { wallet_address: string; last_login_at: number; created_at: number }>(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (!user) {
      throw new UserNotFoundError(username);
    }

    return this.mapUser(user);
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(userId: string): Promise<void> {
    await this.db.run(
      'UPDATE users SET last_login_at = ? WHERE id = ?',
      [Date.now(), userId]
    );
  }

  /**
   * Check if user exists
   */
  async userExists(walletAddress: string): Promise<boolean> {
    const user = await this.db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM users WHERE wallet_address = ?',
      [walletAddress]
    );
    return (user?.count ?? 0) > 0;
  }

  /**
   * Map database row to User object
   */
  private mapUser(row: User & { wallet_address: string; last_login_at: number; created_at: number }): User {
    return {
      id: row.id,
      walletAddress: row.wallet_address,
      username: row.username,
      createdAt: row.created_at,
      lastLoginAt: row.last_login_at,
    };
  }
}
