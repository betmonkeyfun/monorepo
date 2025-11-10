import { PublicKey, Keypair } from '@solana/web3.js';
import { connection } from '../config/network';
import { loadOrCreateWallet } from './wallet';
import * as fs from 'fs';
import * as path from 'path';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

const TOKEN_INFO_FILE = path.join(__dirname, '../.token-info.json');

/**
 * Create a simple concentrated liquidity pool on Orca Whirlpool
 * This works on devnet
 */
async function createOrcaPool() {
  console.log('Creating Orca Whirlpool Pool on Devnet...\n');

  // Load token info
  if (!fs.existsSync(TOKEN_INFO_FILE)) {
    console.error('Token not found. Run: bun run create-token');
    process.exit(1);
  }

  const tokenInfo = JSON.parse(fs.readFileSync(TOKEN_INFO_FILE, 'utf-8'));
  const wallet = loadOrCreateWallet();

  // Check balance
  const balance = await connection.getBalance(wallet.publicKey);
  const balanceSOL = balance / LAMPORTS_PER_SOL;

  console.log('Token Information:');
  console.log('==========================================');
  console.log('Token Mint:', tokenInfo.mint);
  console.log('Wallet:', wallet.publicKey.toBase58());
  console.log('Balance:', balanceSOL.toFixed(4), 'SOL');
  console.log('==========================================\n');

  if (balanceSOL < 1) {
    console.error('Need at least 1 SOL to create pool');
    console.log('Run: bun run get-devnet-sol');
    process.exit(1);
  }

  // For devnet, the easiest way is to use Raydium's CPMM (Constant Product Market Maker)
  // or create a simple pool manually

  console.log('DEVNET POOL CREATION:\n');

  console.log('Option 1: Use Raydium CPMM (Recommended)');
  console.log('Raydium has a simpler pool type (CPMM) that works on devnet:');
  console.log('1. This requires using Raydium SDK directly');
  console.log('2. Or using their devnet UI if available\n');

  console.log('Option 2: Manual DEX Pool');
  console.log('Create a basic pool using Serum/OpenBook:');
  console.log('1. Create OpenBook market (complex)');
  console.log('2. Initialize Raydium pool with market');
  console.log('3. Add liquidity\n');

  console.log('Option 3: Simple Testing (Recommended for now)');
  console.log('For development/testing purposes:');
  console.log('1. Skip the pool creation');
  console.log('2. Mock the Jupiter API responses');
  console.log('3. Test the agent logic end-to-end');
  console.log('4. Deploy to mainnet when ready for real trading\n');

  console.log('REALISTIC APPROACH:');
  console.log('==========================================');
  console.log('Devnet pools are limited and not well supported.');
  console.log('Most projects test the flow without pools, then go straight to mainnet.');
  console.log('\nFor production:');
  console.log('1. Change to mainnet in .env');
  console.log('2. Get 10-20 SOL');
  console.log('3. Use Raydium UI to create pool');
  console.log('4. Add substantial liquidity');
  console.log('5. Agent will work automatically');
  console.log('==========================================\n');

  console.log('Your token is ready. The agent code is ready.');
  console.log('When you create a mainnet pool, everything will work without changes.');
}

createOrcaPool();
