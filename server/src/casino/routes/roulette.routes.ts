/**
 * Roulette Routes
 * Endpoints for playing roulette with x402 payment integration
 */

import { Router, Request, Response } from 'express';
import { RouletteService } from '../services/roulette.service.js';
import { UserService } from '../services/user.service.js';
import { PlaceBetDto, PlaceBetSchema, BetType } from '../types/index.js';
import { BET_CONFIGS } from '../config/roulette.config.js';

export function createRouletteRoutes(rouletteService: RouletteService, userService: UserService): Router {
  const router = Router();

  /**
   * GET /roulette/info
   * Get information about available bet types and payouts
   */
  router.get('/info', (_req: Request, res: Response) => {
    const betInfo = Object.values(BET_CONFIGS).map((config) => ({
      type: config.type,
      payout: config.payout,
      probability: (config.probability * 100).toFixed(2) + '%',
      description: config.description,
    }));

    res.json({
      success: true,
      data: {
        game: 'European Roulette',
        numbers: '0-36',
        houseEdge: '2.70%',
        betTypes: betInfo,
      },
    });
  });

  /**
   * POST /roulette/play
   * Play roulette game (requires x402 payment via middleware)
   * Payment is verified by x402 middleware before this handler executes
   */
  router.post('/play', async (req: Request, res: Response) => {
    try {
      // Parse and validate bet data
      const validation = PlaceBetSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid bet data',
          details: validation.error.issues,
        });
        return;
      }

      const betDto: PlaceBetDto = validation.data;

      // Get or create user based on payment info
      // In x402 flow, the clientPublicKey from payment is the wallet address
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

      // Play the game (payment already verified by x402 middleware)
      const game = await rouletteService.playRoulette(user.id, betDto);

      // Prepare response
      const won = parseFloat(game.profit) > 0;
      const response = {
        success: true,
        data: {
          gameId: game.id,
          result: game.result,
          totalBet: game.totalBetAmount,
          totalWin: game.totalWinAmount,
          profit: game.profit,
          won,
          message: won
            ? `Congratulations! You won ${game.totalWinAmount} SOL!`
            : `Sorry, you lost. The winning number was ${game.result}.`,
          payment: {
            verified: req.payment?.verified,
            amount: req.payment?.amount,
            transactionSignature: req.payment?.transactionSignature,
          },
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Roulette play error:', error);

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
   * GET /roulette/game/:gameId
   * Get details of a specific game
   */
  router.get('/game/:gameId', async (req: Request, res: Response) => {
    try {
      const { gameId } = req.params;
      const game = await rouletteService.getGameById(gameId);

      res.json({
        success: true,
        data: game,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error instanceof Error ? error.message : 'Game not found',
      });
    }
  });

  /**
   * GET /roulette/history/:walletAddress
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
      const games = await rouletteService.getUserGames(user.id, limit, offset);

      res.json({
        success: true,
        data: {
          games,
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
   * GET /roulette/stats/:walletAddress
   * Get statistics for a wallet address
   */
  router.get('/stats/:walletAddress', async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.params;

      // Get user
      const user = await userService.getUserByWallet(walletAddress);

      // Get stats
      const stats = await rouletteService.getUserStats(user.id);

      res.json({
        success: true,
        data: {
          walletAddress,
          username: user.username,
          stats,
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
   * POST /roulette/quick-bet
   * Simplified endpoint for common bets (red, black, even, odd, etc.)
   */
  router.post('/quick-bet', async (req: Request, res: Response) => {
    try {
      const { type, amount } = req.body;

      if (!type || !amount) {
        res.status(400).json({
          success: false,
          error: 'type and amount are required',
        });
        return;
      }

      // Validate bet type
      if (!Object.values(BetType).includes(type)) {
        res.status(400).json({
          success: false,
          error: `Invalid bet type: ${type}`,
        });
        return;
      }

      // Create bet DTO with auto-filled numbers
      const betDto: PlaceBetDto = {
        bets: [
          {
            type: type as BetType,
            numbers: [], // Will be auto-filled by the service
            amount: amount.toString(),
          },
        ],
      };

      // Validate with schema
      const validation = PlaceBetSchema.safeParse(betDto);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid bet data',
          details: validation.error.issues,
        });
        return;
      }

      // Get or create user
      const walletAddress = req.payment?.recipient || 'anonymous';
      let user;
      try {
        user = await userService.getUserByWallet(walletAddress);
      } catch {
        user = await userService.createUser({
          walletAddress,
          username: `player_${walletAddress.slice(0, 8)}`,
        });
      }

      // Play the game
      const game = await rouletteService.playRoulette(user.id, validation.data);

      const won = parseFloat(game.profit) > 0;
      res.json({
        success: true,
        data: {
          gameId: game.id,
          result: game.result,
          won,
          profit: game.profit,
          message: won ? `You won ${game.totalWinAmount} SOL!` : `You lost. Number was ${game.result}.`,
        },
      });
    } catch (error) {
      console.error('Quick bet error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Bet failed',
      });
    }
  });

  return router;
}
