import { Router, Request, Response } from 'express';
import { TokenService } from './service.js';

/**
 * Token API Routes
 *
 * Provides RESTful endpoints for:
 * - Getting current price and quotes
 * - Buying and selling tokens
 * - Market statistics
 * - Price history
 * - Transaction history
 */

export function createTokenRoutes(tokenService: TokenService): Router {
  const router = Router();

  /**
   * GET /token/price
   * Get current token price
   */
  router.get('/price', async (_req: Request, res: Response) => {
    try {
      const price = await tokenService.getCurrentPrice();
      res.json({
        success: true,
        price,
        timestamp: Date.now()
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /token/quote/buy?sol=1.5
   * Get quote for buying tokens
   */
  router.get('/quote/buy', async (req: Request, res: Response) => {
    try {
      const solAmount = parseFloat(req.query.sol as string);

      if (isNaN(solAmount) || solAmount <= 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid SOL amount'
        });
        return;
      }

      const quote = await tokenService.getBuyQuote(solAmount);

      res.json({
        success: true,
        quote
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /token/quote/sell?tokens=1000000
   * Get quote for selling tokens
   */
  router.get('/quote/sell', async (req: Request, res: Response) => {
    try {
      const tokenAmount = parseFloat(req.query.tokens as string);

      if (isNaN(tokenAmount) || tokenAmount <= 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid token amount'
        });
        return;
      }

      const quote = await tokenService.getSellQuote(tokenAmount);

      res.json({
        success: true,
        quote
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /token/buy
   * Execute a buy transaction
   * Body: { userPublicKey: string, solAmount: number }
   */
  router.post('/buy', async (req: Request, res: Response) => {
    try {
      const { userPublicKey, solAmount } = req.body;

      if (!userPublicKey || typeof solAmount !== 'number') {
        res.status(400).json({
          success: false,
          error: 'Invalid request body'
        });
        return;
      }

      const result = await tokenService.executeBuy(userPublicKey, solAmount);

      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /token/sell
   * Execute a sell transaction
   * Body: { userPublicKey: string, tokenAmount: number }
   */
  router.post('/sell', async (req: Request, res: Response) => {
    try {
      const { userPublicKey, tokenAmount } = req.body;

      if (!userPublicKey || typeof tokenAmount !== 'number') {
        res.status(400).json({
          success: false,
          error: 'Invalid request body'
        });
        return;
      }

      const result = await tokenService.executeSell(userPublicKey, tokenAmount);

      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /token/stats
   * Get market statistics
   */
  router.get('/stats', async (_req: Request, res: Response) => {
    try {
      const stats = await tokenService.getMarketStats();

      res.json({
        success: true,
        stats
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /token/history?timeframe=7d
   * Get price history
   */
  router.get('/history', async (req: Request, res: Response) => {
    try {
      const timeframe = (req.query.timeframe as '24h' | '7d' | '30d') || '7d';

      if (!['24h', '7d', '30d'].includes(timeframe)) {
        res.status(400).json({
          success: false,
          error: 'Invalid timeframe. Use 24h, 7d, or 30d'
        });
        return;
      }

      const history = tokenService.getPriceHistory(timeframe);

      res.json({
        success: true,
        timeframe,
        data: history
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /token/transactions?limit=50
   * Get recent transactions
   */
  router.get('/transactions', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;

      const transactions = tokenService.getRecentTransactions(limit);

      res.json({
        success: true,
        transactions
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /token/info
   * Get token metadata
   */
  router.get('/info', async (_req: Request, res: Response) => {
    try {
      res.json({
        success: true,
        token: {
          name: 'BetMonkey',
          symbol: 'BMONKEY',
          decimals: 9,
          totalSupply: 1_000_000_000,
          description: 'The official token of BetMonkey Casino. Token price is dynamically tied to casino reserves, creating natural price appreciation as the casino profits grow.',
          image: 'https://betmonkey.fun/monkey.png',
          website: 'https://betmonkey.fun',
          twitter: 'https://twitter.com/betmonkey'
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  return router;
}
