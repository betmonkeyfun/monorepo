# BetMonkey Casino

A decentralized casino platform built on Solana blockchain, featuring provably fair gaming, instant payment settlement, and an innovative tokenomics model powered by the x402 payment protocol.

## Table of Contents

- [Overview](#overview)
- [Business Model](#business-model)
- [Architecture](#architecture)
- [Technical Stack](#technical-stack)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [Games](#games)
- [Tokenomics](#tokenomics)
- [x402 Payment Protocol](#x402-payment-protocol)
- [Installation](#installation)
- [Configuration](#configuration)
- [Development](#development)
- [Deployment](#deployment)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

## Overview

BetMonkey is a fully decentralized casino platform that leverages Solana's high-performance blockchain to provide:

- Provably fair casino games with transparent on-chain settlement
- Instant payment processing using the HTTP 402 payment protocol
- Zero-fee withdrawals from casino balance to user wallets
- Dynamic token economy with automated buyback mechanism
- Sub-second transaction finality
- Minimal transaction costs
- Complete transparency and verifiability

The platform currently features European Roulette and Texas Hold'em Poker, with plans to expand to additional casino games.

## Business Model

BetMonkey operates on a sustainable revenue model that benefits both the platform and token holders:

### Revenue Streams

1. **House Edge**: Traditional casino house advantage on games
   - Roulette: 2.7% house edge (European single-zero)
   - Poker: Variable based on hand strength and payout odds
   - All odds are transparent and verifiable on-chain

2. **Transaction Fees**: Minimal fees for certain operations
   - Withdrawal fees: 0.0001 SOL per transaction (covers network costs)
   - No deposit fees
   - No hidden charges

3. **Token Trading Spread**: Revenue from token buy/sell operations
   - Bonding curve mechanism ensures liquidity
   - Spread contributes to platform sustainability

### Revenue Allocation

The platform implements an intelligent revenue allocation strategy:

- **60% Token Buyback**: Automatically purchases BMONKEY tokens from the market
- **30% Casino Reserve**: Maintains liquidity for player winnings
- **10% Operations**: Platform maintenance and development

### Token Economics

BMONKEY token creates a deflationary ecosystem where:

- Platform profits drive token demand through automated buybacks
- Token price increases as casino reserves grow
- Early participants benefit from platform success
- Token holders gain indirect exposure to casino performance

This model aligns incentives between the platform, players, and token holders, creating a sustainable ecosystem where all participants benefit from the casino's success.

## Architecture

BetMonkey is built as a modern monorepo with three primary components:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION LAYER                       │
│                                                                       │
│  ┌──────────────────┐          ┌──────────────────┐                │
│  │  Web Frontend    │          │  Wallet (Phantom,│                │
│  │  (Next.js 15)    │◄────────►│  Solflare, etc.) │                │
│  │  - Game UI       │          │  - Sign txs      │                │
│  │  - Wallet conn   │          │  - Sign auth     │                │
│  └────────┬─────────┘          └──────────────────┘                │
└───────────┼──────────────────────────────────────────────────────────┘
            │ HTTP + x402 Payment Headers
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       APPLICATION LAYER                              │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Casino Backend (Express + TypeScript)            │  │
│  │                                                                │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │  │
│  │  │  Roulette   │  │   Poker     │  │   Token     │          │  │
│  │  │  Service    │  │  Service    │  │  Service    │          │  │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │  │
│  │         │                 │                 │                 │  │
│  │  ┌──────▼─────────────────▼─────────────────▼──────┐         │  │
│  │  │          Wallet Service (Balance Mgmt)          │         │  │
│  │  └────────────────────┬────────────────────────────┘         │  │
│  │                       │                                        │  │
│  │  ┌────────────────────▼────────────────────────────┐         │  │
│  │  │           SQLite Database (Game State)          │         │  │
│  │  └─────────────────────────────────────────────────┘         │  │
│  └────────────────────────┬───────────────────────────────────────┘
│                           │ Proxy requests                         │
│  ┌────────────────────────▼───────────────────────────────────────┐
│  │                    Payment Server (Express)                     │
│  │  - x402 middleware                                              │
│  │  - Payment validation                                           │
│  │  - Route protection                                             │
│  └────────────────────────┬───────────────────────────────────────┘
│                           │ Forward payment                         │
│  ┌────────────────────────▼───────────────────────────────────────┐
│  │                   Facilitator (Express)                         │
│  │  - Signature verification                                       │
│  │  - Nonce management (SQLite)                                    │
│  │  - Transaction sponsorship                                      │
│  │  - Replay attack prevention                                     │
│  └────────────────────────┬───────────────────────────────────────┘
└───────────────────────────┼──────────────────────────────────────────┘
                            │ Broadcast signed transaction
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       BLOCKCHAIN LAYER                               │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Solana Blockchain (Devnet/Mainnet)               │  │
│  │  - Instant finality (400ms)                                   │  │
│  │  - Low transaction costs (~0.00025 SOL)                       │  │
│  │  - High throughput (65,000 TPS)                               │  │
│  │  - On-chain payment settlement                                │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │         SPL Token Program (BMONKEY Token)                     │  │
│  │  - Token mint and transfers                                   │  │
│  │  - Bonding curve implementation                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
            ▲
            │ Automated buyback
            │
┌───────────┴──────────────────────────────────────────────────────────┐
│                       AUTOMATION LAYER                                │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │               AI Agent (Token Buyback Bot)                    │   │
│  │  - Monitors casino profits                                    │   │
│  │  - Executes token purchases via Jupiter DEX                   │   │
│  │  - Manages buyback schedule                                   │   │
│  │  - Provides price support                                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

#### Frontend (Next.js 15)
- User interface for casino games
- Solana wallet integration (via Reown AppKit)
- Transaction signing and submission
- Real-time game state updates
- Responsive design with 3D animations

#### Casino Backend (Express + TypeScript)
- Game logic execution (Roulette, Poker)
- Player balance management
- Win/loss calculation
- Game history and statistics
- Database management (SQLite)

#### Payment Server (Express + TypeScript)
- HTTP 402 protocol implementation
- Payment validation middleware
- Protected route management
- Payment forwarding to facilitator

#### Facilitator (Express + TypeScript)
- Signature verification
- Cryptographic nonce management
- Replay attack prevention
- Transaction sponsorship (gas fee payment)
- Solana blockchain interaction

#### Token System (Bun + TypeScript)
- SPL token management
- Bonding curve implementation
- Automated buyback execution
- Jupiter DEX integration
- Price discovery mechanism

## Technical Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Reown AppKit**: Solana wallet integration
- **Solana Web3.js**: Blockchain interaction
- **GSAP**: High-performance animations
- **Framer Motion**: Declarative animations
- **Tailwind CSS**: Utility-first styling

### Backend
- **Node.js 18+**: Runtime environment
- **Express.js**: Web application framework
- **TypeScript**: Type safety across codebase
- **Gill SDK**: Solana TypeScript SDK
- **@solana/web3.js**: Solana JavaScript API
- **SQLite3**: Lightweight database
- **PM2**: Process management
- **Zod**: Runtime type validation

### Token Infrastructure
- **Bun**: Fast JavaScript runtime
- **SPL Token Program**: Solana token standard
- **Jupiter Aggregator**: DEX routing
- **Solana CLI**: Token deployment tools

### Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **tsx**: TypeScript execution
- **Nodemon**: Development hot-reload

## Project Structure

```
betmonkey/
│
├── frontend/                      # Next.js web application
│   ├── src/
│   │   ├── app/                  # Next.js App Router pages
│   │   │   ├── page.tsx         # Landing page
│   │   │   ├── roulette/        # Roulette game page
│   │   │   ├── poker/           # Poker game page
│   │   │   ├── token/           # Token trading page
│   │   │   └── api/             # API routes
│   │   ├── components/          # React components
│   │   │   ├── roulette/       # Roulette UI components
│   │   │   ├── poker/          # Poker UI components
│   │   │   └── casino/         # Shared casino components
│   │   ├── contexts/           # React contexts (Wallet)
│   │   ├── lib/                # Utility functions
│   │   └── types/              # TypeScript definitions
│   ├── public/                 # Static assets
│   ├── package.json
│   └── next.config.js
│
├── server/                       # Backend services
│   ├── src/
│   │   ├── casino/             # Casino game server
│   │   │   ├── index.ts       # Main casino server
│   │   │   ├── database/      # Database schemas
│   │   │   ├── services/      # Game logic services
│   │   │   │   ├── roulette.service.ts
│   │   │   │   ├── poker.service.ts
│   │   │   │   ├── wallet.service.ts
│   │   │   │   └── user.service.ts
│   │   │   ├── routes/        # API route handlers
│   │   │   └── types/         # Type definitions
│   │   │
│   │   ├── facilitator/        # x402 facilitator
│   │   │   └── index.ts       # Payment facilitator service
│   │   │
│   │   ├── server/            # x402 payment server
│   │   │   └── index.ts       # Payment validation server
│   │   │
│   │   ├── token/             # Token system
│   │   │   ├── index.ts       # Token service
│   │   │   ├── bonding-curve.ts
│   │   │   └── routes.ts
│   │   │
│   │   ├── lib/               # Shared utilities
│   │   │   ├── x402-middleware.ts      # Payment middleware
│   │   │   ├── nonce-database.ts       # Nonce management
│   │   │   ├── solana-utils.ts         # Blockchain utils
│   │   │   ├── payment-request.ts      # Payment structures
│   │   │   └── api-response-helpers.ts
│   │   │
│   │   ├── routes/            # Facilitator routes
│   │   │   ├── health.ts
│   │   │   ├── verify.ts
│   │   │   ├── settle.ts
│   │   │   ├── nonce.ts
│   │   │   └── stats.ts
│   │   │
│   │   └── errors/            # Custom error classes
│   │
│   ├── data/                  # Runtime data
│   │   ├── casino.db         # Casino game database
│   │   └── nonce.db          # Payment nonce database
│   │
│   ├── test-true-x402.mjs    # Integration tests
│   ├── test-replay-attack.mjs
│   ├── play-game.mjs         # Game testing scripts
│   ├── ecosystem.config.cjs  # PM2 configuration
│   ├── package.json
│   └── tsconfig.json
│
├── contracts/                   # Token and smart contracts
│   ├── token/                 # SPL token deployment
│   │   ├── wallet.ts         # Keypair management
│   │   ├── get-devnet-sol.ts # Faucet utility
│   │   ├── create-token.ts   # Token creation
│   │   └── create-pool.ts    # Liquidity pool setup
│   │
│   ├── ai-agent/             # Automated buyback agent
│   │   ├── index.ts         # Agent orchestration
│   │   └── trader.ts        # Jupiter integration
│   │
│   ├── config/               # Network configuration
│   │   └── network.ts
│   │
│   ├── .env                  # Token config (not committed)
│   ├── .wallet.json          # Keypair (not committed)
│   ├── .token-info.json      # Deployment data (not committed)
│   └── package.json
│
├── package.json               # Root monorepo config
├── package-lock.json
└── README.md                 # This file
```

## How It Works

### Payment Flow (x402 Protocol)

BetMonkey implements the HTTP 402 payment protocol, enabling seamless micropayments:

1. **User Initiates Bet**
   - Player selects game and bet amount in the frontend
   - Frontend creates a Solana transaction (player → merchant)
   - User signs transaction with their wallet
   - User signs authorization payload (includes nonce for replay protection)

2. **Payment Request**
   - Frontend sends HTTP request to casino backend
   - Transaction and signature included in `X-PAYMENT` header
   - Authorization included in `X-AUTH-SIGNATURE` header

3. **Payment Validation**
   - Casino server forwards payment to facilitator
   - Facilitator verifies all signatures
   - Checks nonce database for replay attacks
   - Validates payment amount and recipient

4. **Transaction Sponsorship**
   - Facilitator adds its signature as fee payer
   - This allows user to make payments without holding SOL for gas
   - Improved UX: users only need funds for betting

5. **Blockchain Settlement**
   - Facilitator broadcasts transaction to Solana
   - Payment settles on-chain (instant finality in ~400ms)
   - Player funds transfer from user wallet to casino
   - Transaction is irreversible and verifiable

6. **Game Execution**
   - Casino server receives confirmation
   - Executes game logic (spin roulette, deal poker)
   - Credits winnings to internal player balance
   - Returns game result to frontend

7. **Balance Management**
   - Winnings stored in internal casino balance
   - Zero-fee transfers between bets
   - Withdraw anytime to external wallet
   - Minimal withdrawal fee (0.0001 SOL covers network costs)

### Game Flow

#### Roulette

European Roulette with single zero (0-36):

1. **Bet Placement**
   - Quick bets: red, black, even, odd, high, low
   - Custom bets: specific numbers, ranges, combinations
   - Minimum bet: 0.001 SOL (quick), 0.01 SOL (custom)

2. **Spin Execution**
   - Cryptographically secure random number generation
   - Result: winning number (0-36)
   - Outcome determined by backend (provably fair)

3. **Payout Calculation**
   - Red/Black/Even/Odd/High/Low: 1:1 (pays 2x)
   - Specific number: 35:1 (pays 36x)
   - House edge: 2.7% (standard European roulette)

4. **Balance Update**
   - Winnings credited to casino balance
   - History recorded in database
   - Statistics updated

#### Poker (Texas Hold'em)

Single-player poker against the dealer:

1. **Game Start**
   - Player pays ante (0.001 SOL)
   - Receives 2 hole cards
   - 5 community cards dealt

2. **Hand Evaluation**
   - Best 5-card hand from 7 available cards
   - Standard poker hand rankings
   - Deterministic evaluation algorithm

3. **Payout Structure**
   - Royal Flush: 50:1
   - Straight Flush: 40:1
   - Four of a Kind: 25:1
   - Full House: 10:1
   - Flush: 7:1
   - Straight: 5:1
   - Three of a Kind: 3:1
   - Two Pair: 2:1
   - Pair of Jacks or Better: 1:1

4. **Result**
   - Winnings calculated based on hand strength
   - Balance updated
   - Hand history saved

### Token System

BMONKEY token operates on a bonding curve mechanism:

1. **Token Creation**
   - SPL token deployed on Solana
   - Initial supply: 1,000,000,000 BMONKEY
   - Decimals: 9 (standard for Solana tokens)

2. **Bonding Curve**
   - Price increases with casino reserve growth
   - Formula: price = reserve_ratio * supply_ratio
   - Provides consistent liquidity
   - Prevents price manipulation

3. **Automated Buyback**
   - Agent monitors casino profits every 5 minutes
   - Converts 60% of profits to BMONKEY via Jupiter DEX
   - Minimum threshold: 0.1 SOL per purchase
   - Creates constant buy pressure

4. **Trading**
   - Users can buy BMONKEY with SOL
   - Users can sell BMONKEY for SOL
   - Spread benefits platform sustainability
   - Liquidity guaranteed by bonding curve

## Games

### European Roulette

Classic casino game with 37 numbers (0-36):

**Bet Types:**
- Red/Black: 18 numbers each, pays 1:1
- Even/Odd: 18 numbers each, pays 1:1
- High (19-36)/Low (1-18): 18 numbers each, pays 1:1
- Specific number: Pays 35:1

**House Edge:** 2.7% (single zero)

**Features:**
- Instant results
- Animated 3D wheel
- Bet history tracking
- Win/loss statistics
- Balance management

### Texas Hold'em Poker

Video poker variant with community cards:

**Game Flow:**
1. Player receives 2 hole cards
2. 5 community cards dealt (flop, turn, river)
3. Best 5-card hand wins payout

**Hand Rankings:**
- Royal Flush (A♠ K♠ Q♠ J♠ 10♠): 50:1
- Straight Flush (5 consecutive same suit): 40:1
- Four of a Kind: 25:1
- Full House: 10:1
- Flush (5 same suit): 7:1
- Straight (5 consecutive): 5:1
- Three of a Kind: 3:1
- Two Pair: 2:1
- Pair (Jacks or better): 1:1

**Features:**
- Professional card graphics
- Animated dealing
- Hand strength indicator
- Optimal strategy hints
- Detailed payout table

## Tokenomics

### BMONKEY Token

**Specifications:**
- Token Standard: SPL (Solana Program Library)
- Symbol: BMONKEY
- Total Supply: 1,000,000,000
- Decimals: 9
- Network: Solana (Devnet/Mainnet)

### Economic Model

**Revenue Distribution:**
```
Casino Profit (100%)
├─ Token Buyback (60%)
│  └─ Creates upward price pressure
├─ Casino Reserve (30%)
│  └─ Ensures player withdrawals
└─ Operations (10%)
   └─ Platform maintenance
```

**Price Dynamics:**

The bonding curve ensures predictable pricing:

```
Price = Base_Price + (Reserve_SOL / Total_Supply) * Multiplier
```

As casino reserves increase:
- Token price increases proportionally
- Early holders benefit from appreciation
- Liquidity remains constant
- No sudden price crashes

**Buyback Mechanism:**

Automated agent executes:
- Frequency: Every 5 minutes
- Amount: 60% of new profits
- Minimum: 0.1 SOL per transaction
- Route: Jupiter DEX aggregator (best execution)

**Benefits for Holders:**
- Passive exposure to casino performance
- No staking required
- Price appreciation from buybacks
- Liquid market via bonding curve
- Transparent on-chain operations

## x402 Payment Protocol

### Overview

HTTP 402 ("Payment Required") is an underutilized HTTP status code that BetMonkey leverages for seamless blockchain payments:

**Traditional Web Payments:**
```
User → Payment Processor → Merchant → Confirmation
(slow, fees, intermediaries)
```

**x402 on Solana:**
```
User → Direct on-chain payment → Instant settlement
(fast, minimal fees, no intermediaries)
```

### Implementation Details

**1. Payment Header Structure:**

```typescript
headers: {
  'X-PAYMENT': base64(signedTransaction),
  'X-AUTH-SIGNATURE': base64(authSignature),
  'X-NONCE': cryptographicNonce
}
```

**2. Signature Verification:**

The facilitator verifies:
- Transaction signature is valid
- Auth signature matches expected format
- Nonce hasn't been used before
- Payment amount is correct
- Recipient address matches merchant

**3. Replay Protection:**

Nonces are stored in SQLite database:
```sql
CREATE TABLE nonces (
  nonce TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  used_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
```

Each nonce:
- Generated cryptographically on client
- Used exactly once
- Expires after 5 minutes
- Cleaned up automatically

**4. Transaction Sponsorship:**

The facilitator acts as fee payer:
```typescript
transaction.sign(facilitatorKeypair); // Pays gas
// User signature already attached
// Both signatures required for execution
```

Benefits:
- Users don't need SOL for gas
- Simplified UX (only need betting funds)
- Backend absorbs network costs
- Enables true micropayments

**5. Error Handling:**

HTTP status codes map to payment states:
- `200 OK`: Payment successful, resource delivered
- `402 Payment Required`: No payment header provided
- `403 Forbidden`: Invalid payment or signature
- `409 Conflict`: Nonce already used (replay attack)
- `500 Internal Server Error`: Blockchain or processing error

### Security Features

**Cryptographic Security:**
- Ed25519 signatures (Solana standard)
- 256-bit nonces (collision-resistant)
- Transaction hash verification
- Timestamp validation

**Replay Attack Prevention:**
- One-time nonces
- Database persistence
- Automatic expiry
- Concurrent request handling

**Transaction Integrity:**
- Atomic execution (all or nothing)
- On-chain finality
- Irreversible settlement
- Public verification

## Installation

### Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Version 9 or higher
- **Solana CLI**: For wallet generation and blockchain interaction
- **Bun**: For token system (optional but recommended)
- **Git**: For cloning the repository

### Quick Start

1. **Clone Repository**

```bash
git clone https://github.com/betmonkeyfun/monorepo.git
cd monorepo
```

2. **Install Dependencies**

```bash
# Install all workspace dependencies
npm install

# Alternatively, install per workspace
npm install --workspace=server
cd frontend && npm install
cd ../contracts && bun install
```

3. **Generate Facilitator Keypair**

```bash
cd server
solana-keygen new --outfile facilitator-keypair.json
```

4. **Fund Facilitator (Devnet)**

```bash
# Get facilitator public key
solana-keygen pubkey facilitator-keypair.json

# Request airdrop
solana airdrop 2 <FACILITATOR_PUBLIC_KEY> --url devnet
```

## Configuration

### Server Configuration

Create `server/.env`:

```bash
# Copy example
cd server
cp env.example .env
```

**Environment Variables:**

```bash
# Facilitator Configuration
FACILITATOR_PORT=3001
FACILITATOR_PRIVATE_KEY=<base58_private_key_from_keypair>
SOLANA_RPC_URL=https://api.devnet.solana.com
SIMULATE_TRANSACTIONS=false
MAX_PAYMENT_AMOUNT=1000000000

# Payment Server Configuration
SERVER_PORT=3000
FACILITATOR_URL=http://localhost:3001

# Casino Configuration
CASINO_PORT=3003
MERCHANT_SOLANA_ADDRESS=<your_merchant_wallet_address>

# Solana Network
SOLANA_NETWORK=devnet

# Database
NONCE_DB_PATH=./data/nonce.db
CASINO_DB_PATH=./data/casino.db
```

### Frontend Configuration

Create `frontend/.env.local`:

```bash
cd frontend
cp .env.example .env.local
```

**Environment Variables:**

```bash
# API Endpoints
NEXT_PUBLIC_CASINO_API_URL=http://localhost:3003
NEXT_PUBLIC_FACILITATOR_URL=http://localhost:3001

# Solana Configuration
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com

# Reown AppKit (Wallet Connect)
NEXT_PUBLIC_PROJECT_ID=<your_reown_project_id>
```

Get Reown Project ID at: https://cloud.reown.com/

### Token System Configuration

Create `contracts/.env`:

```bash
cd contracts
cp .env.example .env
```

**Environment Variables:**

```bash
# Network
SOLANA_NETWORK=devnet

# Token Configuration
TOKEN_NAME=BetMonkey
TOKEN_SYMBOL=BMONKEY
TOKEN_DECIMALS=9
TOTAL_SUPPLY=1000000000

# Buyback Agent
BUY_PERCENTAGE=60
MIN_BUY_AMOUNT=0.1
CHECK_INTERVAL=300

# Wallet (generated, don't commit)
PRIVATE_KEY=<base64_encoded_keypair>
```

## Development

### Running Development Environment

**Option 1: Run All Services**

```bash
# Terminal 1: Backend services
cd server
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Token agent (optional)
cd contracts
bun run start-agent
```

**Option 2: Run Individually**

```bash
# Facilitator only
npm run dev:facilitator

# Casino server only
npm run dev:casino

# Frontend only
cd frontend && npm run dev
```

**Option 3: Production Mode (PM2)**

```bash
cd server
npm run build
npm start

# View logs
npm run logs

# Monitor
npm run pm2:monit
```

### Development Workflow

1. **Code Changes**
   - Edit TypeScript files in `src/`
   - Changes auto-reload with `tsx watch`

2. **Testing**
   - Run integration tests: `npm test`
   - Test payment flow: `npm run play`
   - Test specific games: `npm run play:red`

3. **Database Management**
   - Databases created automatically on first run
   - Located in `server/data/`
   - Delete to reset: `rm server/data/*.db`

4. **Debugging**
   - Logs output to console and PM2 logs
   - Check facilitator: `curl http://localhost:3001/health`
   - Check casino: `curl http://localhost:3003/health`

### Testing

**Integration Tests:**

```bash
cd server

# Test x402 payment flow
npm test

# Test HTTP 402 response (no payment)
npm run test:402

# Test replay attack prevention
npm run test:replay
```

**Game Testing:**

```bash
# Generate test wallet
npm run generate:client

# Fund test wallet
solana airdrop 1 <CLIENT_PUBLIC_KEY> --url devnet

# Play roulette
npm run play:red      # Bet on red
npm run play:black    # Bet on black
npm run play:zero     # Bet on zero (green)

# Automated testing
npm run play:auto     # 5 automatic bets
```

**Frontend Testing:**

```bash
cd frontend

# Run Next.js in dev mode
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

### Code Quality

**Linting:**

```bash
# Lint server code
cd server && npm run lint

# Lint frontend code
cd frontend && npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

**Formatting:**

```bash
# Format server code
cd server && npm run fmt

# Check formatting
npm run fmt:check
```

**Type Checking:**

```bash
# TypeScript compilation
npm run build

# Watch mode
npx tsc --watch
```

## Deployment

### Backend Deployment

**Prerequisites:**
- Server with Node.js 18+
- PM2 installed globally
- Solana CLI (for keypair management)
- Funded facilitator wallet

**Steps:**

1. **Prepare Server**

```bash
# Install dependencies
npm install --production

# Build TypeScript
npm run build

# Generate production keypair
solana-keygen new --outfile facilitator-keypair.json
```

2. **Configure Environment**

```bash
# Copy and edit .env
cp env.example .env
nano .env

# Update:
# - FACILITATOR_PRIVATE_KEY
# - MERCHANT_SOLANA_ADDRESS
# - SOLANA_NETWORK=mainnet-beta
# - SOLANA_RPC_URL (use paid RPC for production)
```

3. **Fund Facilitator**

```bash
# Transfer SOL to facilitator for gas fees
# Recommended: 50-100 SOL for production
solana transfer <FACILITATOR_ADDRESS> 50 --url mainnet-beta
```

4. **Start Services**

```bash
# Start with PM2
npm start

# Verify running
pm2 list

# View logs
pm2 logs
```

5. **Setup Monitoring**

```bash
# Install PM2 web dashboard
pm2 install pm2-server-monit

# Setup auto-restart on reboot
pm2 startup
pm2 save
```

### Frontend Deployment

**Vercel (Recommended):**

1. **Connect Repository**
   - Import project in Vercel dashboard
   - Select `frontend` directory as root

2. **Configure Environment**
   - Add all `NEXT_PUBLIC_*` variables
   - Use production API URLs

3. **Deploy**
   - Vercel auto-deploys on push to main
   - Preview deployments for PRs

**Manual Deployment:**

```bash
cd frontend

# Build production bundle
npm run build

# Start production server
npm start

# Or export static site
npm run build && npm run export
```

### Token System Deployment

1. **Switch to Mainnet**

```bash
cd contracts
nano .env

# Update:
SOLANA_NETWORK=mainnet-beta
```

2. **Create Production Token**

```bash
# Generate deployment wallet
bun run token/wallet.ts

# Fund wallet
solana transfer <WALLET_ADDRESS> 10 --url mainnet-beta

# Deploy token
bun run create-token
```

3. **Create Liquidity Pool**

- Use Raydium or Orca web interface
- Add initial liquidity (min 10 SOL recommended)
- Save pool address

4. **Start Buyback Agent**

```bash
# Configure agent with pool address
nano ai-agent/index.ts

# Start agent (use process manager)
pm2 start "bun run start-agent" --name betmonkey-agent

# Monitor
pm2 logs betmonkey-agent
```

### Production Checklist

- [ ] Environment variables configured
- [ ] Facilitator wallet funded (50+ SOL)
- [ ] RPC endpoint configured (paid provider recommended)
- [ ] SSL/TLS certificates installed
- [ ] Firewall configured
- [ ] Monitoring enabled
- [ ] Backups configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Database backed up
- [ ] Token deployed and pool created
- [ ] Agent running and monitored

## Security

### Best Practices

**1. Private Key Management**

Never commit private keys:
```bash
# .gitignore includes:
*.json (keypairs)
.env (environment variables)
```

Production recommendations:
- Use hardware security modules (HSM)
- Implement key rotation policies
- Store backups securely offline
- Use separate keys for dev/prod

**2. Transaction Security**

- All transactions signed with Ed25519
- Replay protection via one-time nonces
- Amount validation before execution
- Signature verification on facilitator
- On-chain settlement (atomic execution)

**3. API Security**

```typescript
// Helmet middleware for security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS,
  credentials: true
}));

// Rate limiting (recommended for production)
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100 // 100 requests per minute
});

app.use('/api/', limiter);
```

**4. Input Validation**

All inputs validated with Zod schemas:

```typescript
const BetRequestSchema = z.object({
  betType: z.enum(['red', 'black', 'even', 'odd']),
  amount: z.string().regex(/^\d+(\.\d+)?$/),
  walletAddress: z.string().length(44),
});
```

**5. Database Security**

- Parameterized queries (prevents SQL injection)
- Regular backups
- Access control
- Encryption at rest (recommended for production)

**6. Nonce Management**

Prevents replay attacks:
```typescript
// Check if nonce already used
const exists = await nonceDb.nonceExists(nonce);
if (exists) {
  throw new Error('Nonce already used');
}

// Store nonce
await nonceDb.insertNonce(nonce, walletAddress);
```

Nonces expire after 5 minutes and are automatically cleaned up.

### Audit Recommendations

Before production deployment:

1. **Smart Contract Audit**
   - Review token contract
   - Verify bonding curve logic
   - Check for reentrancy vulnerabilities

2. **Security Audit**
   - Penetration testing
   - Code review
   - Dependency audit

3. **Performance Testing**
   - Load testing
   - Stress testing
   - Concurrency testing

4. **Compliance Review**
   - Gambling regulations
   - Financial regulations
   - Data protection (GDPR, etc.)

## Contributing

We welcome contributions! Please follow these guidelines:

### Development Process

1. **Fork the Repository**

```bash
git clone https://github.com/yourusername/betmonkey.git
cd betmonkey
git remote add upstream https://github.com/betmonkeyfun/monorepo.git
```

2. **Create Feature Branch**

```bash
git checkout -b feature/your-feature-name
```

3. **Make Changes**

- Follow existing code style
- Add tests for new features
- Update documentation
- Ensure all tests pass

4. **Commit Changes**

```bash
git add .
git commit -m "feat: add amazing feature"
```

Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Testing
- `chore:` Maintenance

5. **Push and Create PR**

```bash
git push origin feature/your-feature-name
```

Create pull request on GitHub.

### Code Standards

**TypeScript:**
- Use strict mode
- Provide type annotations
- Avoid `any` type
- Document complex functions

**React:**
- Use functional components
- Implement proper error boundaries
- Follow hooks best practices
- Optimize re-renders

**Testing:**
- Unit tests for business logic
- Integration tests for APIs
- E2E tests for critical flows

### Areas for Contribution

- **New Games**: Blackjack, Slots, Craps, etc.
- **Mobile App**: React Native implementation
- **Analytics**: Advanced player statistics
- **Social Features**: Leaderboards, achievements
- **Security**: Audits and improvements
- **Documentation**: Tutorials and guides
- **Testing**: Increased coverage
- **Performance**: Optimization opportunities

## License

MIT License - see [LICENSE](LICENSE) file for details.

Copyright (c) 2025 BetMonkey

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Acknowledgments

Built with exceptional open-source technologies:

- **Solana**: High-performance blockchain platform
- **Gill SDK**: Elegant Solana TypeScript SDK
- **Next.js**: React framework by Vercel
- **Express.js**: Web application framework
- **Jupiter Aggregator**: DEX aggregation protocol
- **Reown AppKit**: Wallet connection infrastructure

Special thanks to:
- Solana Foundation for the blockchain infrastructure
- The Solana community for developer resources
- All open-source contributors

## Support

**Documentation:**
- Backend: [server/README.md](server/README.md)
- Token System: [contracts/README.md](contracts/README.md)
- Setup Guide: [server/SETUP.md](server/SETUP.md)

**Community:**
- GitHub Issues: Report bugs and request features
- Discord: Join our community (coming soon)
- Twitter: Follow @BetMonkeyFun for updates

**Contact:**
- Email: support@betmonkey.fun
- GitHub: [@betmonkeyfun](https://github.com/betmonkeyfun)

## Disclaimer

This platform is designed for entertainment and educational purposes. Please gamble responsibly and within your means. Check local regulations regarding online gambling. BetMonkey is not responsible for losses incurred through use of this platform.

Cryptocurrency investments are volatile and high-risk. Only invest what you can afford to lose. Past performance does not indicate future results. This is not financial advice.
