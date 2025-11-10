import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  NATIVE_MINT,
  getAccount
} from '@solana/spl-token';
import { connection } from '../config/network';
import { loadOrCreateWallet } from './wallet';
import * as fs from 'fs';
import * as path from 'path';

const TOKEN_INFO_FILE = path.join(__dirname, '../.token-info.json');

/**
 * For devnet testing, we'll create wrapped SOL and prepare for a simple pool
 * This demonstrates the mechanics without requiring complex DEX setup
 */
async function createSimpleTestPool() {
  console.log('Preparing Simple Pool Setup for Devnet...\n');

  if (!fs.existsSync(TOKEN_INFO_FILE)) {
    console.error('Token not found. Run: bun run create-token');
    process.exit(1);
  }

  const tokenInfo = JSON.parse(fs.readFileSync(TOKEN_INFO_FILE, 'utf-8'));
  const wallet = loadOrCreateWallet();
  const balance = await connection.getBalance(wallet.publicKey);

  console.log('Current Status:');
  console.log('==========================================');
  console.log('Token Mint:', tokenInfo.mint);
  console.log('Wallet:', wallet.publicKey.toBase58());
  console.log('SOL Balance:', (balance / LAMPORTS_PER_SOL).toFixed(4));
  console.log('==========================================\n');

  if (balance < 0.5 * LAMPORTS_PER_SOL) {
    console.error('Need at least 0.5 SOL. Run: bun run get-devnet-sol');
    process.exit(1);
  }

  try {
    // Create wrapped SOL account
    console.log('Step 1: Creating wrapped SOL account...');

    const wsolAccount = await getAssociatedTokenAddress(
      NATIVE_MINT,
      wallet.publicKey
    );

    console.log('Wrapped SOL Account:', wsolAccount.toBase58());

    // Check if account exists
    let accountExists = false;
    try {
      await getAccount(connection, wsolAccount);
      accountExists = true;
      console.log('Wrapped SOL account already exists');
    } catch (e) {
      console.log('Creating new wrapped SOL account...');
    }

    if (!accountExists) {
      const transaction = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          wsolAccount,
          wallet.publicKey,
          NATIVE_MINT
        )
      );

      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [wallet]
      );

      console.log('Wrapped SOL account created:', signature);
    }

    console.log('\nStep 2: Pool Creation Status');
    console.log('==========================================');
    console.log('Token accounts prepared for pool creation.');
    console.log('\nTo create an actual tradeable pool, you have two options:\n');

    console.log('A) DEVNET (Testing Only):');
    console.log('   Unfortunately, major DEXs dont fully support devnet pools.');
    console.log('   You can test the agent logic without a real pool.\n');

    console.log('B) MAINNET (Production):');
    console.log('   1. Update .env: SOLANA_NETWORK=mainnet-beta');
    console.log('   2. Get 10-20 SOL on mainnet');
    console.log('   3. Go to https://raydium.io/liquidity/create/');
    console.log('   4. Connect wallet');
    console.log('   5. Create SOL/BMONKEY pool');
    console.log('   6. Add liquidity (e.g., 5 SOL + 500M BMONKEY)');
    console.log('   7. Agent will automatically work\n');

    console.log('==========================================');
    console.log('Your token is deployed and ready.');
    console.log('The agent code is complete.');
    console.log('Create a mainnet pool when ready to go live.');
    console.log('==========================================\n');

  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createSimpleTestPool();
