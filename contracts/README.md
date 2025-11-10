# BetMonkey Token System

A Solana-based token with automated market-making capabilities designed to integrate with casino platforms. The system automatically converts a portion of platform revenue into token buybacks, creating organic price support.

## Overview

This implementation provides a complete token economy for the BetMonkey platform:

- **SPL Token**: Standard Solana token with configurable supply
- **Automated Buyback**: Programmatic purchases using platform revenue
- **DEX Integration**: Direct integration with Jupiter aggregator for optimal pricing
- **Multi-network**: Supports both devnet (testing) and mainnet deployments

## Architecture

```
Platform Revenue (SOL) → Agent Monitoring → Jupiter Swap → Token Buyback → Price Support
```

The agent runs independently, monitoring configured revenue sources and executing purchases based on predefined parameters. All transactions are on-chain and verifiable.

## Prerequisites

- Bun runtime (v1.0+)
- Solana wallet with SOL for transactions
- Basic understanding of Solana token mechanics

## Installation

```bash
bun install
```

## Configuration

Copy the environment template and configure:

```bash
cp .env.example .env
```

Key configuration parameters:

```bash
# Network selection
SOLANA_NETWORK=devnet

# Token parameters
TOKEN_NAME=BetMonkey
TOKEN_SYMBOL=BMONKEY
TOKEN_DECIMALS=9
TOTAL_SUPPLY=1000000000

# Agent behavior
BUY_PERCENTAGE=60           # Percentage of revenue to convert
MIN_BUY_AMOUNT=0.1         # Minimum SOL threshold for transactions
CHECK_INTERVAL=300          # Monitoring interval in seconds
```

## Initial Deployment

### 1. Acquire SOL

For devnet testing:
```bash
bun run get-devnet-sol
```

For mainnet, transfer SOL to your deployment wallet.

### 2. Deploy Token

```bash
bun run create-token
```

This creates the token mint, associated token account, and mints the initial supply. Transaction details are saved to `.token-info.json`.

### 3. Create Liquidity Pool

Creating a liquidity pool requires manual setup through a DEX interface:

```bash
bun run create-pool
```

This displays the required information for pool creation. For production deployments:

1. Navigate to Raydium or Orca
2. Connect your deployment wallet
3. Import token using the mint address from `.token-info.json`
4. Add initial liquidity (recommended: minimum 10 SOL equivalent)

Note: Devnet pools have limited functionality. Test agent logic without a pool, then deploy to mainnet for full functionality.

## Running the Agent

Start the automated buyback agent:

```bash
bun run start-agent
```

The agent will:
- Monitor configured revenue sources
- Execute purchases when thresholds are met
- Log all transactions with on-chain links

### Integration with Revenue Sources

Modify `ai-agent/index.ts` to connect with your platform:

```typescript
async function checkCasinoProfits(): Promise<number> {
  // Replace with actual backend integration
  const response = await fetch('https://your-api.com/revenue');
  const data = await response.json();

  // Return new SOL available for conversion
  return data.availableSOL;
}
```

The function should return only new, unprocessed revenue to avoid double-processing.

## Project Structure

```
contracts/
├── token/
│   ├── wallet.ts              # Keypair management
│   ├── get-devnet-sol.ts      # Devnet faucet utility
│   ├── create-token.ts        # Token deployment
│   └── create-pool.ts         # Pool creation guide
├── ai-agent/
│   ├── index.ts               # Agent orchestration
│   └── trader.ts              # Jupiter integration
├── config/
│   └── network.ts             # Network configuration
├── .env                       # Environment variables (not committed)
├── .wallet.json              # Keypair storage (not committed)
└── .token-info.json          # Deployment metadata (not committed)
```

## Security Considerations

### Keypair Management

The deployment wallet keypair is stored in two locations:
- `.wallet.json`: Full keypair for agent use
- `.env`: Base64-encoded for environment variable access

Both files are excluded from version control. For production:

1. Use secure key management (HSM, cloud KMS)
2. Implement rotation policies
3. Monitor wallet for unauthorized transactions
4. Keep backup in secure offline storage

### Agent Security

The agent operates with direct wallet access. Implement these safeguards:

- Set reasonable `MIN_BUY_AMOUNT` to prevent micro-transactions
- Monitor agent logs for anomalies
- Implement transaction limits in production
- Use separate wallets for different environments

## Monitoring

The agent logs all activity to stdout. Key events:

- Revenue detection
- Transaction initiation
- Swap execution
- Confirmation status

For production, pipe logs to your monitoring system:

```bash
bun run start-agent | tee -a agent.log
```

## Mainnet Deployment

When ready for production:

1. Update configuration:
   ```bash
   SOLANA_NETWORK=mainnet-beta
   ```

2. Fund wallet with operational SOL (50-100 SOL recommended)

3. Deploy token using mainnet configuration

4. Create production liquidity pool with substantial depth

5. Deploy agent to production infrastructure

6. Monitor initial operation closely

## Troubleshooting

### "Insufficient balance" error
Wallet needs more SOL for transaction fees. Add funds and retry.

### "Failed to get quote from Jupiter"
Either no liquidity pool exists, or the pool has insufficient depth. Verify pool creation and liquidity.

### "Transaction timeout"
Network congestion. The agent will retry on next interval.

### Agent not buying despite revenue
Check:
- Revenue amount exceeds `MIN_BUY_AMOUNT`
- Wallet has sufficient SOL for gas
- Pool has adequate liquidity
- Network connectivity

## Performance Tuning

Adjust these parameters based on your needs:

- **CHECK_INTERVAL**: Lower for more responsive buying, higher for reduced RPC load
- **BUY_PERCENTAGE**: Balance between buyback pressure and operational reserves
- **MIN_BUY_AMOUNT**: Prevent excessive small transactions

Monitor slippage and adjust liquidity or purchase sizes accordingly.

## Development

Running in development mode:

```bash
# Watch mode for agent changes
bun --watch ai-agent/index.ts

# Test with mock data
# Modify checkCasinoProfits() to return test values
```

## License

See LICENSE file for details.

## Support

For technical issues, review logs and verify:
- Network configuration
- Wallet balance
- Pool liquidity
- API connectivity

Transaction IDs are logged for all operations and can be viewed on Solscan or similar explorers.
