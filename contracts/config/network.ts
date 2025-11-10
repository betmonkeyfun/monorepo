import { clusterApiUrl, Connection } from '@solana/web3.js';
import * as dotenv from 'dotenv';

dotenv.config();

export const NETWORK = (process.env.SOLANA_NETWORK || 'devnet') as 'devnet' | 'mainnet-beta';

export const RPC_ENDPOINT = NETWORK === 'devnet'
  ? clusterApiUrl('devnet')
  : clusterApiUrl('mainnet-beta');

export const connection = new Connection(RPC_ENDPOINT, 'confirmed');

export const TOKEN_CONFIG = {
  name: process.env.TOKEN_NAME || 'BetMonkey',
  symbol: process.env.TOKEN_SYMBOL || 'BMONKEY',
  decimals: parseInt(process.env.TOKEN_DECIMALS || '9'),
  totalSupply: parseInt(process.env.TOTAL_SUPPLY || '1000000000'),
};

export const AGENT_CONFIG = {
  buyPercentage: parseInt(process.env.BUY_PERCENTAGE || '60'),
  minBuyAmount: parseFloat(process.env.MIN_BUY_AMOUNT || '0.1'),
  checkInterval: parseInt(process.env.CHECK_INTERVAL || '300') * 1000,
  dex: process.env.DEX || 'raydium',
};

console.log(`🌐 Network: ${NETWORK}`);
console.log(`🔗 RPC: ${RPC_ENDPOINT}`);
