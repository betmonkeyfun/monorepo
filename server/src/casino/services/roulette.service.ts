/**
 * Roulette Service
 * Core game logic for European roulette with all bet types
 */

import { randomUUID } from 'crypto';
import { Database } from '../database/db.js';
import { WalletService } from './wallet.service.js';
import { Game, Bet, PlaceBetDto, BetType, InvalidBetError, InsufficientFundsError } from '../types/index.js';
import {
  BET_CONFIGS,
  spinRoulette,
  checkWin,
  calculateWinAmount,
  RED_NUMBERS,
  BLACK_NUMBERS,
  DOZEN_1,
  DOZEN_2,
  DOZEN_3,
  COLUMN_1,
  COLUMN_2,
  COLUMN_3,
} from '../config/roulette.config.js';

export class RouletteService {
  constructor(
    private db: Database,
    private walletService: WalletService
  ) {}

  /**
   * Deposit funds and play roulette in one atomic transaction
   */
  async depositAndPlay(
    userId: string,
    dto: PlaceBetDto,
    depositAmount: string,
    transactionSignature: string
  ): Promise<Game> {
    // Validate all bets
    this.validateBets(dto);

    // Calculate total bet amount
    const totalBetAmount = this.calculateTotalBetAmount(dto);

    // Spin the roulette
    const result = spinRoulette();

    // Create game record
    const game: Game = {
      id: randomUUID(),
      userId,
      result,
      totalBetAmount,
      totalWinAmount: '0',
      profit: '0',
      status: 'pending',
      createdAt: Date.now(),
    };

    // Process all bets and calculate winnings
    const bets: Bet[] = [];
    let totalWinAmount = 0;

    await this.db.transaction(async () => {
      // First, credit the deposit to the wallet
      await this.walletService.creditWalletInternal(userId, depositAmount, transactionSignature);

      // Now check if user has sufficient funds (after deposit)
      const wallet = await this.walletService.getWallet(userId);
      const availableBalance = this.subtractAmounts(wallet.balance, wallet.lockedBalance);

      if (this.compareAmounts(availableBalance, totalBetAmount) < 0) {
        throw new InsufficientFundsError(totalBetAmount, availableBalance);
      }

      // Lock funds
      await this.walletService.lockFunds(userId, totalBetAmount);

      // Insert game
      await this.db.run(
        `INSERT INTO games (id, user_id, result, total_bet_amount, total_win_amount, profit, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          game.id,
          game.userId,
          game.result,
          game.totalBetAmount,
          game.totalWinAmount,
          game.profit,
          game.status,
          game.createdAt,
        ]
      );

      // Process each bet
      for (const betDto of dto.bets) {
        const isWin = checkWin(betDto.numbers, result);
        const config = BET_CONFIGS[betDto.type];
        const winAmount = isWin ? calculateWinAmount(betDto.amount, config.payout) : '0';

        if (isWin) {
          totalWinAmount += parseFloat(winAmount);
        }

        const bet: Bet = {
          id: randomUUID(),
          gameId: game.id,
          userId,
          type: betDto.type,
          numbers: betDto.numbers,
          amount: betDto.amount,
          payout: config.payout,
          result: isWin ? 'win' : 'loss',
          winAmount,
          createdAt: game.createdAt,
        };

        bets.push(bet);

        // Insert bet
        await this.db.run(
          `INSERT INTO bets (id, game_id, user_id, type, numbers, amount, payout, result, win_amount, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            bet.id,
            bet.gameId,
            bet.userId,
            bet.type,
            JSON.stringify(bet.numbers),
            bet.amount,
            bet.payout,
            bet.result,
            bet.winAmount,
            bet.createdAt,
          ]
        );
      }

      // Calculate profit (positive = user won, negative = user lost)
      const totalWinAmountStr = totalWinAmount.toFixed(9);
      const profit = this.subtractAmounts(totalWinAmountStr, totalBetAmount);

      // Update game with final results
      await this.db.run(
        `UPDATE games
         SET total_win_amount = ?, profit = ?, status = ?, completed_at = ?
         WHERE id = ?`,
        [totalWinAmountStr, profit, 'completed', game.createdAt, game.id]
      );

      // Settle finances
      await this.walletService.unlockFunds(userId, totalBetAmount);

      // If user won, credit the winnings
      if (totalWinAmount > 0) {
        // User won - credit just the win amount (not the bet, that's already in the wallet)
        await this.walletService.addBalanceInternal(userId, totalWinAmountStr, `Game ${game.id} winnings`);
      }

      // Update game object for return
      game.totalWinAmount = totalWinAmountStr;
      game.profit = profit;
      game.status = 'completed';
    });

