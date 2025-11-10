/**
 * Poker Routes
 * Endpoints for playing Texas Hold'em with x402 payment integration
 */

import { Router, Request, Response } from 'express';
import { PokerService } from '../services/poker.service.js';
import { UserService } from '../services/user.service.js';
import { PlacePokerBetDto, PlacePokerBetSchema } from '../types/index.js';
import { POKER_PAYOUTS, cardsToString } from '../config/poker.config.js';

export function createPokerRoutes(pokerService: PokerService, userService: UserService): Router {
  const router = Router();

  /**
   * GET /poker/info
   * Get information about poker payouts and rules
   */
  router.get('/info', (_req: Request, res: Response) => {
    const payoutInfo = Object.values(POKER_PAYOUTS)
      .sort((a, b) => b.rank - a.rank)
      .map((config) => ({
        rank: config.rank,
        name: config.name,
        payout: `${config.payout}:1`,
        description: config.description,
      }));

    res.json({
      success: true,
      data: {
        game: 'Texas Hold\'em (Simplified)',
        variant: 'Player vs Dealer',
        rules: [
          'Player and dealer each get 2 hole cards',
          '5 community cards are dealt',
          'Best 5-card hand wins',
          'Higher hand ranks win bigger payouts',
        ],
        payouts: payoutInfo,
      },
    });
  });

  /**
   * POST /poker/play
   * Play poker game (requires x402 payment via middleware)
   */
  router.post('/play', async (req: Request, res: Response) => {
    try {
      // Parse and validate bet data
      const validation = PlacePokerBetSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid bet data',
          details: validation.error.issues,
        });
        return;
      }

      const betDto: PlacePokerBetDto = validation.data;

      // Get or create user based on payment info
      const walletAddress = req.payment?.recipient || 'anonymous';

      let user;
      try {
        user = await userService.getUserByWallet(walletAddress);
      } catch {
        // Create user if doesn't exist
        user = await userService.createUser({
          walletAddress,
          username: `player_${walletAddress.slice(0, 8)}`,
        });
      }

      // Play the game
      const game = await pokerService.playPoker(user.id, betDto);

      // Prepare response
      const won = game.winner === 'player';
      const tied = game.winner === 'tie';

      const response = {
        success: true,
        data: {
          gameId: game.id,
          playerHole: game.playerHole.map((c) => `${c.rank}${c.suit[0].toUpperCase()}`),
          dealerHole: game.dealerHole.map((c) => `${c.rank}${c.suit[0].toUpperCase()}`),
          community: game.community.map((c) => `${c.rank}${c.suit[0].toUpperCase()}`),
          playerHand: {
            name: game.playerHand.name,
            cards: cardsToString(game.playerHand.cards),
          },
          dealerHand: {
            name: game.dealerHand.name,
            cards: cardsToString(game.dealerHand.cards),
          },
          winner: game.winner,
          betAmount: game.betAmount,
          winAmount: game.winAmount,
          profit: game.profit,
          message: tied
            ? `It's a tie! You get your bet back.`
            : won
              ? `Congratulations! You won with ${game.playerHand.name}! +${game.winAmount} SOL`
              : `You lost. Dealer had ${game.dealerHand.name}.`,
          payment: {
            verified: req.payment?.verified,
            amount: req.payment?.amount,
            transactionSignature: req.payment?.transactionSignature,
          },
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Poker play error:', error);

      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: error.message,
          code: (error as any).code || 'GAME_ERROR',
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
        });
      }
    }
  });

  /**
   * GET /poker/game/:gameId
   * Get details of a specific game
   */
  router.get('/game/:gameId', async (req: Request, res: Response) => {
    try {
      const { gameId } = req.params;
      const game = await pokerService.getGameById(gameId);

      res.json({
        success: true,
        data: {
          gameId: game.id,
          playerHole: game.playerHole.map((c) => `${c.rank}${c.suit[0].toUpperCase()}`),
          dealerHole: game.dealerHole.map((c) => `${c.rank}${c.suit[0].toUpperCase()}`),
          community: game.community.map((c) => `${c.rank}${c.suit[0].toUpperCase()}`),
          playerHand: {
            name: game.playerHand.name,
            cards: cardsToString(game.playerHand.cards),
          },
          dealerHand: {
            name: game.dealerHand.name,
            cards: cardsToString(game.dealerHand.cards),
          },
          winner: game.winner,
          betAmount: game.betAmount,
          winAmount: game.winAmount,
          profit: game.profit,
          status: game.status,
          createdAt: game.createdAt,
          completedAt: game.completedAt,
        },
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error instanceof Error ? error.message : 'Game not found',
      });
    }
  });

  /**
   * GET /poker/history/:walletAddress
   * Get game history for a wallet address
   */
  router.get('/history/:walletAddress', async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      // Get user
      const user = await userService.getUserByWallet(walletAddress);

      // Get games
      const games = await pokerService.getUserGames(user.id, limit, offset);

      const formattedGames = games.map((game) => ({
        gameId: game.id,
        playerHand: game.playerHand.name,
        dealerHand: game.dealerHand.name,
        winner: game.winner,
        betAmount: game.betAmount,
        winAmount: game.winAmount,
        profit: game.profit,
        createdAt: game.createdAt,
      }));

      res.json({
        success: true,
        data: {
          games: formattedGames,
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

  /**
   * GET /poker/stats/:walletAddress
   * Get statistics for a wallet address
   */
  router.get('/stats/:walletAddress', async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.params;

      // Get user
      const user = await userService.getUserByWallet(walletAddress);

      // Get stats
      const stats = await pokerService.getUserStats(user.id);

      res.json({
        success: true,
        data: {
          walletAddress,
          username: user.username,
          stats: {
            totalGames: stats.totalGames,
            totalWagered: stats.totalWagered,
            totalWon: stats.totalWon,
            totalProfit: stats.totalProfit,
            winRate: `${stats.winRate.toFixed(2)}%`,
            handStats: stats.handStats,
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

  /**
   * POST /poker/play-with-balance
   * Play poker using casino balance (no payment signature required)
   */
  router.post('/play-with-balance', async (req: Request, res: Response) => {
    try {
      const { walletAddress, amount } = req.body;

      if (!walletAddress || !amount) {
        res.status(400).json({
          success: false,
          error: 'walletAddress and amount are required',
        });
        return;
      }

      // Create bet DTO
      const betDto: PlacePokerBetDto = {
        amount: amount.toString(),
      };

      // Validate with schema
      const validation = PlacePokerBetSchema.safeParse(betDto);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid bet data',
          details: validation.error.issues,
        });
        return;
      }

      // Get user
      let user;
      try {
        user = await userService.getUserByWallet(walletAddress);
      } catch {
        res.status(404).json({
          success: false,
          error: 'User not found. Please deposit first.',
        });
        return;
      }

      // Play the game (will deduct from balance)
      const game = await pokerService.playPoker(user.id, validation.data);

      // Prepare response
      const won = game.winner === 'player';
      const tied = game.winner === 'tie';

      res.json({
        success: true,
        data: {
          gameId: game.id,
          playerHole: game.playerHole.map((c) => `${c.rank}${c.suit[0].toUpperCase()}`),
          dealerHole: game.dealerHole.map((c) => `${c.rank}${c.suit[0].toUpperCase()}`),
          community: game.community.map((c) => `${c.rank}${c.suit[0].toUpperCase()}`),
          playerHand: {
            name: game.playerHand.name,
            cards: cardsToString(game.playerHand.cards),
          },
          dealerHand: {
            name: game.dealerHand.name,
            cards: cardsToString(game.dealerHand.cards),
          },
          winner: game.winner,
          won,
          tied,
          dealerQualified: game.dealerQualified,
          payoutType: game.payoutType,
          betAmount: game.betAmount,
          winAmount: game.winAmount,
          profit: game.profit,
          message: tied
            ? `It's a tie! You get your bet back.`
            : won
              ? `Congratulations! You won with ${game.playerHand.name}! +${game.winAmount} SOL`
              : `You lost. Dealer had ${game.dealerHand.name}.`,
        },
      });
    } catch (error) {
      console.error('Balance poker error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Bet failed',
      });
    }
  });

  return router;
}
