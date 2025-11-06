#!/bin/bash

# BetMonkey Casino - Play Roulette Script
# Automatically sets up player wallet, funds it, and plays roulette

set -e  # Exit on error

echo "🎰 BetMonkey Casino - Play Roulette"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

print_game() {
    echo -e "${CYAN}$1${NC}"
}

print_win() {
    echo -e "${GREEN}$1${NC}"
}

print_lose() {
    echo -e "${RED}$1${NC}"
}

# Check if .env exists
if [ ! -f ".env" ]; then
    print_error ".env file not found!"
    print_info "Please run ./setup-casino.sh first"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Configuration
CASINO_URL="${CASINO_URL:-http://localhost:3003}"
PLAYER_KEYPAIR="./keys/player-keypair.json"
NETWORK="${SOLANA_NETWORK:-devnet}"

# Step 1: Check if services are running
echo "Step 1: Checking services..."
echo "----------------------------"

check_service() {
    local url=$1
    local name=$2

    if curl -s -f "$url/health" > /dev/null 2>&1; then
        print_success "$name is running"
        return 0
    else
        print_error "$name is not running"
        return 1
    fi
}

SERVICES_OK=true
if ! check_service "$FACILITATOR_URL" "Facilitator"; then
    SERVICES_OK=false
fi
if ! check_service "$CASINO_URL" "Casino"; then
    SERVICES_OK=false
fi

if [ "$SERVICES_OK" = false ]; then
    print_error "Some services are not running!"
    print_info "Start services with: npm start"
    print_info "Or in development mode:"
    print_info "  Terminal 1: npm run dev:facilitator"
    print_info "  Terminal 2: npm run dev:casino"
    exit 1
fi

echo ""

# Step 2: Setup player wallet
echo "Step 2: Setting up player wallet..."
echo "------------------------------------"

if [ -f "$PLAYER_KEYPAIR" ]; then
    print_info "Player keypair already exists"
else
    print_info "Generating new player keypair..."
    solana-keygen new --outfile "$PLAYER_KEYPAIR" --no-bip39-passphrase
    print_success "Player keypair generated"
fi

PLAYER_PUBKEY=$(solana-keygen pubkey "$PLAYER_KEYPAIR")
print_info "Player public key: $PLAYER_PUBKEY"

echo ""

# Step 3: Fund player wallet
echo "Step 3: Funding player wallet..."
echo "---------------------------------"

# Set Solana to use correct network
solana config set --url $NETWORK > /dev/null

# Check current balance
PLAYER_BALANCE=$(solana balance "$PLAYER_PUBKEY" 2>/dev/null | awk '{print $1}')
print_info "Current balance: $PLAYER_BALANCE SOL"

if (( $(echo "$PLAYER_BALANCE < 0.1" | bc -l) )); then
    print_info "Balance is low, requesting airdrop..."
    if solana airdrop 1 "$PLAYER_PUBKEY" --url $NETWORK; then
        print_success "Airdrop successful!"
        PLAYER_BALANCE=$(solana balance "$PLAYER_PUBKEY" 2>/dev/null | awk '{print $1}')
        print_info "New balance: $PLAYER_BALANCE SOL"
    else
        print_error "Airdrop failed. Try manually: solana airdrop 1 $PLAYER_PUBKEY --url $NETWORK"
        exit 1
    fi
else
    print_success "Balance is sufficient"
fi

echo ""

# Step 4: Get game info
echo "Step 4: Getting game information..."
echo "------------------------------------"

GAME_INFO=$(curl -s "$CASINO_URL/roulette/info")
print_success "Game: European Roulette (0-36)"
print_info "Available bet types: red, black, even, odd, low, high, dozen, column, straight, etc."

echo ""

