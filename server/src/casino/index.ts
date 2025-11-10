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
import { PokerService } from './services/poker.service.js';
import { createRouletteRoutes } from './routes/roulette.routes.js';
import { createPokerRoutes } from './routes/poker.routes.js';
import { createWalletRoutes } from './routes/wallet.routes.js';
import { createX402MiddlewareWithUtils } from '../lib/x402-middleware.js';
import { CasinoError } from './types/index.js';
import { initializeTokenSystem, createTokenRoutes } from '../token/index.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const PORT = process.env.CASINO_PORT || 3003;
const FACILITATOR_URL = process.env.FACILITATOR_URL || 'http://localhost:3001';
const MERCHANT_ADDRESS = process.env.MERCHANT_SOLANA_ADDRESS || '';
const SOLANA_NETWORK = process.env.SOLANA_NETWORK || 'devnet';

// Bet amounts in SOL
const BET_AMOUNTS = {
  QUICK_BET: '0.001', // 0.001 SOL for quick bets
  CUSTOM_BET: '0.01', // 0.01 SOL minimum for custom bets
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
  const pokerService = new PokerService(db, walletService);

  return { db, userService, walletService, rouletteService, pokerService };
}

// ============================================================================
// SETUP ROUTES
// ============================================================================

async function setupRoutes() {
  const { db, userService, walletService, rouletteService, pokerService } = await initializeServices();

  // Initialize token system
  let tokenService;
  try {
    tokenService = await initializeTokenSystem(db);
    console.log('Token system enabled');
  } catch (error) {
    console.warn('Token system not initialized:', error instanceof Error ? error.message : 'Unknown error');
    console.warn('Casino will run without token functionality');
  }

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

  // Facilitator proxy - forward all /facilitator/* requests to internal facilitator service
  app.use('/facilitator', async (req: Request, res: Response) => {
    try {
      const facilitatorUrl = `${FACILITATOR_URL}${req.url}`;
      const response = await fetch(facilitatorUrl, {
        method: req.method,
        headers: req.headers as any,
        body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
      });

      const data = await response.text();
      res.status(response.status)
        .set(Object.fromEntries(response.headers.entries()))
        .send(data);
    } catch (error) {
      console.error('Facilitator proxy error:', error);
      res.status(502).json({
        success: false,
        error: 'Failed to reach facilitator service',
      });
    }
  });

  // Welcome endpoint
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        name: 'BetMonkey Casino',
        version: '1.0.0',
        games: ['European Roulette', "Texas Hold'em Poker"],
        description: 'Play casino games with Solana payments via x402 protocol',
        endpoints: {
          roulette: {
            info: 'GET /roulette/info - Get game information',
            play: 'POST /roulette/play - Play roulette (requires x402 payment)',
            quickBet: 'POST /roulette/quick-bet - Quick bet (red/black/even/odd)',
            history: 'GET /roulette/history/:walletAddress - Get game history',
            stats: 'GET /roulette/stats/:walletAddress - Get player statistics',
          },
          poker: {
            info: 'GET /poker/info - Get poker payouts and rules',
            play: 'POST /poker/play - Play poker (requires x402 payment)',
            history: 'GET /poker/history/:walletAddress - Get game history',
            stats: 'GET /poker/stats/:walletAddress - Get player statistics',
          },
          wallet: {
            balance: 'GET /wallet/balance/:walletAddress - Check balance',
            withdraw: 'POST /wallet/withdraw - Withdraw winnings',
            transactions: 'GET /wallet/transactions/:walletAddress - Transaction history',
          },
        },
      },
    });
  });

  // ========================================================================
  // PUBLIC ROUTES (No payment required)
  // ========================================================================

  app.use('/roulette', createRouletteRoutes(rouletteService, userService));
  app.use('/poker', createPokerRoutes(pokerService, userService));
  app.use('/wallet', createWalletRoutes(walletService, userService));

  // Token routes (if enabled)
  if (tokenService) {
    app.use('/token', createTokenRoutes(tokenService));
    console.log('Token API enabled at /token');

    // Token buy with x402 payment
    const tokenBuyMiddleware = createX402MiddlewareWithUtils(
      {
        amount: '0.01', // Dynamic - will be overridden by request
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

    app.post('/token/buy-x402', tokenBuyMiddleware.middleware, async (req: Request, res: Response) => {
      try {
        const { amount } = req.body; // Amount in SOL to spend

        if (!amount || parseFloat(amount) <= 0) {
          res.status(400).json({
            success: false,
            error: 'Invalid amount'
          });
          return;
        }

        const walletAddress = req.payment?.clientPublicKey || 'anonymous';
        const paymentAmountSOL = req.payment?.amount
          ? (BigInt(req.payment.amount) / BigInt(1e9)).toString() +
            '.' +
            (BigInt(req.payment.amount) % BigInt(1e9)).toString().padStart(9, '0')
          : amount;

        // Execute token purchase
        const result = await tokenService.executeBuy(walletAddress, parseFloat(paymentAmountSOL));

        res.json({
          success: result.success,
          data: {
            tokenAmount: result.quote.tokenAmount,
            solPaid: paymentAmountSOL,
            pricePerToken: result.quote.pricePerToken,
            priceImpact: result.quote.priceImpact,
            transactionSignature: result.txSignature
          },
          payment: {
            verified: req.payment?.verified,
            amount: req.payment?.amount,
            transactionSignature: req.payment?.transactionSignature,
          }
        });
      } catch (error) {
        console.error('Token buy error:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Token purchase failed'
        });
      }
    });
  }

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

  // Poker endpoint - requires payment
  const pokerMiddleware = createX402MiddlewareWithUtils(
    {
      amount: BET_AMOUNTS.CUSTOM_BET, // 0.01 SOL for poker
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

  app.post('/play/poker', pokerMiddleware.middleware, async (req: Request, res: Response) => {
    try {
      const { amount } = req.body;

      if (!amount) {
        res.status(400).json({
          success: false,
          error: 'Bet amount is required',
        });
        return;
      }

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

      const paymentAmountSOL = req.payment?.amount
        ? (BigInt(req.payment.amount) / BigInt(1e9)).toString() +
          '.' +
          (BigInt(req.payment.amount) % BigInt(1e9)).toString().padStart(9, '0')
        : amount;

      const betDto = { amount };

      const game = await pokerService.depositAndPlay(
        user.id,
        betDto,
        paymentAmountSOL,
        req.payment?.transactionSignature || 'internal'
      );

      const won = game.winner === 'player';
      const tied = game.winner === 'tie';

      let message = '';
      if (tied) {
        message = `It's a tie! You get your bet back.`;
      } else if (won) {
        if (!game.dealerQualified) {
          message = `Dealer doesn't qualify (needs Pair+). You win ante only: +${game.winAmount} SOL`;
        } else {
          message = `Congratulations! You won with ${game.playerHand.name}! +${game.winAmount} SOL`;
        }
      } else {
        message = `You lost. Dealer had ${game.dealerHand.name}.`;
      }

      res.json({
        success: true,
        data: {
          gameId: game.id,
          playerHole: game.playerHole.map((c) => `${c.rank}${c.suit[0].toUpperCase()}`),
          dealerHole: game.dealerHole.map((c) => `${c.rank}${c.suit[0].toUpperCase()}`),
          community: game.community.map((c) => `${c.rank}${c.suit[0].toUpperCase()}`),
          playerHand: {
            name: game.playerHand.name,
            cards: game.playerHand.cards.map((c) => `${c.rank}${c.suit[0].toUpperCase()}`).join(' '),
          },
          dealerHand: {
            name: game.dealerHand.name,
            cards: game.dealerHand.cards.map((c) => `${c.rank}${c.suit[0].toUpperCase()}`).join(' '),
          },
          winner: game.winner,
          won,
          tied,
          dealerQualified: game.dealerQualified,
          payoutType: game.payoutType,
          betAmount: game.betAmount,
          winAmount: game.winAmount,
          profit: game.profit,
          message,
          payment: {
            verified: req.payment?.verified,
            amount: req.payment?.amount,
            transactionSignature: req.payment?.transactionSignature,
          },
        },
      });
    } catch (error) {
      console.error('Poker play error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Game failed',
      });
    }
  });

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

    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log('');
      console.log('╔═══════════════════════════════════════════════════════╗');
      console.log('║                                                       ║');
      console.log('║            🎰 BETMONKEY CASINO 🎰                     ║');
      console.log('║      Roulette & Poker with x402 Payments             ║');
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
      console.log('');
      console.log('  Roulette:');
      console.log('    GET  /roulette/info - Game information');
      console.log('    POST /play/quick - Quick bet (requires x402 payment)');
      console.log('    POST /play/custom - Custom bet (requires x402 payment)');
      console.log('    GET  /roulette/history/:wallet - Game history');
      console.log('    GET  /roulette/stats/:wallet - Player statistics');
      console.log('');
      console.log('  Poker:');
      console.log('    GET  /poker/info - Poker payouts and rules');
      console.log("    POST /play/poker - Play Texas Hold'em (requires x402 payment)");
      console.log('    GET  /poker/history/:wallet - Game history');
      console.log('    GET  /poker/stats/:wallet - Player statistics');
      console.log('');
      console.log('  Wallet:');
      console.log('    GET  /wallet/balance/:wallet - Check balance');
      console.log('    POST /wallet/withdraw - Withdraw winnings');
      console.log('    GET  /wallet/transactions/:wallet - Transaction history');
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
