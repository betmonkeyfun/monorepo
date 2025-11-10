import { randomUUID } from 'crypto';
import { Database } from '../database/db.js';
import { WalletService } from './wallet.service.js';
import { PokerGame, PlacePokerBetDto, InvalidBetError, InsufficientFundsError } from '../types/index.js';
import {
  dealTexasHoldem,
  evaluateBestHand,
  determineWinner,
  calculatePokerWinAmount,
  Card,
  PokerHand,
} from '../config/poker.config.js';

export class PokerService {
  constructor(
    private db: Database,
    private walletService: WalletService
  ) {}

  async depositAndPlay(
    userId: string,
    dto: PlacePokerBetDto,
    depositAmount: string,
    transactionSignature: string
  ): Promise<PokerGame> {
    this.validateBet(dto);

    const betAmount = dto.amount;

    const { playerHole, dealerHole, community } = dealTexasHoldem();

    const playerAllCards = [...playerHole, ...community];
    const dealerAllCards = [...dealerHole, ...community];

    const playerHand = evaluateBestHand(playerAllCards);
    const dealerHand = evaluateBestHand(dealerAllCards);

    const { winner } = determineWinner(playerHand, dealerHand);

    const { winAmount, dealerQualified, payoutType } = calculatePokerWinAmount(
      betAmount,
      playerHand,
      dealerHand,
      winner
    );
    const profit = this.subtractAmounts(winAmount, betAmount);

    const game: PokerGame = {
      id: randomUUID(),
      userId,
      gameType: 'texas-holdem',
      playerHole,
      dealerHole,
      community,
      playerHand,
      dealerHand,
      betAmount,
      winAmount,
      profit,
      winner,
      dealerQualified,
      payoutType,
      status: 'pending',
      createdAt: Date.now(),
    };

    await this.db.transaction(async () => {
      await this.walletService.creditWalletInternal(userId, depositAmount, transactionSignature);

      const wallet = await this.walletService.getWallet(userId);
      const availableBalance = this.subtractAmounts(wallet.balance, wallet.lockedBalance);

      if (this.compareAmounts(availableBalance, betAmount) < 0) {
        throw new InsufficientFundsError(betAmount, availableBalance);
      }

      await this.walletService.lockFunds(userId, betAmount);

      await this.db.run(
        `INSERT INTO poker_games (
          id, user_id, game_type,
          player_hole, dealer_hole, community,
          player_hand_rank, player_hand_name, player_hand_cards,
          dealer_hand_rank, dealer_hand_name, dealer_hand_cards,
          bet_amount, win_amount, profit,
          winner, dealer_qualified, payout_type, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          game.id,
          game.userId,
          game.gameType,
          JSON.stringify(game.playerHole),
          JSON.stringify(game.dealerHole),
          JSON.stringify(game.community),
          game.playerHand.rank,
          game.playerHand.name,
          JSON.stringify(game.playerHand.cards),
          game.dealerHand.rank,
          game.dealerHand.name,
          JSON.stringify(game.dealerHand.cards),
          game.betAmount,
          game.winAmount,
          game.profit,
          game.winner,
          game.dealerQualified ? 1 : 0,
          game.payoutType,
          game.status,
          game.createdAt,
        ]
      );

      // Unlock funds first (like roulette does)
      await this.walletService.unlockFunds(userId, betAmount);

      // Then deduct the bet amount from balance
      await this.walletService.deductBalanceInternal(
        userId,
        betAmount,
        JSON.stringify({ gameId: game.id, type: 'poker_bet' })
      );

      if (winner === 'player') {
        await this.walletService.addBalanceInternal(userId, winAmount, `Poker game ${game.id} winnings`);
      }

      await this.db.run(`UPDATE poker_games SET status = ?, completed_at = ? WHERE id = ?`, [
        'completed',
        game.createdAt,
        game.id,
      ]);

      game.status = 'completed';
      game.completedAt = game.createdAt;
    });

    return game;
  }

  async playPoker(userId: string, dto: PlacePokerBetDto): Promise<PokerGame> {
    this.validateBet(dto);

    const betAmount = dto.amount;

    const wallet = await this.walletService.getWallet(userId);
    const availableBalance = this.subtractAmounts(wallet.balance, wallet.lockedBalance);

    if (this.compareAmounts(availableBalance, betAmount) < 0) {
      throw new InsufficientFundsError(betAmount, availableBalance);
    }

    const { playerHole, dealerHole, community } = dealTexasHoldem();

    const playerAllCards = [...playerHole, ...community];
    const dealerAllCards = [...dealerHole, ...community];

    const playerHand = evaluateBestHand(playerAllCards);
    const dealerHand = evaluateBestHand(dealerAllCards);

    const { winner } = determineWinner(playerHand, dealerHand);

    const { winAmount, dealerQualified, payoutType } = calculatePokerWinAmount(
      betAmount,
      playerHand,
      dealerHand,
      winner
    );
    const profit = this.subtractAmounts(winAmount, betAmount);

    const game: PokerGame = {
      id: randomUUID(),
      userId,
      gameType: 'texas-holdem',
      playerHole,
      dealerHole,
      community,
      playerHand,
      dealerHand,
      betAmount,
      winAmount,
      profit,
      winner,
      dealerQualified,
      payoutType,
      status: 'pending',
      createdAt: Date.now(),
    };

    await this.db.transaction(async () => {
      await this.walletService.lockFunds(userId, betAmount);

      await this.db.run(
        `INSERT INTO poker_games (
          id, user_id, game_type,
          player_hole, dealer_hole, community,
          player_hand_rank, player_hand_name, player_hand_cards,
          dealer_hand_rank, dealer_hand_name, dealer_hand_cards,
          bet_amount, win_amount, profit,
          winner, dealer_qualified, payout_type, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          game.id,
          game.userId,
          game.gameType,
          JSON.stringify(game.playerHole),
          JSON.stringify(game.dealerHole),
          JSON.stringify(game.community),
          game.playerHand.rank,
          game.playerHand.name,
          JSON.stringify(game.playerHand.cards),
          game.dealerHand.rank,
          game.dealerHand.name,
          JSON.stringify(game.dealerHand.cards),
          game.betAmount,
          game.winAmount,
          game.profit,
          game.winner,
          game.dealerQualified ? 1 : 0,
          game.payoutType,
          game.status,
          game.createdAt,
        ]
      );

      // Unlock funds first (like roulette does)
      await this.walletService.unlockFunds(userId, betAmount);

      // Then deduct the bet amount from balance
      await this.walletService.deductBalanceInternal(
        userId,
        betAmount,
        JSON.stringify({ gameId: game.id, type: 'poker_bet' })
      );

      if (winner === 'player') {
        await this.walletService.addBalanceInternal(
          userId,
          winAmount,
          JSON.stringify({ gameId: game.id, type: 'poker_win', hand: playerHand.name })
        );
      }

      await this.db.run(`UPDATE poker_games SET status = ?, completed_at = ? WHERE id = ?`, [
        'completed',
        Date.now(),
        game.id,
      ]);

      game.status = 'completed';
      game.completedAt = Date.now();
    });

    return game;
  }

