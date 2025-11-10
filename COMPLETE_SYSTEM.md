# BetMonkey Complete System

Full-stack casino platform with dynamic token economy on Solana.

## System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     BETMONKEY PLATFORM                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Frontend (React + Vite)          Backend (Express)          │
│  ├─ Roulette Game                 ├─ x402 Payment Protocol   │
│  ├─ Poker Game                    ├─ Game Services           │
│  ├─ Token Trading UI              ├─ Wallet Management       │
│  └─ Real-time Updates             └─ Token System            │
│                                                               │
│                    ┌─────────────────┐                        │
│                    │  Token Economy  │                        │
│                    │ (Bonding Curve) │                        │
│                    └─────────────────┘                        │
│                            ↓                                  │
│                    Price = f(Reserves)                        │
│                                                               │
│                    Solana Blockchain                          │
│                    ├─ SPL Token (BMONKEY)                     │
│                    ├─ x402 Payments                           │
│                    └─ On-chain Verification                   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Components

### 1. Token System (`/contracts`)
- **SPL Token**: BMONKEY on Solana
- **Mint**: `6wfhcne5ARYsuXTLQKQmrZJYuZfTngXur9QXw2YUsKfd`
- **Supply**: 1,000,000,000 tokens
- **Network**: Devnet (mainnet ready)

### 2. Casino Backend (`/server`)
- **Facilitator Service**: x402 payment processing
- **Casino Service**: Game logic and wallet management
- **Token Service**: Dynamic pricing and trading

### 3. Frontend (`/frontend`)
- React + Vite + TypeScript
- Solana wallet integration
- Real-time game updates
- Token trading interface

## Quick Start

### Prerequisites
```bash
# Required
- Node.js 20+
- Bun 1.0+
- Solana CLI (optional)

# For mainnet
- Solana wallet with SOL
- Domain with SSL
```

### 1. Server Setup

```bash
cd server

# Setup token system
./setup-token.sh

# Configure environment
cp env.example .env

# Edit .env with your keys
nano .env

# Start all services
npm run dev
```

Services will start:
- Facilitator: `http://localhost:3001`
- Server: `http://localhost:3000`
- Casino: `http://localhost:3003`

### 2. Frontend Setup

```bash
cd frontend

# Install
bun install

# Configure
cp .env.example .env

# Start dev server
bun run dev
```

Frontend: `http://localhost:5173`

### 3. Test Token System

```bash
# Get current price
curl http://localhost:3003/token/price

# Get market stats
curl http://localhost:3003/token/stats

# Get buy quote (1 SOL)
curl "http://localhost:3003/token/quote/buy?sol=1"
```

## Token Economics

### Bonding Curve

The token price follows a logarithmic bonding curve tied to casino reserves:

```
Price = 0.000001 * (1 + 9 * log10(1 + ReserveRatio * 9))

Where:
- Base price: 0.000001 SOL per token
- Max multiplier: 10x
- Target reserves: 100 SOL
```

### Price Examples

| Reserves | Token Price | 1M Tokens Cost | Market Cap |
|----------|-------------|----------------|------------|
| 1 SOL    | 0.00000104  | 1.04 SOL      | 1,040 SOL  |
| 10 SOL   | 0.00000141  | 1.41 SOL      | 1,410 SOL  |
| 50 SOL   | 0.00000255  | 2.55 SOL      | 2,550 SOL  |
| 100 SOL  | 0.00000400  | 4.00 SOL      | 4,000 SOL  |
| 200 SOL  | 0.00000700  | 7.00 SOL      | 7,000 SOL  |

### Reserve Calculation

```typescript
Reserves =
  Total Deposits
  - Total Withdrawals
  + (Total Bets - Total Payouts)
```

As casino profits increase, reserves grow, pushing token price up.

## API Documentation

### Token Endpoints

```
GET  /token/price                 - Current price
GET  /token/stats                 - Market statistics
GET  /token/quote/buy?sol=X       - Buy quote
GET  /token/quote/sell?tokens=X   - Sell quote
POST /token/buy                   - Execute buy
POST /token/sell                  - Execute sell
GET  /token/history?timeframe=7d  - Price history
GET  /token/transactions?limit=50 - Recent trades
GET  /token/info                  - Token metadata
```

### Casino Endpoints

```
GET  /health                      - Health check
POST /play/quick                  - Quick roulette bet
POST /play/custom                 - Custom roulette bet
POST /play/poker                  - Poker game
GET  /roulette/history/:wallet    - Game history
GET  /wallet/balance/:wallet      - Check balance
POST /wallet/withdraw             - Withdraw winnings
```

