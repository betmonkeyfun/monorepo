'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppKitAccount } from '@reown/appkit/react';
import { modal } from '@/contexts/WalletContext';
import { getWalletBalance } from '@/lib/x402';

export default function HomePage() {
  const router = useRouter();
  const { address, isConnected } = useAppKitAccount();
  const [balance, setBalance] = useState<string>('0');

  // Load player balance
  useEffect(() => {
    if (address && isConnected) {
      loadBalance();
    }
  }, [address, isConnected]);

  const loadBalance = async () => {
    if (!address) return;

    try {
      const balanceData = await getWalletBalance(address);
      setBalance(balanceData.balance || '0');
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  const handleRouletteClick = () => {
    router.push('/roulette');
  };

  return (
    <main className="min-h-screen relative">
      {/* Background pattern */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-black bg-[linear-gradient(to_right,#4a0000_1px,transparent_1px),linear-gradient(to_bottom,#4a0000_1px,transparent_1px)] bg-[size:6rem_4rem]"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-red-900/30 bg-black/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-3xl font-black bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 bg-clip-text text-transparent tracking-wider">
            BETMONKEY CASINO
          </h1>

          <div className="flex items-center gap-3">
            {isConnected ? (
              <>
                <div className="flex items-center gap-2 text-yellow-400 font-bold text-sm">
                  <span className="text-gray-400">Balance:</span>
                  <span>{balance} SOL</span>
                </div>
                <appkit-button />
              </>
            ) : (
              <button
                onClick={() => modal.open()}
                className="bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold py-2 px-6 rounded-lg transition-all"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>

      {!isConnected ? (
        <div className="container mx-auto px-4 py-32 text-center">
          <h2 className="text-6xl font-black mb-6 bg-gradient-to-r from-red-500 via-yellow-400 to-red-500 bg-clip-text text-transparent">
            WELCOME TO BETMONKEY
          </h2>
          <p className="text-gray-300 text-xl mb-12 max-w-2xl mx-auto">
            Connect your wallet to start playing provably fair casino games on Solana
          </p>
          <button
            onClick={() => modal.open()}
            className="bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold py-5 px-12 rounded-xl text-xl transition-all transform hover:scale-105 shadow-2xl"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black mb-4 text-white">
              CHOOSE YOUR GAME
            </h2>
            <p className="text-gray-400 text-lg">
              Select a game to start playing
            </p>
          </div>

          {/* Game Cards Grid */}
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {/* Roulette Card */}
              <div className="group relative" style={{ perspective: '2000px', transformStyle: 'preserve-3d' }}>
                {/* Glow behind card */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/30 via-orange-500/20 to-pink-500/30 blur-3xl scale-110 opacity-50 group-hover:opacity-70 transition-opacity duration-300" style={{ transform: 'translateZ(-50px)' }} />

                {/* Gradient border wrapper */}
                <div
                  className="card-gradient-red relative transition-all duration-500 hover:-translate-y-8 hover:scale-110 cursor-pointer group-hover:shadow-2xl"
                  style={{
                    borderRadius: '20px',
                    padding: '3px',
                    boxShadow: `
                      6px 6px 0 rgba(255, 107, 0, 0.8),
                      8px 8px 0 rgba(255, 107, 0, 0.7),
                      10px 10px 0 rgba(255, 165, 0, 0.6),
                      12px 12px 0 rgba(255, 165, 0, 0.5),
                      14px 14px 0 rgba(255, 107, 0, 0.4),
                      16px 16px 0 rgba(255, 0, 0, 0.4),
                      18px 18px 0 rgba(255, 0, 0, 0.3),
                      20px 20px 0 rgba(200, 0, 0, 0.3),
                      0 40px 80px rgba(0, 0, 0, 0.9)
                    `,
                    transform: 'translateZ(60px)',
                    transformStyle: 'preserve-3d'
                  }}
                >
                  {/* Inner card content */}
                  <div
                    className="flex flex-col overflow-hidden"
                    style={{
                      minHeight: '400px',
                      borderRadius: '18px',
                      background: 'linear-gradient(135deg, #1a0000 0%, #2d0000 50%, #1a0000 100%)'
                    }}
                  >
                    {/* Content */}
                    <div className="p-8 flex flex-col flex-1 justify-center">
                      <h3 className="text-4xl font-bold text-red-500 mb-4 tracking-wider">
                        ROULETTE
                      </h3>
                      <p className="text-gray-300 text-base leading-relaxed mb-8 flex-1">
                        Classic casino game with 36 numbers. Bet on red, black, odds, evens, or specific numbers for big wins.
                      </p>

                      {/* Play Button */}
                      <button
                        onClick={handleRouletteClick}
                        className="w-full py-4 bg-gradient-to-r from-red-600 via-orange-600 to-red-600 hover:from-red-500 hover:via-orange-500 hover:to-red-500 text-white font-bold text-xl tracking-wider transition-all duration-300 rounded-lg"
                      >
                        PLAY NOW
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Blackjack Card */}
              <div className="group relative" style={{ perspective: '2000px', transformStyle: 'preserve-3d' }}>
                {/* Glow behind card */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-cyan-500/20 to-teal-500/30 blur-3xl scale-110 opacity-50 group-hover:opacity-70 transition-opacity duration-300" style={{ transform: 'translateZ(-50px)' }} />

                <div
                  className="card-gradient-blue relative transition-all duration-500 hover:-translate-y-8 hover:scale-110 cursor-pointer group-hover:shadow-2xl opacity-60"
                  style={{
                    borderRadius: '20px',
                    padding: '3px',
                    boxShadow: `
                      6px 6px 0 rgba(0, 153, 255, 0.5),
                      8px 8px 0 rgba(0, 153, 255, 0.4),
                      10px 10px 0 rgba(51, 102, 255, 0.3),
                      0 40px 80px rgba(0, 0, 0, 0.9)
                    `,
                    transform: 'translateZ(60px)',
                    transformStyle: 'preserve-3d',
                    pointerEvents: 'none'
                  }}
                >
                  <div
                    className="flex flex-col overflow-hidden"
                    style={{
                      minHeight: '400px',
                      borderRadius: '18px',
                      background: 'linear-gradient(135deg, #001a2d 0%, #002d4a 50%, #001a2d 100%)'
                    }}
                  >
                    {/* Content */}
                    <div className="p-8 flex flex-col flex-1 justify-center">
                      <h3 className="text-4xl font-bold text-blue-400 mb-4 tracking-wider">
                        BLACKJACK
                      </h3>
                      <p className="text-gray-300 text-base leading-relaxed mb-8 flex-1">
                        Beat the dealer to 21. Strategy meets luck in this timeless card game classic. Coming soon!
                      </p>

                      {/* Play Button */}
                      <button
                        disabled
                        className="w-full py-4 bg-gray-700 text-gray-400 font-bold text-xl tracking-wider cursor-not-allowed rounded-lg"
                      >
                        COMING SOON
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slots Card */}
              <div className="group relative" style={{ perspective: '2000px', transformStyle: 'preserve-3d' }}>
                {/* Glow behind card */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 via-pink-500/20 to-red-500/30 blur-3xl scale-110 opacity-50 group-hover:opacity-70 transition-opacity duration-300" style={{ transform: 'translateZ(-50px)' }} />

                <div
                  className="card-gradient-purple relative transition-all duration-500 hover:-translate-y-8 hover:scale-110 cursor-pointer group-hover:shadow-2xl opacity-60"
                  style={{
                    borderRadius: '20px',
                    padding: '3px',
                    boxShadow: `
                      6px 6px 0 rgba(153, 0, 255, 0.5),
                      8px 8px 0 rgba(153, 0, 255, 0.4),
                      10px 10px 0 rgba(204, 51, 255, 0.3),
                      0 40px 80px rgba(0, 0, 0, 0.9)
                    `,
                    transform: 'translateZ(60px)',
                    transformStyle: 'preserve-3d',
                    pointerEvents: 'none'
                  }}
                >
                  <div
                    className="flex flex-col overflow-hidden"
                    style={{
                      minHeight: '400px',
                      borderRadius: '18px',
                      background: 'linear-gradient(135deg, #1a002d 0%, #2d004a 50%, #1a002d 100%)'
                    }}
                  >
                    {/* Content */}
                    <div className="p-8 flex flex-col flex-1 justify-center">
                      <h3 className="text-4xl font-bold text-purple-400 mb-4 tracking-wider">
                        SLOTS
                      </h3>
                      <p className="text-gray-300 text-base leading-relaxed mb-8 flex-1">
                        Spin to win! Match symbols across paylines for massive jackpots. Coming soon!
                      </p>

                      {/* Play Button */}
                      <button
                        disabled
                        className="w-full py-4 bg-gray-700 text-gray-400 font-bold text-xl tracking-wider cursor-not-allowed rounded-lg"
                      >
                        COMING SOON
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
