# BetMonkey Token - Solana SPL Token

This directory contains all the code for creating, deploying, and managing the BetMonkey SPL token on Solana.

## Structure

- `token/` - Token creation and deployment scripts
- `ai-agent/` - AI agent that buys the token with casino profits
- `config/` - Configuration files for devnet/mainnet

## Setup

```bash
# Install dependencies
bun install

# Get devnet SOL
npm run get-devnet-sol

# Create token
npm run create-token

# Deploy AI agent
npm run deploy-agent
```

## Development Flow

1. Test everything on devnet first
2. Once tested, switch to mainnet configuration
3. Deploy with real SOL