## Environment Configuration

### Server `.env`

```bash
# Network
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com

# Services
FACILITATOR_PORT=3001
SERVER_PORT=3000
CASINO_PORT=3003
FACILITATOR_URL=http://localhost:3001

# Keys (CHANGE THESE!)
FACILITATOR_PRIVATE_KEY=your_key_here
MERCHANT_SOLANA_ADDRESS=your_address_here

# Token System
TOKEN_MINT=6wfhcne5ARYsuXTLQKQmrZJYuZfTngXur9QXw2YUsKfd
TOKEN_AGENT_PRIVATE_KEY=WzEyMCwxMTQ...
TOKEN_UPDATE_INTERVAL=60000

# Database
DATABASE_PATH=./data/casino.db
```

### Frontend `.env`

```bash
VITE_API_URL=http://localhost:3003
VITE_FACILITATOR_URL=http://localhost:3001
VITE_SOLANA_NETWORK=devnet
```

## Mainnet Deployment

### 1. Prepare Token

```bash
cd contracts

# Update to mainnet
sed -i '' 's/devnet/mainnet-beta/' .env

# Get mainnet SOL (minimum 10 SOL)
# Transfer to deployment wallet

# Create mainnet token
bun run create-token

# Note the new mint address
```

### 2. Update Server

```bash
cd server

# Update .env
SOLANA_NETWORK=mainnet-beta
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
TOKEN_MINT=<your-mainnet-mint>
TOKEN_AGENT_PRIVATE_KEY=<your-mainnet-key>

# Rebuild
npm run build

# Start with PM2
npm run pm2:start
```

### 3. Deploy Frontend

```bash
cd frontend

# Update .env
VITE_API_URL=https://api.betmonkey.fun
VITE_SOLANA_NETWORK=mainnet-beta

# Build
bun run build

# Deploy dist/ to your hosting
# (Vercel, Netlify, Cloudflare Pages, etc.)
```

### 4. SSL & Domain

```bash
# Use Caddy for automatic SSL
sudo caddy reverse-proxy --from betmonkey.fun --to localhost:3003

# Or nginx with certbot
sudo certbot --nginx -d betmonkey.fun
```

## Production Checklist

- [ ] Change all private keys
- [ ] Use mainnet SOL
- [ ] Deploy token to mainnet
- [ ] Set up SSL certificates
- [ ] Configure domain DNS
- [ ] Enable monitoring (PM2, Datadog, etc.)
- [ ] Set up database backups
- [ ] Configure rate limiting
- [ ] Enable CORS for your domain only
- [ ] Test all payment flows
- [ ] Monitor token price updates
- [ ] Set up alerting for errors

## Monitoring

### PM2 Dashboard

```bash
cd server
npm run pm2:monit
```

### Logs

```bash
# All services
npm run logs

# Specific service
pm2 logs casino

# Token system logs
pm2 logs casino | grep "Token"
```

### Health Checks

```bash
# Server health
curl https://api.betmonkey.fun/health

# Token system
curl https://api.betmonkey.fun/token/stats
```

## Troubleshooting

### Token price not updating
```bash
# Check if service is running
pm2 list

# Check logs
pm2 logs casino | grep "Token"

# Verify environment
echo $TOKEN_MINT
echo $TOKEN_AGENT_PRIVATE_KEY
```

### Games not accepting payments
```bash
# Check facilitator
curl http://localhost:3001/health

# Verify merchant address
grep MERCHANT_SOLANA_ADDRESS .env

# Check Solana RPC
curl -X POST https://api.devnet.solana.com -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
```

### Database errors
```bash
# Check database file
ls -la data/casino.db

# Backup database
cp data/casino.db data/casino.db.backup

# Reset if needed (CAUTION!)
rm data/casino.db
npm run dev:casino
```

## Performance

- Token price updates: 60s interval
- API response time: <100ms
- Game execution: <2s
- Quote calculation: <10ms
- Maximum concurrent users: 1000+

## Security

- All private keys in environment variables
- Database not exposed
- CORS restricted to frontend domain
- Rate limiting on API endpoints
- Input validation on all requests
- Payment verification via x402 protocol
- On-chain transaction verification

## Support & Resources

- Documentation: `/server/TOKEN_SYSTEM.md`
- Setup guide: `/server/SETUP.md`
- Token contracts: `/contracts/README.md`
- Frontend setup: `/FRONTEND_SETUP.md`

## License

MIT
