/**
 * Database Connection and Initialization
 * SQLite database for casino operations with clean schema
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

const DB_PATH = path.join(__dirname, '../../../data/casino.db');

export class Database {
  private db: sqlite3.Database;
  private initialized: boolean = false;

  constructor() {
    this.db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Failed to connect to database:', err);
        throw err;
      }
      console.log('Connected to casino database');
    });

    // Enable foreign keys
    this.db.run('PRAGMA foreign_keys = ON');
  }

  /**
   * Initialize database schema TODO: ADD THE AGENT ADDRESS for EVERY GAME - THIS IS THE AGENT ADDRESS FOR THE CASINO ROULETTE ATTE TOMI204 @ALEJANDROSOTO204
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        wallet_address TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        created_at INTEGER NOT NULL,
        last_login_at INTEGER NOT NULL
      )
    `);

    await this.run(`
      CREATE INDEX IF NOT EXISTS idx_users_wallet
      ON users(wallet_address)
    `);

    await this.run(`
      CREATE TABLE IF NOT EXISTS wallets (
        user_id TEXT PRIMARY KEY,
        balance TEXT NOT NULL DEFAULT '0',
        locked_balance TEXT NOT NULL DEFAULT '0',
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await this.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        amount TEXT NOT NULL,
        balance_before TEXT NOT NULL,
        balance_after TEXT NOT NULL,
        transaction_signature TEXT,
        metadata TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await this.run(`
      CREATE INDEX IF NOT EXISTS idx_transactions_user
      ON transactions(user_id, created_at DESC)
    `);

    await this.run(`
      CREATE TABLE IF NOT EXISTS games (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        result INTEGER NOT NULL,
        total_bet_amount TEXT NOT NULL,
        total_win_amount TEXT NOT NULL,
        profit TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at INTEGER NOT NULL,
        completed_at INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await this.run(`
      CREATE INDEX IF NOT EXISTS idx_games_user
      ON games(user_id, created_at DESC)
    `);

    await this.run(`
      CREATE TABLE IF NOT EXISTS bets (
        id TEXT PRIMARY KEY,
        game_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        numbers TEXT NOT NULL,
        amount TEXT NOT NULL,
        payout INTEGER NOT NULL,
        result TEXT NOT NULL DEFAULT 'pending',
        win_amount TEXT NOT NULL DEFAULT '0',
        created_at INTEGER NOT NULL,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await this.run(`
      CREATE INDEX IF NOT EXISTS idx_bets_game
      ON bets(game_id)
    `);

    await this.run(`
      CREATE INDEX IF NOT EXISTS idx_bets_user
      ON bets(user_id, created_at DESC)
    `);

    // ========================================================================
    // NONCES TABLE - x402 Payment Protocol (Anti-replay protection)
    // ========================================================================
    await this.run(`
      CREATE TABLE IF NOT EXISTS nonces (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nonce TEXT UNIQUE NOT NULL,
        client_public_key TEXT NOT NULL,
        amount TEXT NOT NULL,
        recipient TEXT NOT NULL,
        resource_id TEXT NOT NULL,
        resource_url TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        expiry INTEGER NOT NULL,
        used_at INTEGER,
        transaction_signature TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.run(`
      CREATE INDEX IF NOT EXISTS idx_nonces_expiry
      ON nonces(expiry)
    `);

    await this.run(`
      CREATE INDEX IF NOT EXISTS idx_nonces_client
      ON nonces(client_public_key, created_at DESC)
    `);

    // ========================================================================
    // FACILITATOR TRANSACTIONS TABLE - x402 Transaction tracking
    // ========================================================================
    await this.run(`
      CREATE TABLE IF NOT EXISTS facilitator_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nonce TEXT NOT NULL,
        transaction_signature TEXT UNIQUE,
        status TEXT NOT NULL DEFAULT 'pending',
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (nonce) REFERENCES nonces (nonce)
      )
    `);

    await this.run(`
      CREATE INDEX IF NOT EXISTS idx_facilitator_transactions_nonce
      ON facilitator_transactions(nonce)
    `);

    this.initialized = true;
    console.log('Database schema initialized (including nonces for x402)');
  }

  /**
   * Get raw sqlite3 database instance (for sharing with other components)
   */
  getRawDatabase(): sqlite3.Database {
    return this.db;
  }

  /**
   * Execute a query that returns rows
   */
  async all<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as T[]);
      });
    });
  }

  /**
   * Execute a query that returns a single row
   */
  async get<T = unknown>(sql: string, params: unknown[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row as T | undefined);
      });
    });
  }

  /**
   * Execute a query that modifies data
   */
  async run(sql: string, params: unknown[] = []): Promise<sqlite3.RunResult> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }

  /**
   * Execute multiple queries in a transaction
   */
  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    await this.run('BEGIN TRANSACTION');
    try {
      const result = await callback();
      await this.run('COMMIT');
      return result;
    } catch (error) {
      await this.run('ROLLBACK');
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else {
          console.log('Database connection closed');
          resolve();
        }
      });
    });
  }
}

// Singleton instance
let dbInstance: Database | null = null;

export function getDatabase(): Database {
  if (!dbInstance) {
    dbInstance = new Database();
  }
  return dbInstance;
}

export async function initializeDatabase(): Promise<Database> {
  const db = getDatabase();
  await db.initialize();
  return db;
}
