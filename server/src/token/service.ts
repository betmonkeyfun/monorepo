import { TokenAgent } from './agent.js';
import { TokenTransaction, PriceHistory } from './types.js';

/**
 * Token Service - Integrates the token agent with the casino
 *
 * This service:
 * - Monitors casino reserves
 * - Updates token pricing in real-time
 * - Handles buy/sell requests
 * - Tracks price history
 * - Provides market data APIs
 */

export class TokenService {
  private agent: TokenAgent;
  private casinoReservesGetter: () => Promise<number>;
  private priceHistory: PriceHistory[] = [];
  private transactions: TokenTransaction[] = [];
  private updateInterval: NodeJS.Timeout | null = null;

  constructor(
    agent: TokenAgent,
    casinoReservesGetter: () => Promise<number>
  ) {
    this.agent = agent;
    this.casinoReservesGetter = casinoReservesGetter;
  }

  /**
   * Start monitoring and updating prices
   */
  start(intervalMs: number = 60000) {
    console.log('Token Service started, monitoring every', intervalMs / 1000, 'seconds');

    // Initial update
    this.updatePriceHistory();

    // Periodic updates
    this.updateInterval = setInterval(() => {
      this.updatePriceHistory();
    }, intervalMs);
  }

  /**
   * Stop the service
   */
  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    console.log('Token Service stopped');
  }

  /**
   * Update price history with current data
   */
  private async updatePriceHistory() {
    try {
      const reserves = await this.casinoReservesGetter();
      const price = this.agent.getCurrentPrice(reserves);

      // Calculate 24h volume
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const recent = this.transactions.filter(tx => tx.timestamp > oneDayAgo);
      const volume24h = recent.reduce((sum, tx) => sum + tx.solAmount, 0);

      this.priceHistory.push({
        timestamp: Date.now(),
        price,
        reserves,
        volume24h
      });

      // Keep only last 7 days
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      this.priceHistory = this.priceHistory.filter(p => p.timestamp > sevenDaysAgo);

      console.log('Price Update:');
      console.log('  Current Reserves:', reserves.toFixed(4), 'SOL');
      console.log('  Token Price:', price.toFixed(8), 'SOL');
      console.log('  24h Volume:', volume24h.toFixed(4), 'SOL');
    } catch (error: any) {
      console.error('Error updating price history:', error.message);
    }
  }

  /**
   * Get current token price
   */
  async getCurrentPrice(): Promise<number> {
    const reserves = await this.casinoReservesGetter();
    return this.agent.getCurrentPrice(reserves);
  }

  /**
   * Get buy quote
   */
  async getBuyQuote(solAmount: number) {
    const reserves = await this.casinoReservesGetter();
    return this.agent.getBuyQuote(solAmount, reserves);
  }

  /**
   * Get sell quote
   */
  async getSellQuote(tokenAmount: number) {
    const reserves = await this.casinoReservesGetter();
    return this.agent.getSellQuote(tokenAmount, reserves);
  }

  /**
   * Execute buy
   */
  async executeBuy(userPublicKey: string, solAmount: number) {
    const reserves = await this.casinoReservesGetter();
    const result = await this.agent.buyTokens(
      new (await import('@solana/web3.js')).PublicKey(userPublicKey),
      solAmount,
      reserves
    );

    if (result.success) {
      this.transactions.push({
        id: crypto.randomUUID(),
        type: 'buy',
        user: userPublicKey,
        tokenAmount: result.quote.tokenAmount,
        solAmount,
        pricePerToken: result.quote.pricePerToken,
        timestamp: Date.now(),
        txSignature: result.txSignature
      });
    }

    return result;
  }

  /**
   * Execute sell
   */
  async executeSell(userPublicKey: string, tokenAmount: number) {
    const reserves = await this.casinoReservesGetter();
    const result = await this.agent.sellTokens(
      new (await import('@solana/web3.js')).PublicKey(userPublicKey),
      tokenAmount,
      reserves
    );

    if (result.success) {
      this.transactions.push({
        id: crypto.randomUUID(),
        type: 'sell',
        user: userPublicKey,
        tokenAmount,
        solAmount: result.quote.solCost,
        pricePerToken: result.quote.pricePerToken,
        timestamp: Date.now(),
        txSignature: result.txSignature
      });
    }

    return result;
  }

  /**
   * Get market statistics
   */
  async getMarketStats() {
    const reserves = await this.casinoReservesGetter();
    const currentPrice = this.agent.getCurrentPrice(reserves);
    const marketInfo = this.agent.getMarketInfo(reserves, 1_000_000_000); // 1B total supply

    // Calculate price changes
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const price24hAgo = this.priceHistory.find(p => p.timestamp >= oneDayAgo)?.price || currentPrice;
    const price7dAgo = this.priceHistory.find(p => p.timestamp >= oneWeekAgo)?.price || currentPrice;

    const priceChange24h = ((currentPrice - price24hAgo) / price24hAgo) * 100;
    const priceChange7d = ((currentPrice - price7dAgo) / price7dAgo) * 100;

    // Volume
    const volume24h = this.transactions
      .filter(tx => tx.timestamp > oneDayAgo)
      .reduce((sum, tx) => sum + tx.solAmount, 0);

    return {
      ...marketInfo,
      priceChange24h,
      priceChange7d,
      volume24h,
      totalTransactions: this.transactions.length,
      casinoReserves: reserves
    };
  }

  /**
   * Get price history
   */
  getPriceHistory(timeframe: '24h' | '7d' | '30d' = '7d'): PriceHistory[] {
    const timeframeMs = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const cutoff = Date.now() - timeframeMs[timeframe];
    return this.priceHistory.filter(p => p.timestamp > cutoff);
  }

  /**
   * Get recent transactions
   */
  getRecentTransactions(limit: number = 50): TokenTransaction[] {
    return this.transactions
      .slice(-limit)
      .reverse();
  }
}
