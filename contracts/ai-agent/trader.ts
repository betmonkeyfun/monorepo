import { PublicKey, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { connection } from '../config/network';
import { loadOrCreateWallet } from '../token/wallet';

/**
 * Buy tokens using Jupiter Aggregator API
 * Jupiter is the best DEX aggregator on Solana - finds best prices across all DEXs
 */
export async function buyToken(tokenMint: PublicKey, solAmount: number): Promise<string | null> {
  console.log(`\nInitiating token purchase...`);
  console.log(`Amount: ${solAmount} SOL`);
  console.log(`Token: ${tokenMint.toBase58()}`);

  const wallet = loadOrCreateWallet();

  try {
    // SOL mint address (wrapped SOL)
    const SOL_MINT = 'So11111111111111111111111111111111111111112';

    // Convert SOL to lamports
    const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);

    console.log('\nStep 1: Getting best quote from Jupiter...');

    // Get quote from Jupiter
    const quoteResponse = await fetch(
      `https://quote-api.jup.ag/v6/quote?inputMint=${SOL_MINT}&outputMint=${tokenMint.toBase58()}&amount=${lamports}&slippageBps=50`
    );

    if (!quoteResponse.ok) {
      throw new Error('Failed to get quote from Jupiter');
    }

    const quoteData = await quoteResponse.json();

    console.log('Quote received:');
    console.log('  Input:', solAmount, 'SOL');
    console.log('  Output:', quoteData.outAmount, 'tokens (raw)');
    console.log('  Price impact:', quoteData.priceImpactPct + '%');

    console.log('\nStep 2: Getting swap transaction...');

    // Get serialized transaction
    const swapResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quoteResponse: quoteData,
        userPublicKey: wallet.publicKey.toBase58(),
        wrapAndUnwrapSol: true,
      }),
    });

    if (!swapResponse.ok) {
      throw new Error('Failed to get swap transaction');
    }

    const swapData = await swapResponse.json();

    console.log('Transaction received');

    console.log('\nStep 3: Signing and sending transaction...');

    // Deserialize the transaction
    const swapTransactionBuf = Buffer.from(swapData.swapTransaction, 'base64');
    const transaction = Transaction.from(swapTransactionBuf);

    // Sign transaction
    transaction.sign(wallet);

    // Send transaction
    const signature = await connection.sendRawTransaction(transaction.serialize());

    console.log('Transaction sent:', signature);
    console.log('\nStep 4: Confirming transaction...');

    // Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed');

    console.log('Transaction confirmed!');
    console.log('View on Solscan:', `https://solscan.io/tx/${signature}${connection.rpcEndpoint.includes('devnet') ? '?cluster=devnet' : ''}`);

    return signature;

  } catch (error: any) {
    console.error('Error buying token:', error.message);

    if (error.message.includes('quote')) {
      console.log('\nPossible reasons:');
      console.log('  - No liquidity pool exists for this token yet');
      console.log('  - Token not listed on any DEX');
      console.log('  - Create a pool first: npm run create-pool');
    }

    return null;
  }
}

/**
 * Get token price in SOL
 */
export async function getTokenPrice(tokenMint: PublicKey): Promise<number | null> {
  try {
    const SOL_MINT = 'So11111111111111111111111111111111111111112';

    // Try to get price by simulating a 1 SOL swap
    const quoteResponse = await fetch(
      `https://quote-api.jup.ag/v6/quote?inputMint=${SOL_MINT}&outputMint=${tokenMint.toBase58()}&amount=${LAMPORTS_PER_SOL}&slippageBps=50`
    );

    if (!quoteResponse.ok) {
      return null;
    }

    const quoteData = await quoteResponse.json();
    const tokensPerSol = parseInt(quoteData.outAmount);

    return 1 / tokensPerSol; // Price in SOL per token

  } catch (error) {
    return null;
  }
}
