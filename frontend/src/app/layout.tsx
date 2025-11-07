import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { WalletProvider } from '@/contexts/WalletContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BetMonkey Casino - Decentralized Roulette on Solana',
  description: 'Play decentralized roulette on Solana with the x402 payment protocol',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  )
}
