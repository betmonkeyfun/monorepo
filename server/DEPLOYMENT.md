# BetMonkey Deployment Guide - Fly.io

## 📋 Prerequisites

1. Install Fly.io CLI:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. Login to Fly.io:
   ```bash
   fly auth login
   ```

## 🚀 Quick Deploy

Run the automated deployment script:

```bash
./deploy-fly.sh
```

This script will:
- ✅ Create the Fly.io app (if it doesn't exist)
- ✅ Create persistent volume for SQLite database
- ✅ Set up all environment secrets
- ✅ Build and deploy the application

## 📝 Manual Deployment Steps

If you prefer manual deployment:

### 1. Create App
```bash
fly apps create betmonkey-server
```

### 2. Create Volume
```bash
fly volumes create betmonkey_data --size 1 --region iad
```

### 3. Set Secrets
```bash
./fly-secrets-setup.sh
```

### 4. Deploy
```bash
fly deploy
```

## 🔧 Configuration

### Current Setup

- **App Name**: `betmonkey-server`
- **Region**: `iad` (US East)
- **Memory**: 1GB
- **Storage**: 1GB persistent volume at `/data`
- **Ports**:
  - Casino: 8080 (public via Fly.io)
  - Facilitator: 3001 (internal)
  - API Server: 3000 (internal)

### Architecture

```
Internet → Fly.io (8080) → Casino Server (8080)
                         ↓
                    Facilitator (3001)
                         ↓
                    API Server (3000)
                         ↓
                    SQLite DB (/data/casino.db)
```

All 3 servers run simultaneously via PM2 inside a single container.

## 📊 Monitoring & Management

### View Logs
```bash
fly logs
fly logs -a betmonkey-server
```

### Check Status
```bash
fly status
```

### SSH into Container
```bash
fly ssh console
```

### Open App in Browser
```bash
fly open
```

### View Dashboard
```bash
fly dashboard
```

### Scale Resources
```bash
# Scale memory
fly scale memory 2048

# Scale VM count
fly scale count 2
```

## 🔒 Security Notes

- Private keys are stored as Fly.io secrets (encrypted)
- Database is persisted in a dedicated volume
- HTTPS is enforced by Fly.io
- Currently using Solana **devnet** - update secrets for mainnet

## 🌐 Accessing Your App

Your app will be available at:
```
https://betmonkey-server.fly.dev
```

### Endpoints

- `GET /health` - Health check
- `GET /` - Casino welcome/info
- `POST /play/quick` - Quick bet (requires x402 payment)
- `POST /play/custom` - Custom bet (requires x402 payment)
- `GET /roulette/history/:wallet` - Game history
- `GET /wallet/balance/:wallet` - Check balance

## 🐛 Troubleshooting

### App Won't Start
```bash
fly logs
```
Check for:
- Missing secrets
- Database initialization errors
- Port binding issues

### Database Issues
```bash
fly ssh console
ls -la /data/
```

### Reset Everything
```bash
fly apps destroy betmonkey-server
fly volumes delete betmonkey_data
./deploy-fly.sh
```

## 💾 Database Backups

### Manual Backup
```bash
fly ssh sftp get /data/casino.db ./backups/casino-$(date +%Y%m%d).db
```

### Restore Backup
```bash
fly ssh sftp shell
put ./backups/casino-20231109.db /data/casino.db
```

## 📈 Production Checklist

Before going to production:

- [ ] Update `SOLANA_NETWORK` to `mainnet-beta`
- [ ] Update `SOLANA_RPC_URL` to mainnet RPC
- [ ] Generate new facilitator keypair for production
- [ ] Set `SIMULATE_TRANSACTIONS` to `false`
- [ ] Configure proper monitoring/alerts
- [ ] Set up automated database backups
- [ ] Review and adjust payment amounts
- [ ] Enable auto-scaling if needed

## 🆘 Support

- Fly.io Docs: https://fly.io/docs/
- Fly.io Community: https://community.fly.io/
- BetMonkey Issues: [Your GitHub Issues URL]
