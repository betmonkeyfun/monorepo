# 🎰 BetMonkey Frontend - Quick Setup Guide

## What Was Built

A spectacular 3D roulette casino frontend with:

### ✨ Features
- **3D Roulette Wheel** with realistic spinning animations (Three.js + react-three-fiber)
- **Coin Launch Animations** with GSAP for wins/losses
- **Reown AppKit Integration** for Solana wallet connection (Phantom, Solflare, etc.)
- **x402 Payment Protocol** integration with the casino backend
- **Responsive UI** with Tailwind CSS and gradient backgrounds
- **Real-time Stats** showing wins, losses, and total wagered

### 🎮 Betting Options
1. **Simple Bets** (0.001 SOL, pays 1:1)
   - Red/Black
   - Even/Odd
   - Low (1-18) / High (19-36)

2. **Special Green Bet** (0.01 SOL, pays 35:1)
   - Number 0 (green)

3. **Number Bets** (0.01 SOL, pays 35:1)
   - Any number from 1-36
   - Interactive number grid

## Quick Start

### 1. Make sure backend is running
```bash
cd server
npm start
```

### 2. Start the frontend
```bash
cd frontend
npm run dev
```

### 3. Open your browser
Visit http://localhost:3000

### 4. Connect wallet and play!
- Click "Connect Wallet"
- Select your Solana wallet
- Choose a bet
- Watch the spectacular 3D wheel spin!

## Configuration

The `.env.local` file is already configured with:
- Reown project ID (you can get your own from https://cloud.reown.com)
- Casino API URL (http://localhost:3003)
- Facilitator URL (http://localhost:3001)
- Merchant address (from your backend setup)

## File Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx           # Main roulette page
│   │   ├── layout.tsx         # App layout
│   │   └── globals.css        # Global styles
│   ├── components/roulette/
│   │   ├── RouletteWheel.tsx      # 3D wheel with Three.js
│   │   ├── BettingInterface.tsx   # Betting UI with number grid
│   │   └── CoinAnimation.tsx      # Win/loss animations
│   ├── contexts/
│   │   └── WalletContext.tsx  # Reown wallet setup
│   └── lib/
│       ├── solana.ts          # Solana connection config
│       └── x402.ts            # x402 payment protocol
└── package.json
```

## How It Works

1. **User connects wallet** via Reown AppKit
2. **User places bet** by clicking a bet button
3. **Frontend creates payment request** using x402 protocol:
   - Requests nonce from facilitator
   - Signs transaction with user's wallet
   - Sends payment to facilitator
   - Creates structured data and signs it
4. **Frontend sends bet to casino** with payment proof
5. **Casino processes bet** and returns result
6. **3D wheel spins** to the winning number
7. **Animations play** showing coins flying and win/loss message
8. **Balance updates** automatically

## Customization

### Change bet amounts
Edit `BettingInterface.tsx`:
```typescript
const SIMPLE_BETS = [
  { type: 'red', label: 'Red', color: 'bg-red-600', amount: '0.001' },
  // Change amount here ↑
];
```

### Modify wheel colors
Edit `RouletteWheel.tsx`:
```typescript
const color = slot.color === 'red' ? '#DC2626' :
             slot.color === 'black' ? '#171717' :
             '#059669'; // Green color
```

### Adjust animations
Edit `CoinAnimation.tsx` to change:
- Coin count
- Animation duration
- Particle effects

## Troubleshooting

### Build errors
```bash
rm -rf .next node_modules
npm install
npm run build
```

### Wallet not connecting
- Make sure you have a Solana wallet extension installed
- Try refreshing the page
- Check browser console for errors

### "Failed to place bet"
- Ensure backend services are running (npm start in server/)
- Check that you have SOL in your wallet
- Verify merchant address in .env.local matches backend

### 3D wheel not showing
- Make sure Three.js loaded (check browser console)
- Try disabling hardware acceleration in browser
- Update your graphics drivers

## Next Steps

1. **Get a Reown Project ID**: Visit https://cloud.reown.com to get your own project ID
2. **Customize Design**: Change colors, fonts, and animations to match your brand
3. **Add More Games**: Use this as a template to add other casino games
4. **Deploy**: Build and deploy to Vercel, Netlify, or your preferred hosting

## Tech Stack

- Next.js 15
- React 18
- Three.js & react-three-fiber
- GSAP (animations)
- Reown AppKit (wallet)
- Solana Web3.js
- Tailwind CSS
- TypeScript

---

**Enjoy your spectacular 10/10 roulette! 🎰🚀**
