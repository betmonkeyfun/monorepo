import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { connection } from '../config/network';
import { loadOrCreateWallet } from './wallet';

async function getDevnetSol() {
  console.log('Requesting devnet SOL...\n');

  const wallet = loadOrCreateWallet();
  const publicKey = wallet.publicKey;

  console.log('Wallet:', publicKey.toBase58());

  try {
    // Check current balance
    const balanceBefore = await connection.getBalance(publicKey);
    console.log('Balance before:', balanceBefore / LAMPORTS_PER_SOL, 'SOL');

    // Request airdrop (max 2 SOL at a time on devnet)
    console.log('\nRequesting airdrop (2 SOL)...');
    const signature = await connection.requestAirdrop(
      publicKey,
      2 * LAMPORTS_PER_SOL
    );

    // Wait for confirmation
    console.log('Confirming transaction...');
    await connection.confirmTransaction(signature);

    // Check new balance
    const balanceAfter = await connection.getBalance(publicKey);
    console.log('\nAirdrop successful!');
    console.log('Balance after:', balanceAfter / LAMPORTS_PER_SOL, 'SOL');
    console.log('Transaction:', signature);

  } catch (error: any) {
    console.error('\nError:', error.message);
    console.log('\nNote: Devnet faucet has rate limits.');
    console.log('You can also use the web faucet: https://faucet.solana.com/');
  }
}

getDevnetSol();
