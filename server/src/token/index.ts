/**
 * BetMonkey Token System
 * Main entry point for token integration with casino
 */

import { createTokenAgent } from './agent.js';
import { TokenService } from './service.js';
import { Database } from '../casino/database/db.js';

/**
 * Get casino SOL reserves from database
 * Reserves = Total deposits - Total withdrawals - Total payouts + House wins
 */
export async function getCasinoReserves(db: Database): Promise<number> {
  try {
    // Get all transactions
    const result = await db.get<{
      total_deposits: string | null;
      total_withdrawals: string | null;
    }>(
      `SELECT
        SUM(CASE WHEN type = 'deposit' THEN CAST(amount AS REAL) ELSE 0 END) as total_deposits,
        SUM(CASE WHEN type = 'withdrawal' THEN CAST(amount AS REAL) ELSE 0 END) as total_withdrawals
      FROM transactions`
    );

    const deposits = parseFloat(result?.total_deposits || '0');
    const withdrawals = parseFloat(result?.total_withdrawals || '0');

    // Get game results to calculate house edge
    const gameStats = await db.get<{
      total_bets: string | null;
      total_wins: string | null;
    }>(
      `SELECT
        SUM(CAST(total_bet_amount AS REAL)) as total_bets,
        SUM(CAST(total_win_amount AS REAL)) as total_wins
      FROM roulette_games`
    );

    const totalBets = parseFloat(gameStats?.total_bets || '0');
    const totalWins = parseFloat(gameStats?.total_wins || '0');

    // Also check poker games
    const pokerStats = await db.get<{
      total_bets: string | null;
      total_wins: string | null;
    }>(
      `SELECT
        SUM(CAST(bet_amount AS REAL)) as total_bets,
        SUM(CAST(win_amount AS REAL)) as total_wins
      FROM poker_games`
    );

    const pokerBets = parseFloat(pokerStats?.total_bets || '0');
    const pokerWins = parseFloat(pokerStats?.total_wins || '0');

    // Calculate reserves
    // Reserves = Deposits - Withdrawals + (Total Bets - Total Wins)
    const houseProfit = (totalBets + pokerBets) - (totalWins + pokerWins);
    const reserves = deposits - withdrawals + houseProfit;

    // Ensure minimum reserve (start at 1 SOL)
    return Math.max(reserves, 1);
  } catch (error) {
    console.error('Error calculating reserves:', error);
    return 1; // Default to 1 SOL
  }
}

/**
 * Initialize token system
 */
export async function initializeTokenSystem(db: Database): Promise<TokenService> {
  console.log('Initializing BetMonkey Token System...');

  const rpcUrl = process.env.SOLANA_RPC_URL ||
    (process.env.SOLANA_NETWORK === 'mainnet-beta'
      ? 'https://api.mainnet-beta.solana.com'
      : 'https://api.devnet.solana.com');

  const tokenMint = process.env.TOKEN_MINT || '';
  const walletKey = process.env.TOKEN_AGENT_PRIVATE_KEY || '';

  if (!tokenMint) {
    throw new Error('TOKEN_MINT environment variable not set');
  }

  if (!walletKey) {
    throw new Error('TOKEN_AGENT_PRIVATE_KEY environment variable not set');
  }

  // Create agent
  const agent = await createTokenAgent(rpcUrl, walletKey, tokenMint);

  // Create service with reserve getter
  const service = new TokenService(agent, async () => getCasinoReserves(db));

  // Start monitoring
  const updateInterval = parseInt(process.env.TOKEN_UPDATE_INTERVAL || '60000'); // 1 minute default
  service.start(updateInterval);

  console.log('Token System initialized successfully');

  return service;
}

export * from './agent.js';
export * from './service.js';
export * from './bonding-curve.js';
export * from './routes.js';
export * from './types.js';
