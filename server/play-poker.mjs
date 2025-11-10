import fs from 'fs';
import crypto from 'crypto';
import nacl from 'tweetnacl';
import { default as bs58 } from 'bs58';
import { Connection, PublicKey, SystemProgram, Transaction, Keypair } from '@solana/web3.js';

const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach((line) => {
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

const betAmountSOL = process.argv[2] || '0.01';
const numGames = parseInt(process.argv[3]) || 1;

let playerKeypair;
try {
  const keypairData = JSON.parse(fs.readFileSync(PLAYER_KEYPAIR_PATH, 'utf8'));
  playerKeypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
} catch (error) {
  console.error('❌ Error loading player keypair:', error.message);
  console.log('💡 Run the setup first: npm run setup:player');
  process.exit(1);
}

const BET_AMOUNT_LAMPORTS = Math.floor(parseFloat(betAmountSOL) * 1e9);

async function playPoker(betAmount) {
  try {
    const nonce = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now();
    const expiry = timestamp + 300000;
    const resourceUrl = '/play/poker';

    const payload = {
      amount: BET_AMOUNT_LAMPORTS.toString(),
      recipient: MERCHANT_ADDRESS,
      resourceId: resourceUrl,
      resourceUrl: resourceUrl,
      nonce: nonce,
      timestamp: timestamp,
      expiry: expiry,
    };

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

    const messageToSign = JSON.stringify(structuredData);
    const messageBytes = Buffer.from(messageToSign, 'utf-8');
    const authSignature = nacl.sign.detached(messageBytes, playerKeypair.secretKey);

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

    transaction.sign(playerKeypair);

    const serializedTransaction = transaction
      .serialize({
        requireAllSignatures: false,
        verifySignatures: true,
      })
      .toString('base64');

    const paymentRequest = {
      payload: payload,
      signature: bs58.encode(authSignature),
      clientPublicKey: playerKeypair.publicKey.toString(),
      signedTransaction: serializedTransaction,
    };

    const response = await fetch(`${CASINO_URL}/play/poker`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Payment': JSON.stringify(paymentRequest),
      },
      body: JSON.stringify({
        amount: betAmount,
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
    console.log('Check Balance');
  }
  return null;
}

(async () => {
  console.log("🎴 BetMonkey Poker - Texas Hold'em");
  console.log('═══════════════════════════════════');
  console.log('');
  console.log(`Player: ${playerKeypair.publicKey.toString()}`);
  console.log(`Bet Amount: ${betAmountSOL} SOL`);
  console.log(`Games to play: ${numGames}`);
  console.log('');

  const initialBalance = await checkBalance();
  if (initialBalance) {
    console.log(`💰 Initial balance: ${initialBalance.availableBalance} SOL`);
    console.log('');
  }

  let wins = 0;
  let losses = 0;
  let ties = 0;
  let totalProfit = 0;

  for (let i = 1; i <= numGames; i++) {
    console.log(`\n🎲 Game ${i}/${numGames}`);
    console.log('─'.repeat(50));

    try {
      const result = await playPoker(betAmountSOL);

      if (result.success) {
        const gameData = result.data;

        console.log(`\n🎴 Your Cards: ${gameData.playerHole.join(' ')}`);
        console.log(`🎴 Dealer Cards: ${gameData.dealerHole.join(' ')}`);
        console.log(`🎴 Community: ${gameData.community.join(' ')}`);
        console.log(`\n👤 Your Hand: ${gameData.playerHand.name}`);
        console.log(`   ${gameData.playerHand.cards}`);
        console.log(`🤖 Dealer Hand: ${gameData.dealerHand.name}`);
        console.log(`   ${gameData.dealerHand.cards}`);
        console.log(`   Dealer ${gameData.dealerQualified ? '✓ QUALIFIED' : '✗ NOT QUALIFIED (needs Pair+)'}`);

        const won = gameData.won;
        const tied = gameData.tied;
        const profit = parseFloat(gameData.profit);

        if (won) {
          if (gameData.dealerQualified) {
            console.log(`\n   🎉 YOU WON! (Dealer qualified)`);
          } else {
            console.log(`\n   💰 YOU WON! (Dealer didn't qualify - Ante only)`);
          }
          wins++;
        } else if (tied) {
          console.log(`\n   🤝 TIE - Push`);
          ties++;
        } else {
          console.log(`\n   💔 YOU LOST`);
          losses++;
        }

        console.log(`   Winner: ${gameData.winner}`);
        console.log(`   Payout: ${gameData.payoutType}`);
        console.log(`   Bet: ${gameData.betAmount} SOL`);
        console.log(`   Win: ${gameData.winAmount} SOL`);
        console.log(`   Profit: ${profit > 0 ? '+' : ''}${profit.toFixed(9)} SOL`);

        totalProfit += profit;
      } else {
        console.log('   ❌ Game failed');
        losses++;
      }

      if (i < numGames) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      losses++;
    }
  }

  console.log('\n');
  console.log('═══════════════════════════════════════');
  console.log('📊 SESSION SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`Total games: ${numGames}`);
  console.log(`Wins: ${wins} (${((wins / numGames) * 100).toFixed(1)}%)`);
  console.log(`Losses: ${losses} (${((losses / numGames) * 100).toFixed(1)}%)`);
  console.log(`Ties: ${ties} (${((ties / numGames) * 100).toFixed(1)}%)`);
  console.log(`Total profit: ${totalProfit > 0 ? '+' : ''}${totalProfit.toFixed(9)} SOL`);

  const finalBalance = await checkBalance();
  if (finalBalance) {
    console.log(`\n💰 Final balance: ${finalBalance.availableBalance} SOL`);

    if (initialBalance) {
      const balanceChange = parseFloat(finalBalance.availableBalance) - parseFloat(initialBalance.availableBalance);
      console.log(`   Change: ${balanceChange > 0 ? '+' : ''}${balanceChange.toFixed(9)} SOL`);
    }
  }

  console.log('═══════════════════════════════════════\n');
})();
