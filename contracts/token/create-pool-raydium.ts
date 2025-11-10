import { PublicKey, Keypair, Connection, Transaction, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress } from '@solana/spl-token';
import { connection } from '../config/network';
import { loadOrCreateWallet } from './wallet';
import * as fs from 'fs';
import * as path from 'path';

const TOKEN_INFO_FILE = path.join(__dirname, '../.token-info.json');

/**
 * For simplicity on devnet, we'll use Orca's simple pool creation
 * Raydium requires OpenBook market which is more complex
 */
async function createSimplePool() {
  console.log('Creating liquidity pool...\n');

  // Load token info
  if (!fs.existsSync(TOKEN_INFO_FILE)) {
    console.error('Token not found. Run: npm run create-token');
    process.exit(1);
  }

  const tokenInfo = JSON.parse(fs.readFileSync(TOKEN_INFO_FILE, 'utf-8'));
  const wallet = loadOrCreateWallet();

  console.log('Token Information:');
  console.log('==========================================');
  console.log('Name:', tokenInfo.name);
  console.log('Symbol:', tokenInfo.symbol);
  console.log('Mint:', tokenInfo.mint);
  console.log('==========================================\n');

  console.log('For devnet, creating a pool programmatically is complex.');
  console.log('Here are your options:\n');

  console.log('Option 1: Use Raydium UI (Recommended)');
  console.log('  1. Go to https://raydium.io/liquidity/create/');
  console.log('  2. Connect your wallet');
  console.log('  3. Import token using mint:', tokenInfo.mint);
  console.log('  4. Add initial liquidity (e.g., 1 SOL + 1M BMONKEY)');
  console.log('  5. Confirm transaction\n');

  console.log('Option 2: Use Orca UI');
  console.log('  1. Go to https://www.orca.so/pools');
  console.log('  2. Similar process to Raydium\n');

  console.log('Option 3: Manual Jupiter Pool');
  console.log('  Jupiter can find your token once it has ANY pool');
  console.log('  Even a small pool will work for testing\n');

  console.log('For mainnet:');
  console.log('  - Use professional liquidity providers');
  console.log('  - Or use Raydium SDK with OpenBook market');
  console.log('  - Requires more complex setup\n');

  console.log('Your wallet address:', wallet.publicKey.toBase58());
  console.log('Token mint address:', tokenInfo.mint);
  console.log('\nNote: Make sure to backup these addresses!');
}

createSimplePool();