    return game;
  }

  /**
   * Place bets and play roulette game
   */
  async playRoulette(userId: string, dto: PlaceBetDto): Promise<Game> {
    // Validate all bets
    this.validateBets(dto);

    // Calculate total bet amount
    const totalBetAmount = this.calculateTotalBetAmount(dto);

    // Check if user has sufficient funds
    const wallet = await this.walletService.getWallet(userId);
    const availableBalance = this.subtractAmounts(wallet.balance, wallet.lockedBalance);

    if (this.compareAmounts(availableBalance, totalBetAmount) < 0) {
      throw new InsufficientFundsError(totalBetAmount, availableBalance);
    }

    // Spin the roulette
    const result = spinRoulette();

    // Create game record
    const game: Game = {
      id: randomUUID(),
      userId,
      result,
      totalBetAmount,
      totalWinAmount: '0',
      profit: '0',
      status: 'pending',
      createdAt: Date.now(),
    };

    // Process all bets and calculate winnings
    const bets: Bet[] = [];
    let totalWinAmount = 0;

    await this.db.transaction(async () => {
      // Lock funds
      await this.walletService.lockFunds(userId, totalBetAmount);

      // Insert game
      await this.db.run(
        `INSERT INTO games (id, user_id, result, total_bet_amount, total_win_amount, profit, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          game.id,
          game.userId,
          game.result,
          game.totalBetAmount,
          game.totalWinAmount,
          game.profit,
          game.status,
          game.createdAt,
        ]
      );

      // Process each bet
      for (const betDto of dto.bets) {
        const isWin = checkWin(betDto.numbers, result);
        const config = BET_CONFIGS[betDto.type];
        const winAmount = isWin ? calculateWinAmount(betDto.amount, config.payout) : '0';

        if (isWin) {
          totalWinAmount += parseFloat(winAmount);
        }

        const bet: Bet = {
          id: randomUUID(),
          gameId: game.id,
          userId,
          type: betDto.type,
          numbers: betDto.numbers,
          amount: betDto.amount,
          payout: config.payout,
          result: isWin ? 'win' : 'loss',
          winAmount,
          createdAt: game.createdAt,
        };

        bets.push(bet);

        // Insert bet
        await this.db.run(
          `INSERT INTO bets (id, game_id, user_id, type, numbers, amount, payout, result, win_amount, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            bet.id,
            bet.gameId,
            bet.userId,
            bet.type,
            JSON.stringify(bet.numbers),
            bet.amount,
            bet.payout,
            bet.result,
            bet.winAmount,
            bet.createdAt,
          ]
        );
      }

      // Calculate profit (positive = user won, negative = user lost)
      const totalWinAmountStr = totalWinAmount.toFixed(9);
      const profit = this.subtractAmounts(totalWinAmountStr, totalBetAmount);

      // Update game with final results
      await this.db.run(
        `UPDATE games
         SET total_win_amount = ?, profit = ?, status = ?, completed_at = ?
         WHERE id = ?`,
        [totalWinAmountStr, profit, 'completed', Date.now(), game.id]
      );

      // Unlock funds
      await this.walletService.unlockFunds(userId, totalBetAmount);

      // Deduct bet amount from balance (use internal method to avoid nested transaction)
      const wallet = await this.walletService.getWallet(userId);
      const balanceBefore = wallet.balance;
      const balanceAfter = this.subtractAmounts(balanceBefore, totalBetAmount);

      await this.db.run(
        'UPDATE wallets SET balance = ?, updated_at = ? WHERE user_id = ?',
        [balanceAfter, Date.now(), userId]
      );

      await this.db.run(
        `INSERT INTO transactions (id, user_id, type, amount, balance_before, balance_after, metadata, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          randomUUID(),
          userId,
          'loss',
          totalBetAmount,
          balanceBefore,
          balanceAfter,
          JSON.stringify({ gameId: game.id, type: 'roulette_bet' }),
          Date.now(),
        ]
      );

      // Add winnings to balance if any (use internal method to avoid nested transaction)
      if (totalWinAmount > 0) {
        await this.walletService.addBalanceInternal(
          userId,
          totalWinAmountStr,
          JSON.stringify({ gameId: game.id, type: 'roulette_win', result })
        );
      }

      // Update game object
      game.totalWinAmount = totalWinAmountStr;
      game.profit = profit;
      game.status = 'completed';
      game.completedAt = Date.now();
    });

    return game;
  }

  /**
   * Play roulette using casino balance (alias for playRoulette)
   * This method is semantically the same as playRoulette but with a clearer name
   * for when the user is explicitly using their casino balance
   */
  async playRouletteWithBalance(userId: string, dto: PlaceBetDto): Promise<Game> {
    return this.playRoulette(userId, dto);
  }

  /**
   * Get game by ID with all bets
   */
  async getGameById(gameId: string): Promise<Game & { bets: Bet[] }> {
    const game = await this.db.get<
      Game & {
        user_id: string;
        total_bet_amount: string;
        total_win_amount: string;
        created_at: number;
        completed_at?: number;
      }
    >('SELECT * FROM games WHERE id = ?', [gameId]);

    if (!game) {
      throw new InvalidBetError(`Game not found: ${gameId}`);
    }

    const bets = await this.getBetsByGameId(gameId);

    return {
      ...this.mapGame(game),
      bets,
    };
  }

  /**
   * Get user's game history
   */
  async getUserGames(userId: string, limit: number = 50, offset: number = 0): Promise<Game[]> {
    const rows = await this.db.all<
      Game & {
        user_id: string;
        total_bet_amount: string;
        total_win_amount: string;
        created_at: number;
        completed_at?: number;
      }
    >(
      `SELECT * FROM games
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    return rows.map(this.mapGame);
  }

  /**
   * Get bets for a game
   */
  async getBetsByGameId(gameId: string): Promise<Bet[]> {
    const rows = await this.db.all<
      Bet & {
        game_id: string;
        user_id: string;
        win_amount: string;
        created_at: number;
      }
    >('SELECT * FROM bets WHERE game_id = ?', [gameId]);

    return rows.map(this.mapBet);
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<{
    totalGames: number;
    totalWagered: string;
    totalWon: string;
    totalProfit: string;
    winRate: number;
  }> {
    const stats = await this.db.get<{
      total_games: number;
      total_wagered: string;
      total_won: string;
      total_profit: string;
      games_won: number;
    }>(
      `SELECT
         COUNT(*) as total_games,
         COALESCE(SUM(CAST(total_bet_amount AS REAL)), 0) as total_wagered,
         COALESCE(SUM(CAST(total_win_amount AS REAL)), 0) as total_won,
         COALESCE(SUM(CAST(profit AS REAL)), 0) as total_profit,
         SUM(CASE WHEN CAST(profit AS REAL) > 0 THEN 1 ELSE 0 END) as games_won
       FROM games
       WHERE user_id = ? AND status = 'completed'`,
      [userId]
    );

    if (!stats) {
      return {
        totalGames: 0,
        totalWagered: '0',
        totalWon: '0',
        totalProfit: '0',
        winRate: 0,
      };
    }

    return {
      totalGames: stats.total_games,
      totalWagered: Number(stats.total_wagered).toFixed(9),
      totalWon: Number(stats.total_won).toFixed(9),
      totalProfit: Number(stats.total_profit).toFixed(9),
      winRate: stats.total_games > 0 ? (stats.games_won / stats.total_games) * 100 : 0,
    };
  }

  /**
   * Helper: Normalize bet numbers for simple bets (auto-fill numbers)
   */
  private normalizeBetNumbers(type: BetType, numbers: number[]): number[] {
    // For simple bets, auto-fill the numbers if not provided
    switch (type) {
      case BetType.RED:
        return RED_NUMBERS;
      case BetType.BLACK:
        return BLACK_NUMBERS;
      case BetType.EVEN:
        return [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36];
      case BetType.ODD:
        return [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35];
      case BetType.LOW:
        return Array.from({ length: 18 }, (_, i) => i + 1);
      case BetType.HIGH:
        return Array.from({ length: 18 }, (_, i) => i + 19);
      case BetType.DOZEN:
        if (numbers.length === 1) {
          if (numbers[0] === 1) return DOZEN_1;
          if (numbers[0] === 2) return DOZEN_2;
          if (numbers[0] === 3) return DOZEN_3;
        }
        return numbers;
      case BetType.COLUMN:
        if (numbers.length === 1) {
          if (numbers[0] === 1) return COLUMN_1;
          if (numbers[0] === 2) return COLUMN_2;
          if (numbers[0] === 3) return COLUMN_3;
        }
        return numbers;
      default:
        return numbers;
    }
  }

  /**
   * Validate all bets in the request
   */
  private validateBets(dto: PlaceBetDto): void {
    for (const bet of dto.bets) {
      const config = BET_CONFIGS[bet.type];

      if (!config) {
        throw new InvalidBetError(`Invalid bet type: ${bet.type}`);
      }

      // Normalize numbers
      const normalizedNumbers = this.normalizeBetNumbers(bet.type, bet.numbers);

      // Validate numbers
      if (!config.validateNumbers(normalizedNumbers)) {
        throw new InvalidBetError(
          `Invalid numbers for ${bet.type} bet. Expected ${config.minNumbers}-${config.maxNumbers} numbers.`
        );
      }

      // Validate amount
      if (parseFloat(bet.amount) <= 0) {
        throw new InvalidBetError('Bet amount must be positive');
      }

      // Update with normalized numbers
      bet.numbers = normalizedNumbers;
    }
  }

  /**
   * Calculate total bet amount
   */
  private calculateTotalBetAmount(dto: PlaceBetDto): string {
    const total = dto.bets.reduce((sum, bet) => sum + parseFloat(bet.amount), 0);
    return total.toFixed(9);
  }

  /**
   * Helper: Subtract two amounts
   */
  private subtractAmounts(a: string, b: string): string {
    return (parseFloat(a) - parseFloat(b)).toFixed(9);
  }

  /**
   * Helper: Compare two amounts
   */
  private compareAmounts(a: string, b: string): number {
    const diff = parseFloat(a) - parseFloat(b);
    return diff < 0 ? -1 : diff > 0 ? 1 : 0;
  }

  /**
   * Map database row to Game object
   */
  private mapGame(
    row: Game & {
      user_id: string;
      total_bet_amount: string;
      total_win_amount: string;
      created_at: number;
      completed_at?: number;
    }
  ): Game {
    return {
      id: row.id,
      userId: row.user_id,
      result: row.result,
      totalBetAmount: row.total_bet_amount,
      totalWinAmount: row.total_win_amount,
      profit: row.profit,
      status: row.status as Game['status'],
      createdAt: row.created_at,
      completedAt: row.completed_at,
    };
  }

  /**
   * Map database row to Bet object
   */
  private mapBet(
    row: Bet & {
      game_id: string;
      user_id: string;
      win_amount: string;
      created_at: number;
    }
  ): Bet {
    return {
      id: row.id,
      gameId: row.game_id,
      userId: row.user_id,
      type: row.type as BetType,
      numbers: JSON.parse(row.numbers as unknown as string),
      amount: row.amount,
      payout: row.payout,
      result: row.result as Bet['result'],
      winAmount: row.win_amount,
      createdAt: row.created_at,
    };
  }
}
