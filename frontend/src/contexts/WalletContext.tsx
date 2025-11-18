'use client';

import { createAppKit } from '@reown/appkit/react';
import { SolanaAdapter } from '@reown/appkit-adapter-solana/react';
import { solana } from '@reown/appkit/networks';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import React from 'react';

// 0. Set up Solana Adapter
const solanaWeb3JsAdapter = new SolanaAdapter({
  wallets: [new PhantomWalletAdapter(), new SolflareWalletAdapter()]
});

// 1. Get projectId from https://cloud.reown.com
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '8708d7b08eb7f91098ea3aeb1c9561ac';

// 2. Create a metadata object - optional
const metadata = {
  name: 'BetMonkey Casino',
  description: 'Decentralized Roulette on Solana',
  url: 'https://betmonkey.fun',
  icons: ['https://avatars.githubusercontent.com/u/179229932']
};

// 3. Create modal
const modal = createAppKit({
  adapters: [solanaWeb3JsAdapter],
  networks: [solana],
  metadata,
  projectId,
  features: {
    analytics: true,
  }
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export { modal };
