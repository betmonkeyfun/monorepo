import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { connection, AGENT_CONFIG } from '../config/network';
import { loadOrCreateWallet } from '../token/wallet';
import { buyToken } from './trader';
import * as fs from 'fs';
import * as path from 'path';

const TOKEN_INFO_FILE = path.join(__dirname, '../.token-info.json');

interface CasinoStats {
  totalProfits: number;
  lastProcessedProfit: number;
}

let stats: CasinoStats = {
  totalProfits: 0,
  lastProcessedProfit: 0,
};

async function checkCasinoProfits(): Promise<number> {
  // TODO: Replace this with actual casino profit tracking
  // This should connect to your casino backend to get current SOL profits

  // For now, we'll simulate by checking wallet balance changes
  const wallet = loadOrCreateWallet();
  const balance = await connection.getBalance(wallet.publicKey);
  const balanceSOL = balance / LAMPORTS_PER_SOL;

  // In a real implementation, you would:
  // 1. Query your casino database for total profits
  // 2. Track what's already been processed
  // 3. Return only NEW profits since last check

  console.log('Current wallet balance:', balanceSOL.toFixed(4), 'SOL');

  return 0; // Return new profits to process
}

async function processNewProfits(newProfits: number) {
  if (newProfits < AGENT_CONFIG.minBuyAmount) {
    console.log(`Profit too small (${newProfits} SOL < ${AGENT_CONFIG.minBuyAmount} SOL minimum)`);
    return;
  }

  // Calculate amount to use for buying
  const buyAmount = newProfits * (AGENT_CONFIG.buyPercentage / 100);

  console.log(`\nNew profits detected: ${newProfits} SOL`);
  console.log(`Using ${AGENT_CONFIG.buyPercentage}% for token buyback: ${buyAmount} SOL`);

  try {
    // Load token info
    if (!fs.existsSync(TOKEN_INFO_FILE)) {
      console.error('Token info not found. Create token first.');
      return;
    }

    const tokenInfo = JSON.parse(fs.readFileSync(TOKEN_INFO_FILE, 'utf-8'));
    const tokenMint = new PublicKey(tokenInfo.mint);

    // Execute the buy
    await buyToken(tokenMint, buyAmount);

    // Update stats
    stats.lastProcessedProfit = newProfits;
    stats.totalProfits += newProfits;

  } catch (error: any) {
    console.error('Error processing profits:', error.message);
  }
}

async function mainLoop() {
  console.log('BetMonkey AI Agent Started\n');
  console.log('Configuration:');
  console.log('==========================================');
  console.log('Buy Percentage:', AGENT_CONFIG.buyPercentage + '%');
  console.log('Min Buy Amount:', AGENT_CONFIG.minBuyAmount, 'SOL');
  console.log('Check Interval:', AGENT_CONFIG.checkInterval / 1000, 'seconds');
  console.log('DEX:', AGENT_CONFIG.dex);
  console.log('==========================================\n');

  console.log('Monitoring casino profits...\n');

  setInterval(async () => {
    try {
      const newProfits = await checkCasinoProfits();

      if (newProfits > 0) {
        await processNewProfits(newProfits);
      }

    } catch (error: any) {
      console.error('Error in main loop:', error.message);
    }
  }, AGENT_CONFIG.checkInterval);

  // Keep the process running
  console.log('Agent is running. Press Ctrl+C to stop.\n');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down AI agent...');
  console.log('Session Stats:');
  console.log('Total Profits Processed:', stats.totalProfits, 'SOL');
  process.exit(0);
});

mainLoop();
