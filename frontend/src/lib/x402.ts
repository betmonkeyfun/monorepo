import { PublicKey, Transaction } from '@solana/web3.js';
import bs58 from 'bs58';
import { connection, FACILITATOR_URL, CASINO_API_URL } from './solana';

export interface PaymentRequest {
  nonce: string;
  amount: string;
  recipient: string;
  resourceId: string;
  transactionSignature: string;
  clientPublicKey: string;
  timestamp: number;
  signature: string;
}

export interface StructuredData {
  domain: {
    name: string;
    version: string;
    chainId: string;
    verifyingContract: string;
  };
  message: {
    nonce: string;
    amount: string;
    recipient: string;
    resourceId: string;
    timestamp: number;
  };
}

// Create structured data for signing
export function createStructuredData(
  nonce: string,
  amount: string,
  recipient: string,
  resourceId: string,
  timestamp: number
): StructuredData {
  return {
    domain: {
      name: 'x402-solana-protocol',
      version: '1',
      chainId: 'devnet',
      verifyingContract: 'x402-sol',
    },
    message: {
      nonce,
      amount,
      recipient,
      resourceId,
      timestamp,
    },
  };
}

// Serialize structured data for signing
export function serializeStructuredData(data: StructuredData): string {
  return JSON.stringify(data, Object.keys(data).sort());
}

// Sign structured data with wallet
export async function signStructuredData(
  data: StructuredData,
  walletPublicKey: PublicKey,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>
): Promise<string> {
  const serialized = serializeStructuredData(data);
  const messageBytes = new TextEncoder().encode(serialized);
  const signature = await signMessage(messageBytes);
  return bs58.encode(signature);
}

// Request nonce from facilitator
export async function requestNonce(clientPublicKey: string): Promise<string> {
  const response = await fetch(`${FACILITATOR_URL}/nonce`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ clientPublicKey }),
  });

  if (!response.ok) {
    throw new Error('Failed to request nonce');
  }

  const data = await response.json();
  return data.nonce;
}

// Pay facilitator to get transaction signature
export async function payFacilitator(
  walletPublicKey: PublicKey,
  sendTransaction: (transaction: Transaction) => Promise<string>,
  amount: string,
  nonce: string
): Promise<string> {
  const response = await fetch(`${FACILITATOR_URL}/prepare-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      clientPublicKey: walletPublicKey.toBase58(),
      amount,
      nonce,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to prepare payment');
  }

  const { transaction: serializedTx } = await response.json();

  // Deserialize and send transaction
  const transaction = Transaction.from(Buffer.from(serializedTx, 'base64'));
  const signature = await sendTransaction(transaction);

  // Wait for confirmation
  await connection.confirmTransaction(signature, 'confirmed');

  return signature;
}

// Create payment request for x402 protocol
export async function createPaymentRequest(
  walletPublicKey: PublicKey,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>,
  sendTransaction: (transaction: Transaction) => Promise<string>,
  amount: string,
  resourceId: string
): Promise<PaymentRequest> {
  // 1. Request nonce
  const nonce = await requestNonce(walletPublicKey.toBase58());

  // 2. Pay facilitator
  const transactionSignature = await payFacilitator(
    walletPublicKey,
    sendTransaction,
    amount,
    nonce
  );

  // 3. Create structured data
  const timestamp = Date.now();
  const recipient = process.env.NEXT_PUBLIC_MERCHANT_ADDRESS || '';
  const structuredData = createStructuredData(
    nonce,
    amount,
    recipient,
    resourceId,
    timestamp
  );

  // 4. Sign structured data
  const signature = await signStructuredData(
    structuredData,
    walletPublicKey,
    signMessage
  );

  // 5. Return payment request
  return {
    nonce,
    amount,
    recipient,
    resourceId,
    transactionSignature,
    clientPublicKey: walletPublicKey.toBase58(),
    timestamp,
    signature,
  };
}

// Place bet on roulette (simple bets: red, black, etc.)
export async function placeBet(
  paymentRequest: PaymentRequest,
  betType: string
): Promise<any> {
  const response = await fetch(`${CASINO_API_URL}/play/quick`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Payment': JSON.stringify(paymentRequest),
    },
    body: JSON.stringify({ betType }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to place bet');
  }

  return response.json();
}

// Place custom bet (numbers, splits, etc.)
export async function placeCustomBet(
  paymentRequest: PaymentRequest,
  bets: Array<{ type: string; numbers: number[]; amount: string }>
): Promise<any> {
  const response = await fetch(`${CASINO_API_URL}/play/custom`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Payment': JSON.stringify(paymentRequest),
    },
    body: JSON.stringify({ bets }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to place bet');
  }

  return response.json();
}

// Get player stats
export async function getPlayerStats(walletAddress: string): Promise<any> {
  const response = await fetch(`${CASINO_API_URL}/roulette/stats/${walletAddress}`);

  if (!response.ok) {
    throw new Error('Failed to fetch stats');
  }

  return response.json();
}

// Get wallet balance
export async function getWalletBalance(walletAddress: string): Promise<any> {
  const response = await fetch(`${CASINO_API_URL}/wallet/balance/${walletAddress}`);

  if (!response.ok) {
    throw new Error('Failed to fetch balance');
  }

  return response.json();
}
