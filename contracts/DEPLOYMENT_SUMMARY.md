# BetMonkey Token Deployment Summary

## Deployment Complete

### Token Details

**Network:** Solana Devnet
**Token Name:** BetMonkey
**Symbol:** BMONKEY
**Decimals:** 9
**Total Supply:** 1,000,000,000

**Token Mint Address:** `6wfhcne5ARYsuXTLQKQmrZJYuZfTngXur9QXw2YUsKfd`
**Token Account:** `AtxVEEzLNVi5g6vKcEBKUXimE39DtVQQiuWAP5EwwyXH`
**Wallet Address:** `bMEGWAQEeZ26t596yLPYcDRdjfsAamSo8pLf1pXN5rp`

### Transaction Links

- Token Creation: https://solscan.io/tx/9P75hBc5DUM1hnZd3CFbYH9tiemFoQzVY1KviDchkJtE9D6nzUfc6biTtu4k94gfNNmTNhp5TPp8Nu8dJpZq387?cluster=devnet
- View Token: https://solscan.io/token/6wfhcne5ARYsuXTLQKQmrZJYuZfTngXur9QXw2YUsKfd?cluster=devnet

## What Was Deployed

1. SPL Token Mint - BMONKEY token with 1 billion supply
2. Token Account - Your account holding all tokens
3. Wallet Configuration - Saved in .env for AI agent use

## AI Agent Status

The AI agent is ready to use. It will:
- Monitor casino profits (currently mocked)
- Use 60% of profits to buy BMONKEY tokens
- Execute buys through Jupiter aggregator
- Create constant buying pressure on the token

## Files Created

```
contracts/
├── .env                    # Configuration (includes wallet key)
├── .wallet.json           # Wallet keypair (BACKUP THIS!)
├── .token-info.json       # Token deployment info
├── token/
│   ├── wallet.ts
│   ├── get-devnet-sol.ts
│   ├── create-token.ts
│   └── create-pool.ts
└── ai-agent/
    ├── index.ts           # Main agent logic
    └── trader.ts          # Jupiter trading integration
```

## Current Status

- [x] Token created and deployed
- [x] Wallet configured in .env
- [x] AI agent code ready
- [ ] Liquidity pool (see notes below)

## Liquidity Pool Notes

For devnet:
- Most DEXs don't fully support devnet pools
- You can skip the pool and test the agent logic
- The agent code is ready - it will work once a pool exists

For mainnet:
1. Change `.env`: `SOLANA_NETWORK=mainnet-beta`
2. Get real SOL (~10+ SOL recommended)
3. Create pool on Raydium or Orca UI
4. Add liquidity (e.g., 5 SOL + 500M BMONKEY)
5. Agent will start buying automatically

## How to Test the AI Agent

```bash
bun run start-agent
```

The agent will:
- Check wallet balance every 5 minutes (configurable)
- Look for new casino profits
- Buy BMONKEY tokens with 60% of profits

## Integration with Casino

To connect with your casino backend, edit `ai-agent/index.ts`:

```typescript
async function checkCasinoProfits(): Promise<number> {
  // Replace with your casino API call
  const response = await fetch('http://localhost:3000/api/casino/profits');
  const data = await response.json();
  return data.newProfitsInSOL;
}
```

## Security Reminders

NEVER commit these files to git:
- `.env` (contains wallet private key)
- `.wallet.json` (wallet keypair)
- `.token-info.json` (deployment details)

These are already in `.gitignore` - verify before committing!

## Next Steps

1. Test the AI agent locally
2. Integrate with your casino backend
3. When ready for mainnet:
   - Update .env to mainnet
   - Get real SOL
   - Create liquidity pool
   - Deploy to production server
   - Monitor and adjust buy percentage as needed

## Configuration

All settings in `.env`:

```bash
SOLANA_NETWORK=devnet          # Change to mainnet-beta for production
BUY_PERCENTAGE=60              # % of profits to use for buying
MIN_BUY_AMOUNT=0.1            # Minimum SOL before executing buy
CHECK_INTERVAL=300             # Check every 5 minutes
```

## Support

If anything breaks:
1. Check your SOL balance
2. Verify token mint address
3. Ensure pool exists (for mainnet)
4. Check Jupiter API status

---

**Deployment Date:** 2025-11-10
**Network:** Devnet
**Status:** Ready for testing
