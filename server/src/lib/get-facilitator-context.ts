/**
 * Facilitator Context - Gill template pattern
 * Centralized dependency injection for the facilitator
 */

import { createKeyPairSignerFromBytes } from 'gill';
import type { Address, KeyPairSigner } from 'gill';
import bs58 from 'bs58';
import { SolanaUtils } from './solana-utils.js';
import { NonceDatabase } from './nonce-database.js';
import { FacilitatorConfig, getFacilitatorConfig } from './get-facilitator-config.js';
import { ApiLogger, log } from './api-logger.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface FacilitatorContext {
  config: FacilitatorConfig;
  log: ApiLogger;
  facilitatorKeypair: KeyPairSigner;
  facilitatorAddress: Address;
  solanaUtils: SolanaUtils;
  nonceDb: NonceDatabase;
}

let context: FacilitatorContext | undefined;

export async function getFacilitatorContext(): Promise<FacilitatorContext> {
  if (context) {
    return context;
  }

  const config = getFacilitatorConfig();

  // Initialize facilitator keypair
  const privateKeyBytes = bs58.decode(config.facilitatorPrivateKey);
  const facilitatorKeypair = await createKeyPairSignerFromBytes(privateKeyBytes);
  const facilitatorAddress = facilitatorKeypair.address;

  // Initialize Solana utilities
  const solanaUtils = new SolanaUtils({
    rpcEndpoint: config.solanaRpcUrl,
    rpcSubscriptionsEndpoint: config.solanaWsUrl,
  });

  // Initialize nonce database
  // Check if we should use casino.db (shared database) or separate nonce.db
  const casinoDatabasePath = path.join(__dirname, '../../data/casino.db');
  const useSharedDatabase = fs.existsSync(casinoDatabasePath);

  let nonceDb: NonceDatabase;

  if (useSharedDatabase) {
    // Use casino.db (shared with casino server for consolidated database)
    log.info('Using shared casino.db for nonce storage');
    nonceDb = new NonceDatabase(casinoDatabasePath);
  } else {
    // Fallback to configured path (backward compatibility)
    log.info(`Using dedicated nonce database at ${config.databasePath}`);
    nonceDb = new NonceDatabase(config.databasePath);
  }

  context = {
    config,
    log,
    facilitatorKeypair,
    facilitatorAddress,
    solanaUtils,
    nonceDb,
  };

  return context;
}
