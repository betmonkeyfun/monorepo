import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { connection, TOKEN_CONFIG } from '../config/network';
import { loadOrCreateWallet } from './wallet';
import * as fs from 'fs';
import * as path from 'path';

const TOKEN_INFO_FILE = path.join(__dirname, '../.token-info.json');

async function createToken() {
  console.log('Creating BetMonkey Token...\n');

  const wallet = loadOrCreateWallet();
  console.log('Wallet:', wallet.publicKey.toBase58());

  // Check balance
  const balance = await connection.getBalance(wallet.publicKey);
  console.log('Balance:', balance / LAMPORTS_PER_SOL, 'SOL\n');

  if (balance < 0.5 * LAMPORTS_PER_SOL) {
    console.error('Insufficient balance. Need at least 0.5 SOL');
    console.log('Run: npm run get-devnet-sol');
    process.exit(1);
  }

  try {
    // Create the token mint
    console.log('Creating token mint...');
    const mint = await createMint(
      connection,
      wallet,
      wallet.publicKey, // mint authority
      wallet.publicKey, // freeze authority
      TOKEN_CONFIG.decimals,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    );

    console.log('Token Mint created:', mint.toBase58());

    // Get or create associated token account
    console.log('\nCreating token account...');
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      mint,
      wallet.publicKey
    );

    console.log('Token Account created:', tokenAccount.address.toBase58());

    // Mint initial supply
    const mintAmount = TOKEN_CONFIG.totalSupply * Math.pow(10, TOKEN_CONFIG.decimals);
    console.log(`\nMinting ${TOKEN_CONFIG.totalSupply.toLocaleString()} tokens...`);

    const signature = await mintTo(
      connection,
      wallet,
      mint,
      tokenAccount.address,
      wallet.publicKey,
      mintAmount
    );

    console.log('Tokens minted successfully!');
    console.log('Transaction:', signature);

    // Save token info
    const tokenInfo = {
      network: process.env.SOLANA_NETWORK || 'devnet',
      mint: mint.toBase58(),
      tokenAccount: tokenAccount.address.toBase58(),
      owner: wallet.publicKey.toBase58(),
      name: TOKEN_CONFIG.name,
      symbol: TOKEN_CONFIG.symbol,
      decimals: TOKEN_CONFIG.decimals,
      totalSupply: TOKEN_CONFIG.totalSupply,
      createdAt: new Date().toISOString(),
    };

    fs.writeFileSync(TOKEN_INFO_FILE, JSON.stringify(tokenInfo, null, 2));

    console.log('\nToken Information:');
    console.log('==========================================');
    console.log('Name:', TOKEN_CONFIG.name);
    console.log('Symbol:', TOKEN_CONFIG.symbol);
    console.log('Decimals:', TOKEN_CONFIG.decimals);
    console.log('Total Supply:', TOKEN_CONFIG.totalSupply.toLocaleString());
    console.log('Mint Address:', mint.toBase58());
    console.log('Token Account:', tokenAccount.address.toBase58());
    console.log('==========================================');
    console.log('\nToken info saved to:', TOKEN_INFO_FILE);
    console.log('\nToken creation complete!');
    console.log('\nNext steps:');
    console.log('1. Create a liquidity pool: npm run create-pool');
    console.log('2. Start the AI agent: npm run start-agent');

  } catch (error: any) {
    console.error('\nError creating token:', error.message);
    process.exit(1);
  }
}

createToken();