  async getGameById(gameId: string): Promise<PokerGame> {
    const row = await this.db.get<{
      id: string;
      user_id: string;
      game_type: string;
      player_hole: string;
      dealer_hole: string;
      community: string;
      player_hand_rank: number;
      player_hand_name: string;
      player_hand_cards: string;
      dealer_hand_rank: number;
      dealer_hand_name: string;
      dealer_hand_cards: string;
      bet_amount: string;
      win_amount: string;
      profit: string;
      winner: string;
      dealer_qualified: number;
      payout_type: string;
      status: string;
      created_at: number;
      completed_at?: number;
    }>('SELECT * FROM poker_games WHERE id = ?', [gameId]);

    if (!row) {
      throw new InvalidBetError(`Poker game not found: ${gameId}`);
    }

    return this.mapGame(row);
  }

  async getUserGames(userId: string, limit: number = 50, offset: number = 0): Promise<PokerGame[]> {
    const rows = await this.db.all<{
      id: string;
      user_id: string;
      game_type: string;
      player_hole: string;
      dealer_hole: string;
      community: string;
      player_hand_rank: number;
      player_hand_name: string;
      player_hand_cards: string;
      dealer_hand_rank: number;
      dealer_hand_name: string;
      dealer_hand_cards: string;
      bet_amount: string;
      win_amount: string;
      profit: string;
      winner: string;
      dealer_qualified: number;
      payout_type: string;
      status: string;
      created_at: number;
      completed_at?: number;
    }>(
      `SELECT * FROM poker_games
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    return rows.map((row) => this.mapGame(row));
  }

  async getUserStats(userId: string): Promise<{
    totalGames: number;
    totalWagered: string;
    totalWon: string;
    totalProfit: string;
    winRate: number;
    handStats: Record<string, number>;
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
         COALESCE(SUM(CAST(bet_amount AS REAL)), 0) as total_wagered,
         COALESCE(SUM(CAST(win_amount AS REAL)), 0) as total_won,
         COALESCE(SUM(CAST(profit AS REAL)), 0) as total_profit,
         SUM(CASE WHEN winner = 'player' THEN 1 ELSE 0 END) as games_won
       FROM poker_games
       WHERE user_id = ? AND status = 'completed'`,
      [userId]
    );

    const handRows = await this.db.all<{
      player_hand_name: string;
      count: number;
    }>(
      `SELECT player_hand_name, COUNT(*) as count
       FROM poker_games
       WHERE user_id = ? AND status = 'completed'
       GROUP BY player_hand_name`,
      [userId]
    );

    const handStats: Record<string, number> = {};
    for (const row of handRows) {
      handStats[row.player_hand_name] = row.count;
    }

    if (!stats) {
      return {
        totalGames: 0,
        totalWagered: '0',
        totalWon: '0',
        totalProfit: '0',
        winRate: 0,
        handStats: {},
      };
    }

    return {
      totalGames: stats.total_games,
      totalWagered: Number(stats.total_wagered).toFixed(9),
      totalWon: Number(stats.total_won).toFixed(9),
      totalProfit: Number(stats.total_profit).toFixed(9),
      winRate: stats.total_games > 0 ? (stats.games_won / stats.total_games) * 100 : 0,
      handStats,
    };
  }

