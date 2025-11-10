'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

interface TokenStats {
  currentPrice: number;
  marketCap: number;
  reserveRatio: number;
  circulatingSupply: number;
  priceChange24h?: number;
  volume24h: number;
  casinoReserves: number;
}

interface Quote {
  tokenAmount: number;
  solCost: number;
  pricePerToken: number;
  priceImpact: number;
}

export default function TokenPage() {
  const { publicKey } = useWallet();
  const [stats, setStats] = useState<TokenStats | null>(null);
  const [buyAmount, setBuyAmount] = useState('1');
  const [sellAmount, setSellAmount] = useState('1000000');
  const [buyQuote, setBuyQuote] = useState<Quote | null>(null);
  const [sellQuote, setSellQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

  // Load stats
  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, []);

  // Update quotes when amounts change
  useEffect(() => {
    if (buyAmount && parseFloat(buyAmount) > 0) {
      loadBuyQuote();
    }
  }, [buyAmount]);

  useEffect(() => {
    if (sellAmount && parseFloat(sellAmount) > 0) {
      loadSellQuote();
    }
  }, [sellAmount]);

  async function loadStats() {
    try {
      const res = await fetch(`${API_URL}/token/stats`);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }

  async function loadBuyQuote() {
    try {
      const res = await fetch(`${API_URL}/token/quote/buy?sol=${buyAmount}`);
      const data = await res.json();
      if (data.success) {
        setBuyQuote(data.quote);
      }
    } catch (error) {
      console.error('Failed to load buy quote:', error);
    }
  }

  async function loadSellQuote() {
    try {
      const res = await fetch(`${API_URL}/token/quote/sell?tokens=${sellAmount}`);
      const data = await res.json();
      if (data.success) {
        setSellQuote(data.quote);
      }
    } catch (error) {
      console.error('Failed to load sell quote:', error);
    }
  }

  async function handleBuy() {
    if (!publicKey) {
      setMessage('Connect your wallet first');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(`${API_URL}/token/buy-x402`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: buyAmount })
      });

      const data = await res.json();

      if (res.status === 402) {
        setMessage('Payment required. Please complete the x402 payment flow.');
        // x402 payment handling would go here
        return;
      }

      if (data.success) {
        setMessage(`Success! You received ${data.data.tokenAmount.toFixed(2)} BMONKEY`);
        loadStats();
        setBuyAmount('1');
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  const formatSOL = (num: number) => num.toFixed(4);
  const formatPrice = (num: number) => num.toFixed(8);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">BMONKEY Token</h1>
            <p className="text-gray-400">Dynamic pricing based on casino reserves</p>
          </div>
          <WalletMultiButton />
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-1">Current Price</div>
              <div className="text-2xl font-bold">{formatPrice(stats.currentPrice)} SOL</div>
              {stats.priceChange24h !== undefined && (
                <div className={`text-sm ${stats.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stats.priceChange24h >= 0 ? '+' : ''}{stats.priceChange24h.toFixed(2)}% (24h)
                </div>
              )}
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-1">Market Cap</div>
              <div className="text-2xl font-bold">{formatNumber(stats.marketCap)} SOL</div>
              <div className="text-sm text-gray-400">
                {formatNumber(stats.circulatingSupply)} tokens
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-1">Casino Reserves</div>
              <div className="text-2xl font-bold">{formatSOL(stats.casinoReserves)} SOL</div>
              <div className="text-sm text-gray-400">
                {(stats.reserveRatio * 100).toFixed(0)}% of target
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-1">24h Volume</div>
              <div className="text-2xl font-bold">{formatSOL(stats.volume24h)} SOL</div>
            </div>
          </div>
        )}

        {/* Trading Interface */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Buy Card */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Buy BMONKEY</h2>

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Amount (SOL)</label>
              <input
                type="number"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-3 text-white"
                placeholder="1.0"
                step="0.1"
                min="0.01"
              />
            </div>

            {buyQuote && (
              <div className="bg-gray-700 rounded-lg p-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">You get</span>
                  <span className="font-bold">{formatNumber(buyQuote.tokenAmount)} BMONKEY</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Price per token</span>
                  <span>{formatPrice(buyQuote.pricePerToken)} SOL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Price impact</span>
                  <span className={buyQuote.priceImpact > 5 ? 'text-red-400' : 'text-green-400'}>
                    {buyQuote.priceImpact.toFixed(2)}%
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleBuy}
              disabled={loading || !publicKey || !buyAmount || parseFloat(buyAmount) <= 0}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg py-3 font-bold transition"
            >
              {!publicKey ? 'Connect Wallet' : loading ? 'Processing...' : 'Buy Tokens'}
            </button>
          </div>

          {/* Sell Card */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Sell BMONKEY</h2>

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Amount (BMONKEY)</label>
              <input
                type="number"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-3 text-white"
                placeholder="1000000"
                step="100000"
                min="1"
              />
            </div>

            {sellQuote && (
              <div className="bg-gray-700 rounded-lg p-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">You get</span>
                  <span className="font-bold">{formatSOL(sellQuote.solCost)} SOL</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Price per token</span>
                  <span>{formatPrice(sellQuote.pricePerToken)} SOL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Price impact</span>
                  <span className={Math.abs(sellQuote.priceImpact) > 5 ? 'text-red-400' : 'text-green-400'}>
                    {sellQuote.priceImpact.toFixed(2)}%
                  </span>
                </div>
              </div>
            )}

            <button
              disabled={true}
              className="w-full bg-gray-600 rounded-lg py-3 font-bold cursor-not-allowed"
            >
              Coming Soon
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">Selling will be enabled soon</p>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mt-6 p-4 rounded-lg ${
            message.includes('Success') ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'
          }`}>
            {message}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">How It Works</h3>
          <div className="space-y-3 text-gray-300">
            <p>
              <strong>Dynamic Pricing:</strong> Token price increases as casino reserves grow.
              The more the casino wins, the more valuable BMONKEY becomes.
            </p>
            <p>
              <strong>Instant Liquidity:</strong> Buy or sell anytime at fair market prices.
              No DEX pools needed - prices are calculated using a bonding curve.
            </p>
            <p>
              <strong>Transparent:</strong> All pricing is deterministic and verifiable.
              Reserve ratio and price history available to everyone.
            </p>
            <p>
              <strong>x402 Payments:</strong> Purchases use the x402 protocol for secure,
              on-chain verified Solana payments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
