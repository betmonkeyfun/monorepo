import { Keypair } from '@solana/web3.js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const WALLET_FILE = path.join(__dirname, '../.wallet.json');

export function loadOrCreateWallet(): Keypair {
  // Try to load from private key in .env
  if (process.env.WALLET_PRIVATE_KEY) {
    try {
      const decoded = Uint8Array.from(
        JSON.parse(Buffer.from(process.env.WALLET_PRIVATE_KEY, 'base64').toString())
      );
      return Keypair.fromSecretKey(decoded);
    } catch (error) {
      console.error('Error loading wallet from .env, trying file...');
    }
  }

  // Try to load from file
  if (fs.existsSync(WALLET_FILE)) {
    const data = JSON.parse(fs.readFileSync(WALLET_FILE, 'utf-8'));
    return Keypair.fromSecretKey(Uint8Array.from(data));
  }

  // Create new wallet
  const wallet = Keypair.generate();
  fs.writeFileSync(WALLET_FILE, JSON.stringify(Array.from(wallet.secretKey)));

  console.log('New wallet created!');
  console.log('Saved to:', WALLET_FILE);
  console.log('Public Key:', wallet.publicKey.toBase58());
  console.log('IMPORTANT: Backup your wallet file!');

  return wallet;
}

export function getWalletPublicKey(): string {
  const wallet = loadOrCreateWallet();
  return wallet.publicKey.toBase58();
}
