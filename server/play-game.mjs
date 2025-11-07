#!/usr/bin/env node

/**
 * Simple script to play roulette from command line
 * Usage: node play-game.mjs [betType] [numGames]
 * Example: node play-game.mjs red 5
 */

import fs from 'fs';
import crypto from 'crypto';
import nacl from 'tweetnacl';
import { default as bs58 } from 'bs58';
import { Connection, PublicKey, SystemProgram, Transaction, Keypair } from '@solana/web3.js';

// Load environment variables
const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && !key.startsWith('#')) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const CASINO_URL = env.CASINO_URL || 'http://localhost:3003';
const FACILITATOR_PUBLIC_KEY = env.FACILITATOR_PUBLIC_KEY;
const MERCHANT_ADDRESS = env.MERCHANT_SOLANA_ADDRESS;
const RPC_URL = env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const NETWORK = env.SOLANA_NETWORK || 'devnet';
const PLAYER_KEYPAIR_PATH = './keys/player-keypair.json';

// Parse command line arguments
const betType = process.argv[2] || 'red';
const numGames = parseInt(process.argv[3]) || 1;

const validBetTypes = ['red', 'black', 'even', 'odd', 'low', 'high'];
if (!validBetTypes.includes(betType)) {
  console.error(`❌ Invalid bet type: ${betType}`);
  console.log(`Valid types: ${validBetTypes.join(', ')}`);
  process.exit(1);
}

// Load player keypair
let playerKeypair;
try {
  const keypairData = JSON.parse(fs.readFileSync(PLAYER_KEYPAIR_PATH, 'utf8'));
  playerKeypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
} catch (error) {
  console.error('❌ Error loading player keypair:', error.message);
  console.log('💡 Run the setup first: npm run setup');
  process.exit(1);
}

const BET_AMOUNT_SOL = '0.001';
const BET_AMOUNT_LAMPORTS = Math.floor(parseFloat(BET_AMOUNT_SOL) * 1e9);

async function playGame(betType) {
  try {
    // 1. Create nonce and timestamp
    const nonce = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now();
    const expiry = timestamp + 300000; // 5 minutes
    const resourceUrl = '/play/quick';

    // 2. Create authorization payload
    const payload = {
      amount: BET_AMOUNT_LAMPORTS.toString(),
      recipient: MERCHANT_ADDRESS,
      resourceId: resourceUrl,
      resourceUrl: resourceUrl,
      nonce: nonce,
      timestamp: timestamp,
      expiry: expiry,
    };

    // 3. Create structured data for signature (must match server-side exactly)
    const structuredData = {
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

    // 4. Sign authorization
    const messageToSign = JSON.stringify(structuredData);
    const messageBytes = Buffer.from(messageToSign, 'utf-8');
    const authSignature = nacl.sign.detached(messageBytes, playerKeypair.secretKey);

    // 5. Create Solana transaction
    const connection = new Connection(RPC_URL, 'confirmed');
    const { blockhash } = await connection.getLatestBlockhash('confirmed');

    const transaction = new Transaction({
      feePayer: new PublicKey(FACILITATOR_PUBLIC_KEY),
      recentBlockhash: blockhash,
    });

    transaction.add(
      SystemProgram.transfer({
        fromPubkey: playerKeypair.publicKey,
        toPubkey: new PublicKey(MERCHANT_ADDRESS),
        lamports: BET_AMOUNT_LAMPORTS,
      })
    );

    // 6. Sign transaction
    transaction.sign(playerKeypair);

    // 7. Serialize transaction
    const serializedTransaction = transaction
      .serialize({
        requireAllSignatures: false,
        verifySignatures: true,
      })
      .toString('base64');

    // 8. Create payment request
    const paymentRequest = {
      payload: payload,
      signature: bs58.encode(authSignature),
      clientPublicKey: playerKeypair.publicKey.toString(),
      signedTransaction: serializedTransaction,
    };

    // 9. Make API call to play
    const response = await fetch(`${CASINO_URL}/play/quick`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Payment': JSON.stringify(paymentRequest),
      },
      body: JSON.stringify({
        type: betType,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Game failed: ${response.status} - ${error}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

async function checkBalance() {
  try {
    const response = await fetch(`${CASINO_URL}/wallet/balance/${playerKeypair.publicKey.toString()}`);
    if (response.ok) {
      const data = await response.json();
      return data.data;
    }
  } catch (error) {
    // Ignore balance check errors
  }
  return null;
}

// Main execution
(async () => {
  console.log('🎰 BetMonkey Roulette');
  console.log('═══════════════════════');
  console.log('');
  console.log(`Player: ${playerKeypair.publicKey.toString()}`);
  console.log(`Bet Type: ${betType.toUpperCase()}`);
  console.log(`Games to play: ${numGames}`);
  console.log(`Bet amount: ${BET_AMOUNT_SOL} SOL per game`);
  console.log('');

  // Check initial balance
  const initialBalance = await checkBalance();
  if (initialBalance) {
    console.log(`💰 Initial balance: ${initialBalance.availableBalance} SOL`);
    console.log('');
  }

  let wins = 0;
  let losses = 0;
  let totalProfit = 0;

  for (let i = 1; i <= numGames; i++) {
    console.log(`\n🎲 Game ${i}/${numGames} - Betting on ${betType.toUpperCase()}`);
    console.log('─'.repeat(50));

    try {
      const result = await playGame(betType);

      if (result.success) {
        const gameData = result.data;
        const won = gameData.won;
        const profit = parseFloat(gameData.profit);

        console.log(`   Result: ${gameData.result}`);
        console.log(`   ${won ? '🎉 WON!' : '💔 LOST'}`);
        console.log(`   Profit: ${profit > 0 ? '+' : ''}${profit.toFixed(9)} SOL`);

        if (won) {
          wins++;
        } else {
          losses++;
        }
        totalProfit += profit;
      } else {
        console.log('   ❌ Game failed');
        losses++;
      }

      // Small delay between games
      if (i < numGames) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      losses++;
    }
  }

  // Final statistics
  console.log('\n');
  console.log('═══════════════════════════════════════');
  console.log('📊 SESSION SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`Total games: ${numGames}`);
  console.log(`Wins: ${wins} (${((wins / numGames) * 100).toFixed(1)}%)`);
  console.log(`Losses: ${losses} (${((losses / numGames) * 100).toFixed(1)}%)`);
  console.log(`Total profit: ${totalProfit > 0 ? '+' : ''}${totalProfit.toFixed(9)} SOL`);

  // Check final balance
  const finalBalance = await checkBalance();
  if (finalBalance) {
    console.log(`\n💰 Final balance: ${finalBalance.availableBalance} SOL`);
  }

  console.log('═══════════════════════════════════════');
  console.log('');
})();
