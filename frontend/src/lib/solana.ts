import { Connection, clusterApiUrl } from '@solana/web3.js';

export const SOLANA_NETWORK = 'mainnet-beta';
export const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(SOLANA_NETWORK);

export const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

export const CASINO_API_URL = process.env.NEXT_PUBLIC_CASINO_API_URL || 'http://localhost:3003';
