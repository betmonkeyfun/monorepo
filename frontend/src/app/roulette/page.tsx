'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { PublicKey } from '@solana/web3.js';
import dynamic from 'next/dynamic';
import { modal } from '@/contexts/WalletContext';
import { getPlayerStats, getWalletBalance, createPaymentRequest, withdrawBalance, placeBetWithBalance, placeCustomBetWithBalance } from '@/lib/x402';
import NumberPicker from '@/components/roulette/NumberPicker';
import QuickBets from '@/components/roulette/QuickBets';
import CoinAnimation, { WinningAnimation, LosingAnimation } from '@/components/roulette/CoinAnimation';
import WithdrawModal from '@/components/casino/WithdrawModal';

// Use simple 2D roulette (more stable than 3D)
const RouletteWheel = dynamic(() => import('@/components/roulette/SimpleRouletteWheel'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] rounded-2xl bg-gray-900 flex items-center justify-center">
      <div className="text-white text-xl">Loading Roulette...</div>
    </div>
  ),
});

export default function RoulettePage() {
  const router = useRouter();
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('solana') as any;

  const [isSpinning, setIsSpinning] = useState(false);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [stats, setStats] = useState<any>(null);
  const [gameResult, setGameResult] = useState<any>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [useBalance, setUseBalance] = useState(false);

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

  const handlePlaceBet = async (betType: string, amount: string, useBalance: boolean) => {
    if (!address || !isConnected) {
      modal.open();
      return;
    }

    setIsSpinning(true);
    setShowAnimation(false);
    setGameResult(null);

    try {
      // If using casino balance, use the balance-based endpoint (no signature required)
      if (useBalance) {
        const result = await placeBetWithBalance(address, betType);

        setWinningNumber(result.data.result);
        setGameResult({
          game: {
            winningNumber: result.data.result,
            totalWinAmount: result.data.won ? result.data.profit : '0',
          },
        });

        // Refresh balance
        await loadPlayerData();
        return;
      }

      // Otherwise, create new payment transaction
      if (!walletProvider) {
        modal.open();
        return;
      }

      // Convert amount to lamports (0.001 SOL = 1000000 lamports)
      const amountLamports = (parseFloat(amount) * 1e9).toString();

      // Create payment request with wallet signatures
      const paymentRequest = await createPaymentRequest(
        new PublicKey(address),
        // Transaction signing function
        async (transaction: any) => {
          if (!walletProvider.signTransaction) {
            throw new Error('Wallet does not support transaction signing');
          }
          return await walletProvider.signTransaction(transaction);
        },
        // Message signing function
        async (message: Uint8Array) => {
          const result = await walletProvider.signMessage(message);
          if (result instanceof Uint8Array) return result;
          if (result.signature instanceof Uint8Array) return result.signature;
          return new Uint8Array(result.signature || result);
        },
        amountLamports,
        '/play/quick'
      );

      // Get numbers for the bet type
      const getBetNumbers = (type: string): number[] => {
        const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
        const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

        switch (type) {
          case 'red': return RED_NUMBERS;
          case 'black': return BLACK_NUMBERS;
          case 'even': return Array.from({ length: 18 }, (_, i) => (i + 1) * 2);
          case 'odd': return Array.from({ length: 18 }, (_, i) => i * 2 + 1);
          case 'low': return Array.from({ length: 18 }, (_, i) => i + 1);
          case 'high': return Array.from({ length: 18 }, (_, i) => i + 19);
          default: return [];
        }
      };

      const numbers = getBetNumbers(betType);

      // Send request with payment in X-PAYMENT header
      const CASINO_API_URL = process.env.NEXT_PUBLIC_CASINO_API_URL || 'http://localhost:3003';
      const response = await fetch(`${CASINO_API_URL}/play/quick`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-PAYMENT': JSON.stringify(paymentRequest),
        },
        body: JSON.stringify({
          type: betType,
          numbers, // Include numbers for validation
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Bet failed');
      }

      const result = await response.json();

      // Backend returns: { success, data: { result, won, profit, message } }
      setWinningNumber(result.data.result);
      setGameResult({
        game: {
          winningNumber: result.data.result,
          totalWinAmount: result.data.won ? result.data.profit : '0',
        },
      });

      // Refresh balance
      await loadPlayerData();
    } catch (error: any) {
      console.error('Bet failed:', error);
      alert(`Bet failed: ${error.message}`);
      setIsSpinning(false);
    }
  };

  const handlePlaceMultiNumberBet = async (numbers: number[], amount: string, useBalance: boolean) => {
    if (!address || !isConnected) {
      modal.open();
      return;
    }

    setIsSpinning(true);
    setShowAnimation(false);
    setGameResult(null);

    try {
      // Create bets array - one bet per number
      const bets = numbers.map(number => ({
        type: 'straight',
        numbers: [number],
        amount: amount,
      }));

      // If using casino balance, use the balance-based endpoint (no signature required)
      if (useBalance) {
        const result = await placeCustomBetWithBalance(address, bets);

        setWinningNumber(result.data.result);
        setGameResult({
          game: {
            winningNumber: result.data.result,
            totalWinAmount: result.data.totalWin,
          },
        });

        // Refresh balance
        await loadPlayerData();
        return;
      }

      // Otherwise, create new payment transaction
      if (!walletProvider) {
        modal.open();
        return;
      }

      // Calculate total cost (each number costs the amount)
      const totalCost = numbers.length * parseFloat(amount);
      const amountLamports = (totalCost * 1e9).toString();

      // Create payment request with wallet signatures
      const paymentRequest = await createPaymentRequest(
        new PublicKey(address),
        // Transaction signing function
        async (transaction: any) => {
          if (!walletProvider.signTransaction) {
            throw new Error('Wallet does not support transaction signing');
          }
          return await walletProvider.signTransaction(transaction);
        },
        // Message signing function
        async (message: Uint8Array) => {
          const result = await walletProvider.signMessage(message);
          if (result instanceof Uint8Array) return result;
          if (result.signature instanceof Uint8Array) return result.signature;
          return new Uint8Array(result.signature || result);
        },
        amountLamports,
        '/play/custom'
      );

      // Send request with payment in X-PAYMENT header
      const CASINO_API_URL = process.env.NEXT_PUBLIC_CASINO_API_URL || 'http://localhost:3003';
      const response = await fetch(`${CASINO_API_URL}/play/custom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-PAYMENT': JSON.stringify(paymentRequest),
        },
        body: JSON.stringify({
          bets,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Bet failed');
      }

      const result = await response.json();

      // Backend returns: { success, data: { result, won, totalWin, totalBet, profit, message } }
      setWinningNumber(result.data.result);
      setGameResult({
        game: {
          winningNumber: result.data.result,
          totalWinAmount: result.data.totalWin,
        },
      });

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

  const handleWithdraw = () => {
    if (!address) return;
    setShowWithdrawModal(true);
  };

  const handleWithdrawSubmit = async (amount: string) => {
    if (!address) return;

    try {
      await withdrawBalance(address, amount);
      await loadPlayerData();
    } catch (error: any) {
      throw error; // Modal will handle error display
    }
  };

  return (
    <main className="min-h-screen text-white relative">
      {/* Background pattern */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-black bg-[linear-gradient(to_right,#4a0000_1px,transparent_1px),linear-gradient(to_bottom,#4a0000_1px,transparent_1px)] bg-[size:6rem_4rem]"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-red-900/30 bg-black/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/home')}
            className="group flex items-center gap-3 bg-gradient-to-r from-red-600/10 to-yellow-600/10 hover:from-red-600/20 hover:to-yellow-600/20 border border-yellow-500/30 hover:border-yellow-500/50 rounded-lg px-5 py-2.5 transition-all"
          >
            <svg className="w-5 h-5 text-yellow-400 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-white font-bold text-base">All Games</span>
          </button>

          <div className="flex items-center gap-3">
            {isConnected ? (
              <>
                <div className="hidden md:flex items-center gap-4">
                  {/* Payment Source Selector */}
                  <select
                    value={useBalance ? 'balance' : 'wallet'}
                    onChange={(e) => setUseBalance(e.target.value === 'balance')}
                    disabled={parseFloat(balance) <= 0 && useBalance}
                    className="bg-black/40 border border-yellow-500/30 rounded-lg px-3 py-2 text-white text-sm font-medium cursor-pointer focus:border-yellow-500 focus:outline-none transition-all appearance-none hover:border-yellow-500/50"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23EAB308'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.5rem center',
                      backgroundSize: '1em 1em',
                      paddingRight: '2rem',
                    }}
                  >
                    <option value="wallet" className="bg-gray-900">New Transaction</option>
                    <option value="balance" className="bg-gray-900" disabled={parseFloat(balance) <= 0}>
                      Casino Balance {parseFloat(balance) <= 0 ? '(Empty)' : ''}
                    </option>
                  </select>

                  <div className="flex items-center gap-2 text-yellow-400 font-bold text-sm">
                    <span className="text-gray-400">Balance:</span>
                    <span>{balance} SOL</span>
                  </div>
                </div>

                <appkit-button />
              </>
            ) : null}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 space-y-8">
        {!isConnected ? (
          <div className="text-center py-32">
            <h2 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-red-500 via-yellow-400 to-red-500 bg-clip-text text-transparent">
              ROULETTE
            </h2>
            <p className="text-gray-300 text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
              Place your bets. Spin the wheel. Win big on the blockchain.
            </p>
            <button
              onClick={() => modal.open()}
              className="group relative bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold py-5 px-12 rounded-xl text-xl transition-all duration-200 transform hover:scale-105 shadow-2xl"
            >
              <span className="relative z-10">Connect Wallet</span>
              <div className="absolute inset-0 bg-red-600/20 blur-xl scale-150 group-hover:scale-[1.7] transition-transform duration-500 rounded-xl"></div>
            </button>
          </div>
        ) : (
          <>
            {/* Quick Bets - Top */}
            <QuickBets
              onPlaceBet={handlePlaceBet}
              isSpinning={isSpinning}
              useBalance={useBalance}
            />

            {/* Desktop Layout: Number Picker LEFT | Roulette Wheel RIGHT */}
            <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
              {/* Number Picker - LEFT on desktop */}
              <div className="w-full lg:w-auto order-2 lg:order-1">
                <NumberPicker
                  onPlaceBet={handlePlaceMultiNumberBet}
                  isSpinning={isSpinning}
                  useBalance={useBalance}
                />
              </div>

              {/* Roulette Wheel - RIGHT on desktop */}
              <div className="w-full lg:flex-1 max-w-3xl mx-auto order-1 lg:order-2">
                <RouletteWheel
                  isSpinning={isSpinning}
                  winningNumber={winningNumber}
                  onSpinComplete={handleSpinComplete}
                />

                {/* Winning Number Display */}
                {winningNumber !== null && !isSpinning && (
                  <div className="mt-6 text-center">
                    <div className="inline-block bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-xl px-8 py-3 shadow-2xl border-2 border-yellow-400">
                      <div className="text-xs text-yellow-100 font-bold uppercase tracking-widest mb-1">Result</div>
                      <div className="text-5xl font-black text-white">{winningNumber}</div>
                    </div>
                  </div>
                )}
              </div>
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

      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        onWithdraw={handleWithdrawSubmit}
        balance={balance}
      />
    </main>
  );
}
