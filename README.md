# BetMonkey

A decentralized betting platform built on Solana blockchain with instant payment settlement using the x402 protocol.

## Overview

BetMonkey leverages Solana's high-performance blockchain and the x402 payment protocol to enable instant, trustless betting with micropayments. The platform features:

- **Instant Settlement**: On-chain payment finality using Solana
- **Sponsored Transactions**: Facilitator pays gas fees for seamless UX
- **Replay Protection**: Cryptographic nonce system prevents duplicate payments
- **Decentralized**: No custodial wallets, users maintain control of funds
- **Low Fees**: Leverages Solana's low transaction costs

## Architectur

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Web Frontend  │  HTTP   │  Payment Server  │  HTTP   │   Facilitator   │
│   (Next.js)     │────────>│   (Express)      │────────>│   (Express)     │
│                 │         │                  │         │                 │
│ • User wallet   │         │ • x402 protocol  │         │ • Verifies tx   │
│ • Betting UI    │         │ • Protected APIs │         │ • Sponsors gas  │
│ • Sign tx/auth  │         │ • Game logic     │         │ • Broadcasts    │
└─────────────────┘         └──────────────────┘         └─────────────────┘
                                                                    │
                                                                    ▼
                                                         ┌─────────────────┐
                                                         │ Solana Blockchain│
                                                         │   (Devnet/Main)  │
                                                         └─────────────────┘
```

## Monorepo Structure

```
betmonkey/
├── server/              # x402 payment server & facilitator
│   ├── src/
│   │   ├── facilitator/ # Payment facilitator service
│   │   ├── server/      # Game/betting server
│   │   ├── lib/         # Shared utilities
│   │   └── routes/      # API endpoints
│   ├── package.json
│   └── README.md        # Detailed server documentation
├── web/                 # Web frontend (Next.js)
│   ├── package.json
│   └── README.md
├── package.json         # Root monorepo config
└── README.md           # This file
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Solana CLI (for generating keypairs and funding wallets)
- A Solana wallet with devnet SOL

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/betmonkey.git
cd betmonkey

# Install all dependencies (uses npm workspaces)
npm install
```

### Configure Server

```bash
cd server

# Generate facilitator keypair
solana-keygen new --outfile facilitator-keypair.json

# Copy and configure environment
cp env.example .env
# Edit .env with your configuration:
# - FACILITATOR_PRIVATE_KEY (from facilitator-keypair.json)
# - MERCHANT_SOLANA_ADDRESS (your merchant wallet)
# - SOLANA_RPC_URL (default: devnet)

# Fund facilitator wallet on devnet
solana airdrop 2 <FACILITATOR_PUBLIC_KEY> --url devnet
```

### Run the Platform

```bash
# From root directory

# Start server (facilitator + payment server)
npm run dev:server

# In another terminal, start web frontend
npm run dev:web
```

The services will be available at:
- Payment Server: http://localhost:3000
- Facilitator: http://localhost:3001
- Web Frontend: http://localhost:3000 (or next available port)

## Development

### Build All Packages

```bash
npm run build
```

### Run Tests

```bash
# Run all tests
npm test

# Test specific workspace
npm test --workspace=server
```

### Code Quality

```bash
# Lint all packages
npm run lint

# Format all packages
npm run fmt

# Check formatting
npm run fmt:check
```

### Development Mode

```bash
# Run server in watch mode
npm run dev:server

# Run web in development mode
npm run dev:web

# Or run both (requires tmux or separate terminals)
npm run dev
```

## How It Works

### x402 Payment Protocol

1. **User Action**: User initiates bet/action on web frontend
2. **Payment Request**: Frontend creates Solana transaction + auth signature
3. **Server Validation**: Payment server validates via facilitator
4. **Facilitator Processing**:
   - Verifies signatures
   - Checks nonce (prevents replays)
   - Adds sponsor signature for gas
   - Broadcasts to Solana
5. **Instant Settlement**: Funds transfer on-chain immediately
6. **Resource Delivery**: Server delivers protected resource/executes bet

### Key Features

**Instant Finality**
- No debt tracking or escrow needed
- Client funds commit on-chain atomically
- Single transaction model

**Replay Protection**
- Cryptographic nonces stored in SQLite
- One-time use enforcement
- Automatic expiry and cleanup

**Sponsored Transactions**
- Facilitator pays gas fees
- Users only sign transfers
- Seamless UX without SOL for gas

## Documentation

- [Server Documentation](./server/README.md) - Detailed x402 implementation guide
- [Server Setup Guide](./server/SETUP.md) - Step-by-step server configuration
- [Web Documentation](./web/README.md) - Frontend development guide

## Tech Stack

### Server
- Node.js + TypeScript
- Express.js
- Solana (Gill SDK + @solana/web3.js)
- SQLite3 (nonce database)
- PM2 (process management)
- Zod (validation)

### Web
- Next.js 14
- React 18
- TypeScript
- Solana Web3.js
- Wallet Adapter

## Environment Variables

### Server (.env)

```env
# Facilitator
FACILITATOR_PORT=3001
FACILITATOR_PRIVATE_KEY=<base58_private_key>
SOLANA_RPC_URL=https://api.devnet.solana.com
SIMULATE_TRANSACTIONS=false
MAX_PAYMENT_AMOUNT=1000000000

# Payment Server
SERVER_PORT=3000
FACILITATOR_URL=http://localhost:3001
MERCHANT_SOLANA_ADDRESS=<merchant_public_key>

# Solana
SOLANA_NETWORK=devnet
```

### Web (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_FACILITATOR_URL=http://localhost:3001
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

## Deployment

### Server

The server can be deployed using PM2 or any Node.js hosting platform:

```bash
cd server
npm run build
npm start  # Uses PM2
```

### Web

Deploy to Vercel, Netlify, or any static hosting:

```bash
cd web
npm run build
npm start  # Or deploy the .next folder
```

## Security

- **Private Keys**: Never commit `.env` or keypair files
- **HTTPS**: Use HTTPS in production for all HTTP communication
- **Rate Limiting**: Implement on facilitator endpoints
- **Input Validation**: All inputs validated with Zod schemas
- **Nonce Database**: Prevents replay attacks
- **Wallet Integration**: Users control their private keys

## Roadmap

- [ ] Complete web frontend implementation
- [ ] Add betting game logic
- [ ] Multi-player support
- [ ] Leaderboards and statistics
- [ ] Mobile app (React Native)
- [ ] Mainnet deployment
- [ ] Additional payment methods

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Follow existing code style (TypeScript, ES modules)
4. Write tests for new features
5. Run `npm run lint` and `npm run fmt`
6. Submit a pull request

## License

MIT License - see LICENSE file for details

## Credits

Built with:
- [Gill SDK](https://www.gillsdk.com/) - Solana TypeScript SDK
- [@solana/web3.js](https://github.com/solana-labs/solana-web3.js) - Solana JavaScript API
- [Express.js](https://expressjs.com/) - Backend framework
- [Next.js](https://nextjs.org/) - React framework
- [PM2](https://pm2.keymetrics.io/) - Process manager

## Support

For issues and questions:
- GitHub Issues: https://github.com/yourusername/betmonkey/issues
- Documentation: See `/server/README.md` and `/web/README.md`

## Acknowledgments

This project was built for the Solana Hackathon. Special thanks to the Solana and Gill SDK communities.