  private validateBet(dto: PlacePokerBetDto): void {
    const amount = parseFloat(dto.amount);

    if (amount <= 0) {
      throw new InvalidBetError('Bet amount must be positive');
    }

    if (isNaN(amount)) {
      throw new InvalidBetError('Invalid bet amount');
    }
  }

  private subtractAmounts(a: string, b: string): string {
    return (parseFloat(a) - parseFloat(b)).toFixed(9);
  }

  private compareAmounts(a: string, b: string): number {
    const diff = parseFloat(a) - parseFloat(b);
    return diff < 0 ? -1 : diff > 0 ? 1 : 0;
  }

  private mapGame(row: {
    id: string;
    user_id: string;
    game_type: string;
    player_hole: string;
    dealer_hole: string;
    community: string;
    player_hand_rank: number;
    player_hand_name: string;
    player_hand_cards: string;
    dealer_hand_rank: number;
    dealer_hand_name: string;
    dealer_hand_cards: string;
    bet_amount: string;
    win_amount: string;
    profit: string;
    winner: string;
    dealer_qualified: number;
    payout_type: string;
    status: string;
    created_at: number;
    completed_at?: number;
  }): PokerGame {
    const playerHand: PokerHand = {
      rank: row.player_hand_rank,
      name: row.player_hand_name,
      cards: JSON.parse(row.player_hand_cards) as Card[],
      values: [],
    };

    const dealerHand: PokerHand = {
      rank: row.dealer_hand_rank,
      name: row.dealer_hand_name,
      cards: JSON.parse(row.dealer_hand_cards) as Card[],
      values: [],
    };

    return {
      id: row.id,
      userId: row.user_id,
      gameType: row.game_type as 'texas-holdem',
      playerHole: JSON.parse(row.player_hole) as Card[],
      dealerHole: JSON.parse(row.dealer_hole) as Card[],
      community: JSON.parse(row.community) as Card[],
      playerHand,
      dealerHand,
      betAmount: row.bet_amount,
      winAmount: row.win_amount,
      profit: row.profit,
      winner: row.winner as 'player' | 'dealer' | 'tie',
      dealerQualified: row.dealer_qualified === 1,
      payoutType: row.payout_type as PokerGame['payoutType'],
      status: row.status as PokerGame['status'],
      createdAt: row.created_at,
      completedAt: row.completed_at,
    };
  }
}
