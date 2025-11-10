import { PublicKey } from '@solana/web3.js';
import { loadOrCreateWallet } from './wallet';
import * as fs from 'fs';
import * as path from 'path';

const TOKEN_INFO_FILE = path.join(__dirname, '../.token-info.json');

async function createPool() {
  console.log('🏊 Creating Liquidity Pool...\n');

  // Load token info
  if (!fs.existsSync(TOKEN_INFO_FILE)) {
    console.error('❌ Token not found. Run: npm run create-token');
    process.exit(1);
  }

  const tokenInfo = JSON.parse(fs.readFileSync(TOKEN_INFO_FILE, 'utf-8'));
  const wallet = loadOrCreateWallet();

  console.log('📋 Token Information:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Name:', tokenInfo.name);
  console.log('Symbol:', tokenInfo.symbol);
  console.log('Mint:', tokenInfo.mint);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('ℹ️  Creating a liquidity pool on Raydium requires:');
  console.log('   1. Token mint address (we have this ✅)');
  console.log('   2. Initial liquidity in SOL and tokens');
  console.log('   3. Market creation on OpenBook (Serum)');
  console.log('   4. Pool creation transaction\n');

  console.log('📝 Options for creating the pool:\n');
  console.log('Option 1: Use Raydium UI (Recommended for devnet)');
  console.log('   → Go to: https://raydium.io/');
  console.log('   → Connect wallet');
  console.log('   → Create pool with your token mint address\n');

  console.log('Option 2: Use Raydium SDK (Advanced)');
  console.log('   → Requires OpenBook market creation');
  console.log('   → Requires more complex setup');
  console.log('   → Can be automated\n');

  console.log('Option 3: Use Jupiter (Easiest for simple swaps)');
  console.log('   → Create a minimal pool');
  console.log('   → Good for testing\n');

  console.log('🎯 For this project, we recommend:');
  console.log('   1. For devnet testing: Use Raydium devnet UI');
  console.log('   2. For mainnet: Use Raydium SDK or UI\n');

  console.log('💡 Pro tip: For the AI agent to work, you need:');
  console.log('   - A liquidity pool with SOL/BMONKEY pair');
  console.log('   - Enough liquidity to handle buys without huge slippage');
  console.log('   - The pool address (will be generated when you create it)\n');

  console.log('📋 Save this information:');
  console.log('Token Mint:', tokenInfo.mint);
  console.log('Your Wallet:', wallet.publicKey.toBase58());
  console.log('\n⚠️  Note: Creating pools programmatically on Raydium is complex.');
  console.log('   The AI agent can still be built to work with any DEX pool!');
}

createPool();
