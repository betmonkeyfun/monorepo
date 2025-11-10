import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { connection } from '../config/network';
import { loadOrCreateWallet } from './wallet';
import * as fs from 'fs';
import * as path from 'path';

const TOKEN_INFO_FILE = path.join(__dirname, '../.token-info.json');

async function createPool() {
  console.log('Creating Liquidity Pool...\n');

  // Load token info
  if (!fs.existsSync(TOKEN_INFO_FILE)) {
    console.error('Token not found. Run: npm run create-token');
    process.exit(1);
  }

  const tokenInfo = JSON.parse(fs.readFileSync(TOKEN_INFO_FILE, 'utf-8'));
  const wallet = loadOrCreateWallet();

  // Check balance
  const balance = await connection.getBalance(wallet.publicKey);
  const balanceSOL = balance / LAMPORTS_PER_SOL;

  console.log('Token Information:');
  console.log('==========================================');
  console.log('Name:', tokenInfo.name);
  console.log('Symbol:', tokenInfo.symbol);
  console.log('Mint:', tokenInfo.mint);
  console.log('Wallet:', wallet.publicKey.toBase58());
  console.log('Balance:', balanceSOL.toFixed(4), 'SOL');
  console.log('==========================================\n');

  console.log('POOL CREATION OPTIONS:\n');

  console.log('For devnet, you have a few options:\n');

  console.log('1. EASIEST: Skip the pool for now');
  console.log('   - The AI agent is ready to use');
  console.log('   - You can test it without a pool');
  console.log('   - Just mock the casino profits');
  console.log('   - When ready for mainnet, create a real pool\n');

  console.log('2. Use Raydium UI (if available on devnet)');
  console.log('   - Go to https://raydium.io/liquidity/create/');
  console.log('   - Connect wallet (must be on devnet)');
  console.log('   - Import token:', tokenInfo.mint);
  console.log('   - Add liquidity (suggest: 0.5 SOL + 500M BMONKEY)');
  console.log('   - Note: Raydium may not support devnet\n');

  console.log('3. Use Orca UI (if available on devnet)');
  console.log('   - Go to https://www.orca.so/');
  console.log('   - Similar to Raydium\n');

  console.log('4. FOR MAINNET ONLY:');
  console.log('   - Get real SOL');
  console.log('   - Use Raydium or Orca UI');
  console.log('   - Add significant liquidity (e.g., 10 SOL minimum)');
  console.log('   - Monitor slippage and price impact\n');

  console.log('IMPORTANT NOTES:');
  console.log('==========================================');
  console.log('- Most DEXs dont fully support devnet pools');
  console.log('- For testing, you can skip the pool');
  console.log('- The AI agent code is ready to work with Jupiter');
  console.log('- When you create a mainnet pool, no code changes needed');
  console.log('==========================================\n');

  console.log('NEXT STEPS:');
  console.log('1. Test the AI agent logic: bun run start-agent');
  console.log('2. When ready for mainnet: Change SOLANA_NETWORK=mainnet-beta in .env');
  console.log('3. Get real SOL and create a real pool on Raydium/Orca');
  console.log('4. The agent will automatically start buying!\n');
}

createPool();
