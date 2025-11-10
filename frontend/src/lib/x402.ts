import { PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { CASINO_API_URL } from './solana';

// Helper to get numbers for bet type
function getBetNumbers(betType: string): number[] {
  const RED_NUMBERS = [
    1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
  ];
  const BLACK_NUMBERS = [
    2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35,
  ];

  switch (betType) {
    case 'red':
      return RED_NUMBERS;
    case 'black':
      return BLACK_NUMBERS;
    case 'even':
      return Array.from({ length: 18 }, (_, i) => (i + 1) * 2); // 2, 4, 6, ..., 36
    case 'odd':
      return Array.from({ length: 18 }, (_, i) => i * 2 + 1); // 1, 3, 5, ..., 35
    case 'low':
      return Array.from({ length: 18 }, (_, i) => i + 1); // 1-18
    case 'high':
      return Array.from({ length: 18 }, (_, i) => i + 19); // 19-36
    default:
      return [];
  }
}

export interface PaymentPayload {
  amount: string;
  recipient: string;
  resourceId: string;
  resourceUrl: string;
  nonce: string;
  timestamp: number;
  expiry: number;
}

export interface PaymentRequest {
  payload: PaymentPayload;
  signature: string;
  clientPublicKey: string;
  signedTransaction: string;
}

export interface StructuredData {
  domain: {
    name: string;
    version: string;
    chainId: string;
    verifyingContract: string;
  };
  types: {
    AuthorizationPayload: Array<{ name: string; type: string }>;
  };
  primaryType: string;
  message: PaymentPayload;
}

// Generate random nonce
function generateNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
    ''
  );
}

// Create structured data for signing
function createStructuredData(payload: PaymentPayload): StructuredData {
  return {
    domain: {
      name: 'x402-solana-protocol',
      version: '1',
      chainId: 'devnet',
      verifyingContract: 'x402-sol',
    },
    types: {
      AuthorizationPayload: [
        { name: 'amount', type: 'string' },
        { name: 'recipient', type: 'string' },
        { name: 'resourceId', type: 'string' },
        { name: 'resourceUrl', type: 'string' },
        { name: 'nonce', type: 'string' },
        { name: 'timestamp', type: 'uint64' },
        { name: 'expiry', type: 'uint64' },
      ],
    },
    primaryType: 'AuthorizationPayload',
    message: payload,
  };
}

// Serialize structured data for signing (matches CLI)
function serializeStructuredData(data: StructuredData): string {
  return JSON.stringify(data);
}

