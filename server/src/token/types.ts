/**
 * Type definitions for the token system
 */

export interface CasinoStats {
  totalBets: number;
  totalWinnings: number;
  totalLosses: number;
  houseProfit: number;
  currentReserves: number;
  activeUsers: number;
}

export interface TokenTransaction {
  id: string;
  type: 'buy' | 'sell';
  user: string;
  tokenAmount: number;
  solAmount: number;
  pricePerToken: number;
  timestamp: number;
  txSignature?: string;
}

export interface PriceHistory {
  timestamp: number;
  price: number;
  reserves: number;
  volume24h: number;
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  decimals: number;
  totalSupply: number;
}