# Step 5: Play roulette!
echo "╔═══════════════════════════════════════════════════════╗"
echo "║                                                       ║"
echo "║            🎰 LET'S PLAY ROULETTE! 🎰                 ║"
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Function to play roulette using Node.js (with x402 protocol)
play_roulette() {
    local bet_type=$1
    local bet_amount=$2

    print_game "═══════════════════════════════════════"
    print_game "🎲 New Spin - Betting on: $bet_type"
    print_game "💰 Bet amount: $bet_amount SOL"
    print_game "═══════════════════════════════════════"
    echo ""

    # Use Node.js to make the x402 payment and play
    node -e "
    import fs from 'fs';
    import crypto from 'crypto';
    import nacl from 'tweetnacl';
    import bs58 from 'bs58';
    import { Connection, PublicKey, SystemProgram, Transaction, Keypair } from '@solana/web3.js';

    const CASINO_URL = '$CASINO_URL';
    const FACILITATOR_PUBLIC_KEY = '$FACILITATOR_PUBLIC_KEY';
    const MERCHANT_ADDRESS = '$MERCHANT_SOLANA_ADDRESS';
    const RPC_URL = '$SOLANA_RPC_URL';
    const BET_TYPE = '$bet_type';
    const BET_AMOUNT = '$bet_amount';

    // Load player keypair
    const keypairData = JSON.parse(fs.readFileSync('$PLAYER_KEYPAIR', 'utf8'));
    const playerKeypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));

    async function playGame() {
        try {
            // Calculate amount in lamports
            const lamports = Math.floor(parseFloat(BET_AMOUNT) * 1e9);

            // 1. Create nonce and timestamp
            const nonce = crypto.randomBytes(32).toString('hex');
            const timestamp = Date.now();
            const expiry = timestamp + 300000; // 5 minutes
            const resourceUrl = '/play/quick';

            // 2. Create authorization payload
            const payload = {
                amount: lamports.toString(),
                recipient: MERCHANT_ADDRESS,
                resourceId: resourceUrl,
                resourceUrl: resourceUrl,
                nonce: nonce,
                timestamp: timestamp,
                expiry: expiry,
            };

            // 3. Create structured data for signature
            const structuredData = {
                domain: {
                    name: 'betmonkey-casino',
                    version: '1',
                    chainId: '$NETWORK',
                    verifyingContract: 'casino-roulette',
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
                    lamports: lamports,
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
            console.log('⏳ Spinning the wheel...');
            console.log('');

            const response = await fetch(\`\${CASINO_URL}/play/quick\`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Payment': JSON.stringify(paymentRequest),
                },
                body: JSON.stringify({
                    type: BET_TYPE,
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(\`Game failed: \${response.status} - \${error}\`);
            }

            const result = await response.json();

            // 10. Display results
            console.log('🎰 RESULT 🎰');
            console.log('═══════════════════════════════════════');
            console.log('');
            console.log('  Winning Number: ' + result.data.result);
            console.log('');

            if (result.data.won) {
                console.log('🎉 YOU WON! 🎉');
                console.log('');
                console.log('  💰 Profit: ' + result.data.profit + ' SOL');
            } else {
                console.log('😢 YOU LOST');
                console.log('');
                console.log('  💸 Loss: ' + result.data.profit + ' SOL');
            }

            console.log('');
            console.log('  Game ID: ' + result.data.gameId);
            console.log('');
            console.log('═══════════════════════════════════════');
            console.log('');

        } catch (error) {
            console.error('❌ Error:', error.message);
            process.exit(1);
        }
    }

    playGame();
    "
}

# Menu for bet selection
show_menu() {
    echo ""
    print_info "Choose your bet:"
    echo "  1) Red"
    echo "  2) Black"
    echo "  3) Even"
    echo "  4) Odd"
    echo "  5) Low (1-18)"
    echo "  6) High (19-36)"
    echo "  7) Auto-play 5 random bets"
    echo "  8) View statistics"
    echo "  9) Check balance"
    echo "  0) Exit"
    echo ""
}

# Auto-play function
auto_play() {
    print_info "Starting auto-play with 5 random bets..."
    echo ""

    BET_TYPES=("red" "black" "even" "odd" "low" "high")

    for i in {1..5}; do
        # Random bet type
        RANDOM_INDEX=$((RANDOM % 6))
        BET_TYPE=${BET_TYPES[$RANDOM_INDEX]}

        print_game "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        print_game "Auto-play #$i of 5"
        print_game "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

        play_roulette "$BET_TYPE" "0.001"

        if [ $i -lt 5 ]; then
            sleep 2
        fi
    done

    print_success "Auto-play completed!"
}

# View statistics
view_stats() {
    echo ""
    print_info "Fetching player statistics..."
    echo ""

    STATS=$(curl -s "$CASINO_URL/roulette/stats/$PLAYER_PUBKEY" 2>/dev/null)

    if [ $? -eq 0 ]; then
        echo "$STATS" | node -e "
        const data = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
        if (data.success) {
            console.log('📊 PLAYER STATISTICS');
            console.log('═══════════════════════════════════════');
            console.log('');
            console.log('  Player:', data.data.username);
            console.log('  Wallet:', data.data.walletAddress);
            console.log('');
            console.log('  Total Games:', data.data.stats.totalGames);
            console.log('  Games Won:', data.data.stats.gamesWon);
            console.log('  Games Lost:', data.data.stats.gamesLost);
            console.log('  Win Rate:', (data.data.stats.winRate * 100).toFixed(2) + '%');
            console.log('');
            console.log('  Total Wagered:', data.data.stats.totalWagered + ' SOL');
            console.log('  Total Won:', data.data.stats.totalWon + ' SOL');
            console.log('  Net Profit:', data.data.stats.netProfit + ' SOL');
            console.log('');
            console.log('═══════════════════════════════════════');
        } else {
            console.log('No statistics found for this player yet.');
        }
        "
    else
        print_error "Failed to fetch statistics"
    fi
}

# Check balance
check_balance() {
    echo ""
    print_info "Checking wallet balance..."

    BALANCE=$(solana balance "$PLAYER_PUBKEY" 2>/dev/null | awk '{print $1}')

    echo ""
    print_game "💰 WALLET BALANCE"
    print_game "═══════════════════════════════════════"
    print_game "  $BALANCE SOL"
    print_game "═══════════════════════════════════════"
}

# Main game loop
while true; do
    show_menu
    read -p "Enter your choice [0-9]: " choice

    case $choice in
        1)
            play_roulette "red" "0.001"
            ;;
        2)
            play_roulette "black" "0.001"
            ;;
        3)
            play_roulette "even" "0.001"
            ;;
        4)
            play_roulette "odd" "0.001"
            ;;
        5)
            play_roulette "low" "0.001"
            ;;
        6)
            play_roulette "high" "0.001"
            ;;
        7)
            auto_play
            ;;
        8)
            view_stats
            ;;
        9)
            check_balance
            ;;
        0)
            echo ""
            print_success "Thanks for playing! 🎰"
            print_info "Final balance: $(solana balance "$PLAYER_PUBKEY" 2>/dev/null | awk '{print $1}') SOL"
            echo ""
            exit 0
            ;;
        *)
            print_error "Invalid choice. Please try again."
            ;;
    esac
done
