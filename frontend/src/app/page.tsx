'use client';

import { useState, useEffect } from 'react';
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { Transaction } from '@solana/web3.js';
import dynamic from 'next/dynamic';
import { modal } from '@/contexts/WalletContext';
import {
  createPaymentRequest,
  placeBet,
  placeCustomBet,
  getPlayerStats,
  getWalletBalance,
} from '@/lib/x402';
import BettingInterface from '@/components/roulette/BettingInterface';
import CoinAnimation, { WinningAnimation, LosingAnimation } from '@/components/roulette/CoinAnimation';

// Dynamic import for RouletteWheel to avoid SSR issues with Three.js
const RouletteWheel = dynamic(() => import('@/components/roulette/RouletteWheel'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] rounded-2xl bg-gray-900 flex items-center justify-center">
      <div className="text-white text-xl">Loading 3D Roulette...</div>
    </div>
  ),
});

export default function Home() {
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('solana') as any;

  const [isSpinning, setIsSpinning] = useState(false);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [stats, setStats] = useState<any>(null);
  const [gameResult, setGameResult] = useState<any>(null);
  const [showAnimation, setShowAnimation] = useState(false);

  // Load player data
  useEffect(() => {
    if (address && isConnected) {
      loadPlayerData();
    }
  }, [address, isConnected]);

  const loadPlayerData = async () => {
    if (!address) return;

    try {
      const [balanceData, statsData] = await Promise.all([
        getWalletBalance(address),
        getPlayerStats(address),
      ]);

      setBalance(balanceData.balance || '0');
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load player data:', error);
    }
  };

  const handlePlaceBet = async (betType: string, amount: string) => {
    if (!address || !isConnected || !walletProvider) {
      modal.open();
      return;
    }

    setIsSpinning(true);
    setShowAnimation(false);
    setGameResult(null);

    try {
      // Convert amount to lamports
      const amountLamports = (parseFloat(amount) * 1e9).toString();

      // Create payment request using x402 protocol
      const paymentRequest = await createPaymentRequest(
        { toBase58: () => address } as any,
        async (message: Uint8Array) => {
          // Sign message using wallet
          const result = await walletProvider.signMessage(message);
          return result.signature;
        },
        async (transaction: Transaction) => {
          // Send transaction using wallet
          const result = await walletProvider.sendTransaction(transaction, {
            skipPreflight: false,
          });
          return result;
        },
        amountLamports,
        `roulette-${betType}-${Date.now()}`
      );

      // Place bet
      const result = await placeBet(paymentRequest, betType);

      // Set winning number and show result
      setWinningNumber(result.game.winningNumber);
      setGameResult(result);

      // Refresh balance
      await loadPlayerData();
    } catch (error: any) {
      console.error('Bet failed:', error);
      alert(`Bet failed: ${error.message}`);
      setIsSpinning(false);
    }
  };

  const handlePlaceNumberBet = async (number: number, amount: string) => {
    if (!address || !isConnected || !walletProvider) {
      modal.open();
      return;
    }

    setIsSpinning(true);
    setShowAnimation(false);
    setGameResult(null);

    try {
      // Convert amount to lamports
      const amountLamports = (parseFloat(amount) * 1e9).toString();

      // Create payment request
      const paymentRequest = await createPaymentRequest(
        { toBase58: () => address } as any,
        async (message: Uint8Array) => {
          const result = await walletProvider.signMessage(message);
          return result.signature;
        },
        async (transaction: Transaction) => {
          const result = await walletProvider.sendTransaction(transaction, {
            skipPreflight: false,
          });
          return result;
        },
        amountLamports,
        `roulette-number-${number}-${Date.now()}`
      );

      // Place custom bet
      const result = await placeCustomBet(paymentRequest, [
        {
          type: 'straight',
          numbers: [number],
          amount,
        },
      ]);

      // Set winning number and show result
      setWinningNumber(result.game.winningNumber);
      setGameResult(result);

      // Refresh balance
      await loadPlayerData();
    } catch (error: any) {
      console.error('Bet failed:', error);
      alert(`Bet failed: ${error.message}`);
      setIsSpinning(false);
    }
  };

  const handleSpinComplete = () => {
    setIsSpinning(false);
    setShowAnimation(true);
  };

  const handleAnimationComplete = () => {
    setShowAnimation(false);
    setWinningNumber(null);
    setGameResult(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-4xl">🎰</div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">
                BetMonkey Casino
              </h1>
              <p className="text-sm text-gray-400">Decentralized Roulette on Solana</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {stats && (
              <div className="hidden md:flex items-center space-x-4 text-sm">
                <div className="text-green-400">
                  Wins: {stats.totalWins || 0}
                </div>
                <div className="text-red-400">
                  Losses: {stats.totalLosses || 0}
                </div>
                <div className="text-yellow-400">
                  Total Wagered: {stats.totalWagered || '0'} SOL
                </div>
              </div>
            )}

            <appkit-button />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 space-y-8">
        {!isConnected ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-6">🎲</div>
            <h2 className="text-3xl font-bold mb-4">Welcome to BetMonkey Casino</h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Connect your Solana wallet to start playing decentralized roulette.
              All bets are secured by blockchain and the x402 payment protocol.
            </p>
            <button
              onClick={() => modal.open()}
              className="bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-xl"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <>
            {/* Roulette Wheel */}
            <div className="flex justify-center">
              <div className="w-full max-w-4xl">
                <RouletteWheel
                  isSpinning={isSpinning}
                  winningNumber={winningNumber}
                  onSpinComplete={handleSpinComplete}
                />

                {/* Winning Number Display */}
                {winningNumber !== null && !isSpinning && (
                  <div className="mt-6 text-center">
                    <div className="inline-block bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-xl px-8 py-4 shadow-2xl">
                      <div className="text-sm text-yellow-100 font-medium">Winning Number</div>
                      <div className="text-5xl font-bold text-white mt-1">{winningNumber}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Betting Interface */}
            <BettingInterface
              onPlaceBet={handlePlaceBet}
              onPlaceNumberBet={handlePlaceNumberBet}
              isSpinning={isSpinning}
              balance={balance}
            />

            {/* How to Play */}
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700 max-w-4xl mx-auto">
              <h3 className="text-xl font-bold mb-4">🎮 How to Play</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Choose your bet type: simple bets (red/black), special green (0), or specific numbers</li>
                <li>• Simple bets cost 0.001 SOL and pay 1:1 on win</li>
                <li>• Number bets (including green/0) cost 0.01 SOL and pay 35:1 on win</li>
                <li>• Your wallet will sign a transaction to place the bet using the x402 protocol</li>
                <li>• Watch the wheel spin and see if you win!</li>
                <li>• All winnings are automatically credited to your casino balance</li>
              </ul>
            </div>
          </>
        )}
      </div>

      {/* Animations */}
      {showAnimation && gameResult && (
        <>
          {gameResult.game.totalWinAmount > 0 ? (
            <>
              <CoinAnimation
                count={15}
                isWin={true}
                amount={gameResult.game.totalWinAmount}
                onComplete={handleAnimationComplete}
              />
              <WinningAnimation
                amount={gameResult.game.totalWinAmount}
                onComplete={() => {}}
              />
            </>
          ) : (
            <LosingAnimation onComplete={handleAnimationComplete} />
          )}
        </>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900/50 backdrop-blur-sm mt-20">
        <div className="container mx-auto px-4 py-6 text-center text-gray-400 text-sm">
          <p>
            Built with ❤️ on Solana • Powered by x402 Protocol • BetMonkey Casino
          </p>
        </div>
      </footer>
    </main>
  );
}
