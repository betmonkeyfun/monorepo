#!/bin/bash

# BetMonkey Player Setup Script
# Sets up player keypair and funds it automatically

set -e  # Exit on error

echo "🎮 BetMonkey Player Setup"
echo "========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if .env exists
if [ ! -f ".env" ]; then
    print_error ".env file not found!"
    print_info "Please run ./setup-casino.sh first"
    exit 1
fi

# Configuration
PLAYER_KEYPAIR="./keys/player-keypair.json"
FACILITATOR_KEYPAIR="./keys/facilitator-keypair.json"
NETWORK="devnet"

echo "Step 1: Generating player keypair..."
echo "-------------------------------------"

if [ -f "$PLAYER_KEYPAIR" ]; then
    print_info "Player keypair already exists at $PLAYER_KEYPAIR"

    # Check if interactive
    if [ -t 0 ]; then
        read -p "Do you want to generate a new one? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            solana-keygen new --outfile "$PLAYER_KEYPAIR" --force --no-bip39-passphrase
            print_success "New player keypair generated"
        fi
    else
        print_info "Non-interactive mode: keeping existing keypair"
    fi
else
    solana-keygen new --outfile "$PLAYER_KEYPAIR" --no-bip39-passphrase
    print_success "Player keypair generated at $PLAYER_KEYPAIR"
fi

# Extract player public key
PLAYER_PUBKEY=$(solana-keygen pubkey "$PLAYER_KEYPAIR")
print_info "Player public key: $PLAYER_PUBKEY"

echo ""
echo "Step 2: Funding player wallet..."
echo "---------------------------------"

# Set Solana to use devnet
solana config set --url devnet > /dev/null

# Check current balance
PLAYER_BALANCE=$(solana balance "$PLAYER_PUBKEY" 2>/dev/null | awk '{print $1}')
print_info "Current balance: $PLAYER_BALANCE SOL"

# Fund player with at least 0.5 SOL
REQUIRED_BALANCE=0.5

if (( $(echo "$PLAYER_BALANCE < $REQUIRED_BALANCE" | bc -l) )); then
    print_info "Balance is low, funding from facilitator..."

    # Check if facilitator has funds
    FACILITATOR_PUBKEY=$(solana-keygen pubkey "$FACILITATOR_KEYPAIR")
    FACILITATOR_BALANCE=$(solana balance "$FACILITATOR_PUBKEY" 2>/dev/null | awk '{print $1}')

    if (( $(echo "$FACILITATOR_BALANCE < 1" | bc -l) )); then
        print_error "Facilitator balance is too low ($FACILITATOR_BALANCE SOL)"
        print_info "Requesting airdrop for facilitator..."

        if solana airdrop 2 "$FACILITATOR_PUBKEY" --url devnet 2>/dev/null; then
            print_success "Facilitator airdrop successful"
            sleep 2  # Wait for confirmation
        else
            print_error "Facilitator airdrop failed"
            print_info "Please fund facilitator manually: solana airdrop 2 $FACILITATOR_PUBKEY --url devnet"
            exit 1
        fi
    fi

    # Transfer from facilitator to player
    print_info "Transferring 0.5 SOL from facilitator to player..."

    if solana transfer \
        --keypair "$FACILITATOR_KEYPAIR" \
        "$PLAYER_PUBKEY" \
        0.5 \
        --url devnet \
        --allow-unfunded-recipient \
        2>/dev/null; then

        print_success "Transfer successful!"
        sleep 2  # Wait for confirmation

        # Check new balance
        NEW_BALANCE=$(solana balance "$PLAYER_PUBKEY" 2>/dev/null | awk '{print $1}')
        print_info "New player balance: $NEW_BALANCE SOL"
    else
        print_error "Transfer failed"
        print_info "Try manually: solana transfer --keypair $FACILITATOR_KEYPAIR $PLAYER_PUBKEY 0.5 --url devnet --allow-unfunded-recipient"
        exit 1
    fi
else
    print_success "Player balance is sufficient ($PLAYER_BALANCE SOL)"
fi

echo ""
echo "=========================================="
echo "✅ Player Setup Complete!"
echo "=========================================="
echo ""
echo "Player Information:"
echo "-------------------"
echo "Public Key: $PLAYER_PUBKEY"
echo "Balance: $(solana balance "$PLAYER_PUBKEY" 2>/dev/null | awk '{print $1}') SOL"
echo "Keypair: $PLAYER_KEYPAIR"
echo ""
echo "Ready to Play!"
echo "--------------"
echo "You can now play with:"
echo "  npm run play:red       # Bet on red"
echo "  npm run play:black     # Bet on black"
echo "  npm run play:green     # Bet on green (0)"
echo "  npm run play:auto      # Auto-play 5 games"
echo ""
echo "Or with custom parameters:"
echo "  node play-game.mjs black 10    # 10 games on black"
echo "  node play-number.mjs 0 5       # 5 games on green (0)"
echo "  node play-number.mjs 17 3      # 3 games on number 17"
echo ""
print_success "Happy playing! 🎰"
echo ""
