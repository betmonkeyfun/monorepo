import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import {
  getTokensForSOL,
  getSOLForTokens,
  calculateTokenPrice,
  DEFAULT_BONDING_CURVE,
  type BondingCurveParams,
  type TokenQuote
} from './bonding-curve.js';

/**
 * Token Agent - Manages the bonding curve and token economy
 *
 * This agent doesn't actually buy from a DEX, instead it manages
 * an internal bonding curve where token price is tied to casino reserves.
 *
 * Benefits:
 * - No DEX pool needed
 * - Instant liquidity
 * - Price directly tied to casino performance
 * - No slippage issues
 * - Complete control over tokenomics
 */

export class TokenAgent {
  private wallet: Keypair;
  private tokenMint: PublicKey;
  private bondingCurve: Omit<BondingCurveParams, 'reserveBalance'>;
  private stats: {
    totalTokensSold: number;
    totalSOLReceived: number;
    totalTransactions: number;
  };

  constructor(
    _connection: Connection,
    wallet: Keypair,
    tokenMint: PublicKey,
    bondingCurve?: Omit<BondingCurveParams, 'reserveBalance'>
  ) {
    this.wallet = wallet;
    this.tokenMint = tokenMint;
    this.bondingCurve = bondingCurve || DEFAULT_BONDING_CURVE;
    this.stats = {
      totalTokensSold: 0,
      totalSOLReceived: 0,
      totalTransactions: 0
    };
  }

  /**
   * Get current token price based on casino reserves
   */
  getCurrentPrice(casinoReserves: number): number {
    return calculateTokenPrice({
      ...this.bondingCurve,
      reserveBalance: casinoReserves
    });
  }

  /**
   * Get quote for buying tokens with SOL
   */
  getBuyQuote(solAmount: number, casinoReserves: number): TokenQuote {
    return getTokensForSOL(solAmount, {
      ...this.bondingCurve,
      reserveBalance: casinoReserves
    });
  }

  /**
   * Get quote for selling tokens for SOL
   */
  getSellQuote(tokenAmount: number, casinoReserves: number): TokenQuote {
    return getSOLForTokens(tokenAmount, {
      ...this.bondingCurve,
      reserveBalance: casinoReserves
    });
  }

  /**
   * Execute a buy transaction
   * In production, this would transfer tokens to the buyer
   */
  async buyTokens(
    buyerPublicKey: PublicKey,
    solAmount: number,
    casinoReserves: number
  ): Promise<{
    success: boolean;
    quote: TokenQuote;
    txSignature?: string;
    error?: string;
  }> {
    try {
      const quote = this.getBuyQuote(solAmount, casinoReserves);

      // In production, you would:
      // 1. Verify SOL payment received
      // 2. Transfer tokens from treasury to buyer
      // 3. Update database records

      this.stats.totalTokensSold += quote.tokenAmount;
      this.stats.totalSOLReceived += solAmount;
      this.stats.totalTransactions++;

      console.log('Token Purchase:');
      console.log('  Buyer:', buyerPublicKey.toBase58());
      console.log('  SOL Paid:', solAmount);
      console.log('  Tokens Received:', quote.tokenAmount.toFixed(2));
      console.log('  Price per Token:', quote.pricePerToken.toFixed(8), 'SOL');
      console.log('  Price Impact:', quote.priceImpact.toFixed(2), '%');

      return {
        success: true,
        quote,
        txSignature: 'simulated-tx-' + Date.now()
      };
    } catch (error: any) {
      console.error('Buy error:', error.message);
      return {
        success: false,
        quote: this.getBuyQuote(solAmount, casinoReserves),
        error: error.message
      };
    }
  }

  /**
   * Execute a sell transaction
   */
  async sellTokens(
    sellerPublicKey: PublicKey,
    tokenAmount: number,
    casinoReserves: number
  ): Promise<{
    success: boolean;
    quote: TokenQuote;
    txSignature?: string;
    error?: string;
  }> {
    try {
      const quote = this.getSellQuote(tokenAmount, casinoReserves);

      // In production, you would:
      // 1. Verify token transfer received
      // 2. Send SOL to seller
      // 3. Update database records

      this.stats.totalTokensSold -= tokenAmount;
      this.stats.totalSOLReceived -= quote.solCost;
      this.stats.totalTransactions++;

      console.log('Token Sale:');
      console.log('  Seller:', sellerPublicKey.toBase58());
      console.log('  Tokens Sold:', tokenAmount.toFixed(2));
      console.log('  SOL Received:', quote.solCost.toFixed(4));
      console.log('  Price per Token:', quote.pricePerToken.toFixed(8), 'SOL');

      return {
        success: true,
        quote,
        txSignature: 'simulated-tx-' + Date.now()
      };
    } catch (error: any) {
      console.error('Sell error:', error.message);
      return {
        success: false,
        quote: this.getSellQuote(tokenAmount, casinoReserves),
        error: error.message
      };
    }
  }

  /**
   * Get current stats
   */
  getStats() {
    return {
      ...this.stats,
      tokenMint: this.tokenMint.toBase58(),
      wallet: this.wallet.publicKey.toBase58()
    };
  }

  /**
   * Get market info
   */
  getMarketInfo(casinoReserves: number, totalSupply: number): {
    currentPrice: number;
    marketCap: number;
    reserveRatio: number;
    circulatingSupply: number;
    priceChange24h?: number;
  } {
    const currentPrice = this.getCurrentPrice(casinoReserves);
    const marketCap = currentPrice * totalSupply;
    const reserveRatio = Math.min(casinoReserves / this.bondingCurve.targetReserve, 1);

    return {
      currentPrice,
      marketCap,
      reserveRatio,
      circulatingSupply: this.stats.totalTokensSold
    };
  }
}

/**
 * Create and initialize the token agent
 */
export async function createTokenAgent(
  rpcUrl: string,
  walletPrivateKey: string,
  tokenMint: string
): Promise<TokenAgent> {
  const connection = new Connection(rpcUrl, 'confirmed');

  // Parse private key
  let wallet: Keypair;
  try {
    // Try as base64 JSON array
    const decoded = JSON.parse(Buffer.from(walletPrivateKey, 'base64').toString());
    wallet = Keypair.fromSecretKey(Uint8Array.from(decoded));
  } catch {
    // Try as direct JSON array
    try {
      const decoded = JSON.parse(walletPrivateKey);
      wallet = Keypair.fromSecretKey(Uint8Array.from(decoded));
    } catch {
      throw new Error('Invalid wallet private key format');
    }
  }

  const mint = new PublicKey(tokenMint);

  console.log('Token Agent Initialized:');
  console.log('  Network:', rpcUrl);
  console.log('  Token Mint:', mint.toBase58());
  console.log('  Agent Wallet:', wallet.publicKey.toBase58());

  return new TokenAgent(connection, wallet, mint);
}