// Create payment request for x402 protocol (matches CLI implementation)
export async function createPaymentRequest(
  walletPublicKey: PublicKey,
  signTransaction: (transaction: any) => Promise<any>,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>,
  amount: string,
  resourceUrl: string
): Promise<PaymentRequest> {
  const merchantAddress = process.env.NEXT_PUBLIC_RECEIVER_ADDRESS || '';

  // 1. Create nonce and timestamps
  const nonce = generateNonce();
  const timestamp = Date.now();
  const expiry = timestamp + 300000; // 5 minutes

  // 2. Create payload
  const payload: PaymentPayload = {
    amount,
    recipient: merchantAddress,
    resourceId: resourceUrl,
    resourceUrl,
    nonce,
    timestamp,
    expiry,
  };

  // 3. Create structured data and sign authorization
  const structuredData = createStructuredData(payload);
  const messageToSign = serializeStructuredData(structuredData);
  const messageBytes = new TextEncoder().encode(messageToSign);
  const authSignature = await signMessage(messageBytes);

  // 4. Create Solana transfer transaction locally
  const { Connection, Transaction, SystemProgram } = await import(
    '@solana/web3.js'
  );

  // Connect to Solana network
  const network = process.env.NEXT_PUBLIC_NETWORK || 'solana-devnet';
  const rpcUrl =
    network === 'solana-devnet'
      ? 'https://api.devnet.solana.com'
      : 'https://api.mainnet-beta.solana.com';
  const connection = new Connection(rpcUrl, 'confirmed');

  // Get facilitator public key (who pays the transaction fees)
  const facilitatorPublicKey = process.env.NEXT_PUBLIC_FACILITATOR_PUBLIC_KEY;
  if (!facilitatorPublicKey) {
    throw new Error('NEXT_PUBLIC_FACILITATOR_PUBLIC_KEY not set');
  }

  // Get recent blockhash
  const { blockhash } = await connection.getLatestBlockhash('confirmed');

  // Create transaction with facilitator as feePayer (x402 sponsored transaction)
  const transaction = new Transaction({
    feePayer: new PublicKey(facilitatorPublicKey),
    recentBlockhash: blockhash,
  });

  // Add transfer instruction (user sends SOL to merchant)
  const lamports = BigInt(amount);
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: walletPublicKey,
      toPubkey: new PublicKey(merchantAddress),
      lamports: lamports,
    })
  );

  // Sign transaction with wallet (user signs, facilitator will co-sign later)
  const signedTransaction = await signTransaction(transaction);

  // Serialize signed transaction to base64
  const serializedTransaction = signedTransaction.serialize({
    requireAllSignatures: false,
    verifySignatures: true,
  });
  const signedTransactionBase64 = Buffer.from(serializedTransaction).toString(
    'base64'
  );

  // 6. Return payment request
  return {
    payload,
    signature: bs58.encode(authSignature),
    clientPublicKey: walletPublicKey.toBase58(),
    signedTransaction: signedTransactionBase64,
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
    body: JSON.stringify({ type: betType }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to place bet');
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
  const response = await fetch(
    `${CASINO_API_URL}/roulette/stats/${walletAddress}`
  );

  if (!response.ok) {
    return null; // Return null if user doesn't exist yet
  }

  const result = await response.json();
  return result.data?.stats || null;
}

// Get wallet balance (casino balance, not blockchain balance)
export async function getWalletBalance(walletAddress: string): Promise<any> {
  try {
    const response = await fetch(
      `${CASINO_API_URL}/wallet/balance/${walletAddress}`
    );

    if (!response.ok) {
      return { balance: '0.000' };
    }

    const result = await response.json();
    // Backend returns: { success, data: { balance, availableBalance, ... } }
    return {
      balance: parseFloat(result.data?.availableBalance || '0').toFixed(3),
    };
  } catch (error) {
    console.error('Error fetching balance:', error);
    return { balance: '0.000' };
  }
}

// Withdraw balance to wallet
export async function withdrawBalance(
  walletAddress: string,
  amount: string
): Promise<any> {
  const response = await fetch(`${CASINO_API_URL}/wallet/withdraw`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      destinationAddress: walletAddress,
      amount,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to withdraw');
  }

  return response.json();
}

// Place bet using casino balance (no payment signature required)
export async function placeBetWithBalance(
  walletAddress: string,
  betType: string
): Promise<any> {
  const numbers = getBetNumbers(betType);

  const response = await fetch(
    `${CASINO_API_URL}/roulette/quick-bet-with-balance`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        type: betType,
        numbers, // Include numbers for the bet type
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to place bet');
  }

  return response.json();
}

// Place custom bet using casino balance
export async function placeCustomBetWithBalance(
  walletAddress: string,
  bets: Array<{ type: string; numbers: number[]; amount: string }>
): Promise<any> {
  const response = await fetch(`${CASINO_API_URL}/roulette/play-with-balance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      walletAddress,
      bets,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to place bet');
  }

  return response.json();
}

// Deposit to casino balance
export async function depositToBalance(
  paymentRequest: PaymentRequest,
  amount: string
): Promise<any> {
  const response = await fetch(`${CASINO_API_URL}/wallet/deposit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Payment': JSON.stringify(paymentRequest),
    },
    body: JSON.stringify({ amount }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to deposit');
  }

  return response.json();
}

// ========================================================================
// POKER API FUNCTIONS
// ========================================================================

// Play poker (Texas Hold'em)
export async function playPoker(
  paymentRequest: PaymentRequest,
  amount: string
): Promise<any> {
  const response = await fetch(`${CASINO_API_URL}/play/poker`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Payment': JSON.stringify(paymentRequest),
    },
    body: JSON.stringify({ amount }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to play poker');
  }

  return response.json();
}

// Play poker using casino balance (no payment signature required)
export async function playPokerWithBalance(
  walletAddress: string,
  amount: string
): Promise<any> {
  const response = await fetch(`${CASINO_API_URL}/poker/play-with-balance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      walletAddress,
      amount,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to play poker');
  }

  return response.json();
}

// Get poker stats
export async function getPokerStats(walletAddress: string): Promise<any> {
  const response = await fetch(
    `${CASINO_API_URL}/poker/stats/${walletAddress}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch poker stats');
  }

  return response.json();
}

// Get poker game history
export async function getPokerHistory(
  walletAddress: string,
  limit = 10
): Promise<any> {
  const response = await fetch(
    `${CASINO_API_URL}/poker/history/${walletAddress}?limit=${limit}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch poker history');
  }

  return response.json();
}

// Get poker info (payouts, rules)
export async function getPokerInfo(): Promise<any> {
  const response = await fetch(`${CASINO_API_URL}/poker/info`);

  if (!response.ok) {
    throw new Error('Failed to fetch poker info');
  }

  return response.json();
}
