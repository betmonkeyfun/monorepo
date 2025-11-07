/**
 * BetMonkey Casino Server
 * European Roulette with x402 payment integration
 * Built with clean architecture and type safety
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { initializeDatabase, getDatabase } from './database/db.js';
import { UserService } from './services/user.service.js';
import { WalletService } from './services/wallet.service.js';
import { RouletteService } from './services/roulette.service.js';
import { createRouletteRoutes } from './routes/roulette.routes.js';
import { createWalletRoutes } from './routes/wallet.routes.js';
import { createX402MiddlewareWithUtils } from '../lib/x402-middleware.js';
import { CasinoError } from './types/index.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const PORT = process.env.CASINO_PORT || 3003;
const FACILITATOR_URL = process.env.FACILITATOR_URL || 'http://localhost:3001';
const MERCHANT_ADDRESS = process.env.MERCHANT_SOLANA_ADDRESS || '';
const SOLANA_NETWORK = process.env.SOLANA_NETWORK || 'devnet';

// Bet amounts in SOL
const BET_AMOUNTS = {
  QUICK_BET: '0.001',     // 0.001 SOL for quick bets
  CUSTOM_BET: '0.01',     // 0.01 SOL minimum for custom bets
  TRANSACTION_FEE: '0.0001', // Fee for withdrawals
};

// ============================================================================
// INITIALIZE APP
// ============================================================================

const app: Express = express();

// Security and middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// ERROR HANDLER MIDDLEWARE
// ============================================================================

function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error('Error:', err);

  if (err instanceof CasinoError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
}

// ============================================================================
// INITIALIZE SERVICES
// ============================================================================

async function initializeServices() {
  console.log('Initializing database...');
  const db = await initializeDatabase();

  console.log('Initializing services...');
  const userService = new UserService(db);
  const walletService = new WalletService(db);
  const rouletteService = new RouletteService(db, walletService);

  return { db, userService, walletService, rouletteService };
}

// ============================================================================
// SETUP ROUTES
// ============================================================================

async function setupRoutes() {
  const { userService, walletService, rouletteService } = await initializeServices();

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        service: 'BetMonkey Casino',
        timestamp: new Date().toISOString(),
      },
    });
  });

  // Welcome endpoint
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        name: 'BetMonkey Casino',
        version: '1.0.0',
        game: 'European Roulette',
        description: 'Play roulette with Solana payments via x402 protocol',
        endpoints: {
          info: 'GET /roulette/info - Get game information',
          play: 'POST /roulette/play - Play roulette (requires x402 payment)',
          quickBet: 'POST /roulette/quick-bet - Quick bet (red/black/even/odd)',
          history: 'GET /roulette/history/:walletAddress - Get game history',
          stats: 'GET /roulette/stats/:walletAddress - Get player statistics',
          balance: 'GET /wallet/balance/:walletAddress - Check balance',
          withdraw: 'POST /wallet/withdraw - Withdraw winnings',
          transactions: 'GET /wallet/transactions/:walletAddress - Transaction history',
        },
      },
    });
  });

  // ========================================================================
  // PUBLIC ROUTES (No payment required)
  // ========================================================================

  app.use('/roulette', createRouletteRoutes(rouletteService, userService));
  app.use('/wallet', createWalletRoutes(walletService, userService));

  // ========================================================================
  // PROTECTED ROUTES WITH x402 PAYMENT
  // ========================================================================

  // Quick bet endpoint (simple bets like red/black) - requires payment
  const quickBetMiddleware = createX402MiddlewareWithUtils(
    {
      amount: BET_AMOUNTS.QUICK_BET,
      payTo: MERCHANT_ADDRESS,
      asset: 'SOL',
      network: `solana-${SOLANA_NETWORK}`,
    },
    {
      facilitatorUrl: FACILITATOR_URL,
      timeout: 30000,
      retryAttempts: 3,
    }
  );

  app.post('/play/quick', quickBetMiddleware.middleware, async (req: Request, res: Response) => {
    try {
      const { type } = req.body;

      if (!type) {
        res.status(400).json({
          success: false,
          error: 'Bet type is required (red, black, even, odd, low, high)',
        });
        return;
      }

      // Create bet DTO
      req.body.amount = BET_AMOUNTS.QUICK_BET;

      // Get or create user (use client public key, not merchant address)
      const walletAddress = req.payment?.clientPublicKey || 'anonymous';
      let user;
      try {
        user = await userService.getUserByWallet(walletAddress);
      } catch {
        user = await userService.createUser({
          walletAddress,
          username: `player_${walletAddress.slice(0, 8)}`,
        });
      }

      // Play game with deposit in one atomic transaction
      const betDto = {
        bets: [
          {
            type: type as any,
            numbers: [],
            amount: BET_AMOUNTS.QUICK_BET,
          },
        ],
      };

      // Convert payment amount from lamports to SOL
      const paymentAmountSOL = req.payment?.amount
        ? (BigInt(req.payment.amount) / BigInt(1e9)).toString() +
          '.' +
          (BigInt(req.payment.amount) % BigInt(1e9)).toString().padStart(9, '0')
        : '0.001';

      const game = await rouletteService.depositAndPlay(
        user.id,
        betDto,
        paymentAmountSOL,
        req.payment?.transactionSignature || 'internal'
      );
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
      console.error('Quick play error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Game failed',
      });
    }
  });

  // Custom bet endpoint - requires higher payment for multiple bets
  const customBetMiddleware = createX402MiddlewareWithUtils(
    {
      amount: BET_AMOUNTS.CUSTOM_BET,
      payTo: MERCHANT_ADDRESS,
      asset: 'SOL',
      network: `solana-${SOLANA_NETWORK}`,
    },
    {
      facilitatorUrl: FACILITATOR_URL,
      timeout: 30000,
      retryAttempts: 3,
    }
  );

  app.post('/play/custom', customBetMiddleware.middleware, async (req: Request, res: Response) => {
    try {
      // Get or create user (use client public key, not merchant address)
      const walletAddress = req.payment?.clientPublicKey || 'anonymous';
      let user;
      try {
        user = await userService.getUserByWallet(walletAddress);
      } catch {
        user = await userService.createUser({
          walletAddress,
          username: `player_${walletAddress.slice(0, 8)}`,
        });
      }

      // Play game with deposit in one atomic transaction
      // Convert payment amount from lamports to SOL
      const paymentAmountSOL = req.payment?.amount
        ? (BigInt(req.payment.amount) / BigInt(1e9)).toString() +
          '.' +
          (BigInt(req.payment.amount) % BigInt(1e9)).toString().padStart(9, '0')
        : '0.01';

      const game = await rouletteService.depositAndPlay(
        user.id,
        req.body,
        paymentAmountSOL,
        req.payment?.transactionSignature || 'internal'
      );
      const won = parseFloat(game.profit) > 0;

      res.json({
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
      });
    } catch (error) {
      console.error('Custom play error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Game failed',
      });
    }
  });

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: 'Endpoint not found',
      code: 'NOT_FOUND',
    });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}

// ============================================================================
// START SERVER
// ============================================================================

async function startServer() {
  try {
    await setupRoutes();

    app.listen(PORT, () => {
      console.log('');
      console.log('╔═══════════════════════════════════════════════════════╗');
      console.log('║                                                       ║');
      console.log('║            🎰 BETMONKEY CASINO 🎰                     ║');
      console.log('║         European Roulette with x402                   ║');
      console.log('║                                                       ║');
      console.log('╚═══════════════════════════════════════════════════════╝');
      console.log('');
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Facilitator: ${FACILITATOR_URL}`);
      console.log(`✓ Network: ${SOLANA_NETWORK}`);
      console.log(`✓ Merchant: ${MERCHANT_ADDRESS || 'NOT SET'}`);
      console.log('');
      console.log('Available endpoints:');
      console.log('  GET  / - API information');
      console.log('  GET  /health - Health check');
      console.log('  GET  /roulette/info - Game information');
      console.log('  POST /play/quick - Quick bet (requires x402 payment)');
      console.log('  POST /play/custom - Custom bet (requires x402 payment)');
      console.log('  GET  /roulette/history/:wallet - Game history');
      console.log('  GET  /roulette/stats/:wallet - Player statistics');
      console.log('  GET  /wallet/balance/:wallet - Check balance');
      console.log('  POST /wallet/withdraw - Withdraw winnings');
      console.log('  GET  /wallet/transactions/:wallet - Transaction history');
      console.log('');
    });
  } catch (error) {
    console.error('Failed to start casino server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  console.log('\nShutting down casino server...');
  const db = getDatabase();
  await db.close();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the server
startServer();

export { app };
