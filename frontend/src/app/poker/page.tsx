'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { PublicKey } from '@solana/web3.js';
import { modal } from '@/contexts/WalletContext';
import {
  getWalletBalance,
  createPaymentRequest,
  withdrawBalance,
} from '@/lib/x402';
import PlayingCard from '@/components/poker/PlayingCard';
import WithdrawModal from '@/components/casino/WithdrawModal';
import { motion, AnimatePresence } from 'framer-motion';
import { casinoSounds } from '@/lib/casinoSounds';

interface PokerResult {
  gameId: string;
  playerHole: string[];
  dealerHole: string[];
  community: string[];
  playerHand: { name: string; cards: string };
  dealerHand: { name: string; cards: string };
  winner: 'player' | 'dealer' | 'tie';
  won: boolean;
  tied: boolean;
  dealerQualified: boolean;
  payoutType: string;
  betAmount: string;
  winAmount: string;
  profit: string;
  message: string;
}

export default function PokerPage() {
  const router = useRouter();
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('solana') as any;

  const [isPlaying, setIsPlaying] = useState(false);
  const [gameResult, setGameResult] = useState<PokerResult | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [stats, setStats] = useState<any>(null);
  const [betAmount, setBetAmount] = useState('0.01');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [useBalance, setUseBalance] = useState(false);

  // Card reveal states for sequential animation
  const [revealedPlayerCards, setRevealedPlayerCards] = useState<number>(0);
  const [revealedDealerCards, setRevealedDealerCards] = useState<number>(0);
  const [revealedCommunityCards, setRevealedCommunityCards] =
    useState<number>(0);
  const [currentStatus, setCurrentStatus] = useState<string>('');

  // Ref for poker table to scroll to it
  const pokerTableRef = useRef<HTMLDivElement>(null);

  // Load player data
  useEffect(() => {
    if (address && isConnected) {
      loadPlayerData();
    }
  }, [address, isConnected]);

  // Sequential card reveal animation
  useEffect(() => {
    if (!gameResult) {
      // Reset all reveal states when no game
      setRevealedPlayerCards(0);
      setRevealedDealerCards(0);
      setRevealedCommunityCards(0);
      setCurrentStatus('');
      return;
    }

    // Step 1: Reveal player cards one by one
    const playerTimers: NodeJS.Timeout[] = [];
    for (let i = 0; i < 2; i++) {
      playerTimers.push(
        setTimeout(() => {
          setRevealedPlayerCards(i + 1);
          casinoSounds.playCardFlip();
          if (i === 1) {
            setCurrentStatus('Checking your hand...');
          }
        }, 800 + i * 800)
      );
    }

    // Step 2: Reveal dealer cards one by one
    const dealerTimers: NodeJS.Timeout[] = [];
    for (let i = 0; i < 2; i++) {
      dealerTimers.push(
        setTimeout(() => {
          setRevealedDealerCards(i + 1);
          casinoSounds.playCardFlip();
          if (i === 1) {
            setCurrentStatus('Dealer reveals...');
          }
        }, 2400 + i * 800)
      );
    }

    // Step 3: Reveal community cards one by one
    const communityTimers: NodeJS.Timeout[] = [];
    for (let i = 0; i < 5; i++) {
      communityTimers.push(
        setTimeout(() => {
          setRevealedCommunityCards(i + 1);
          casinoSounds.playCardFlip();

          if (i === 2) {
            setCurrentStatus('The Flop...');
          } else if (i === 3) {
            setCurrentStatus('The Turn...');
          } else if (i === 4) {
            setCurrentStatus('The River!');
            // Evaluate final result
            setTimeout(() => {
              setCurrentStatus(
                gameResult.won
                  ? `YOU WIN! ${gameResult.playerHand.name} beats ${gameResult.dealerHand.name}`
                  : gameResult.tied
                  ? `PUSH! Both have ${gameResult.playerHand.name}`
                  : `Dealer wins with ${gameResult.dealerHand.name}`
              );
              // Play win/loss sound
              if (gameResult.won && parseFloat(gameResult.profit) > 0) {
                casinoSounds.playBigWin();
              } else if (!gameResult.tied) {
                casinoSounds.playLoss();
              }
            }, 800);
          }
        }, 4000 + i * 800)
      );
    }

    return () => {
      [
        ...playerTimers,
        ...dealerTimers,
        ...communityTimers,
      ].forEach(clearTimeout);
    };
  }, [gameResult]);

  const loadPlayerData = async () => {
    if (!address) return;

    try {
      const [balanceData, statsData] = await Promise.all([
        getWalletBalance(address),
        fetch(
          `${
            process.env.NEXT_PUBLIC_CASINO_API_URL || 'http://localhost:3003'
          }/poker/stats/${address}`
        )
          .then((res) => (res.ok ? res.json() : { data: null }))
          .catch(() => ({ data: null })),
      ]);

      setBalance(balanceData.balance || '0');
      setStats(statsData.data);
    } catch (error) {
      console.error('Failed to load player data:', error);
    }
  };

  const handlePlayPoker = async () => {
    if (!address || !isConnected) {
      modal.open();
      return;
    }

    setIsPlaying(true);
    setGameResult(null);

    // Scroll to poker table with smooth animation (top of table at top of viewport)
    if (pokerTableRef.current) {
      pokerTableRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }

    // Play card shuffle sound
    casinoSounds.playCardShuffle();

    try {
      // If using casino balance, use the balance-based endpoint (no signature required)
      if (useBalance) {
        const CASINO_API_URL =
          process.env.NEXT_PUBLIC_CASINO_API_URL || 'http://localhost:3003';
        const response = await fetch(
          `${CASINO_API_URL}/poker/play-with-balance`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              walletAddress: address,
              amount: betAmount,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || error.error || 'Bet failed');
        }

        const result = await response.json();

        // Set game result - the useEffect will handle sequential card reveals
        setGameResult(result.data);

        // Refresh balance
        await loadPlayerData();
        return;
      }

      // Otherwise, create new payment transaction
      if (!walletProvider) {
        modal.open();
        return;
      }

      // Convert amount to lamports
      const amountLamports = (parseFloat(betAmount) * 1e9).toString();

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
        '/play/poker'
      );

      // Send request with payment in X-PAYMENT header
      const CASINO_API_URL =
        process.env.NEXT_PUBLIC_CASINO_API_URL || 'http://localhost:3003';
      const response = await fetch(`${CASINO_API_URL}/play/poker`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-PAYMENT': JSON.stringify(paymentRequest),
        },
        body: JSON.stringify({
          amount: betAmount,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Bet failed');
      }

      const result = await response.json();

      // Set game result - the useEffect will handle sequential card reveals
      setGameResult(result.data);

      // Refresh balance
      await loadPlayerData();
    } catch (error: any) {
      console.error('Poker failed:', error);
      alert(`Poker failed: ${error.message}`);
    } finally {
      setIsPlaying(false);
    }
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
      <div className="container mx-auto px-4 py-2">
        {!isConnected ? (
          <div className="text-center py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                🎴 Texas Hold'em Poker
              </h2>
              <p className="text-gray-400 mb-8 max-w-2xl mx-auto text-lg">
                Connect your Solana wallet to play poker against the dealer.
                Royal Flush pays 50:1!
              </p>
              <button
                onClick={() => modal.open()}
                className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-xl"
              >
                Connect Wallet
              </button>
            </motion.div>
          </div>
        ) : (
          <>
            {/* Poker Table */}
            <div className="max-w-6xl mx-auto" ref={pokerTableRef}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-green-900 to-green-800 rounded-xl shadow-2xl p-2 border-2 border-yellow-700 relative overflow-hidden"
              >
                {/* Felt texture overlay */}
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle, #000 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }}
                />

                <div className="relative z-10">
                  {/* Dealer Section */}
                  <div className="mb-2">
                    {/* Dealer Avatar and Name */}
                    <div className="flex items-center justify-center mb-1">
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="flex flex-col items-center"
                      >
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full border-2 border-yellow-500 overflow-hidden shadow-lg bg-gray-800">
                            <img
                              src="/dealer.jpg"
                              alt="Dealer"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback if image doesn't exist
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML = `
                                  <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600">
                                    <span class="text-4xl">🎰</span>
                                  </div>
                                `;
                              }}
                            />
                          </div>
                          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-gray-900 px-2 py-0.5 rounded-full text-xs font-bold shadow-lg">
                            DEALER
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    <h3 className="text-white text-sm mb-1 text-center font-bold flex items-center justify-center">
                      Dealer's Hand
                    </h3>
                    <div className="flex justify-center gap-1">
                      <AnimatePresence>
                        {gameResult ? (
                          gameResult.dealerHole.map(
                            (card: string, i: number) => (
                              <motion.div
                                key={i}
                                initial={{ rotateY: 180, opacity: 0, y: -50 }}
                                animate={{
                                  rotateY: i < revealedDealerCards ? 0 : 180,
                                  opacity: i < revealedDealerCards ? 1 : 0.3,
                                  y: 0,
                                }}
                                transition={{ duration: 0.6 }}
                              >
                                <PlayingCard
                                  card={i < revealedDealerCards ? card : ''}
                                  isRevealed={i < revealedDealerCards}
                                />
                              </motion.div>
                            )
                          )
                        ) : (
                          <>
                            <PlayingCard card="" isRevealed={false} />
                            <PlayingCard card="" isRevealed={false} />
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                    {gameResult && revealedDealerCards === 2 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-center text-white mt-1"
                      >
                        <p className="text-sm font-semibold">
                          {gameResult.dealerHand.name}
                        </p>
                        <p
                          className={`text-xs ${
                            gameResult.dealerQualified
                              ? 'text-green-300'
                              : 'text-red-300'
                          }`}
                        >
                          {gameResult.dealerQualified
                            ? 'Qualified (Pair or better)'
                            : 'Does not qualify'}
                        </p>
                      </motion.div>
                    )}
                  </div>

                  {/* Community Cards */}
                  <div className="mb-2">
                    <h3 className="text-white text-sm mb-1 text-center font-bold flex items-center justify-center">
                      Community Cards
                    </h3>
                    <div className="flex justify-center gap-1">
                      <AnimatePresence>
                        {gameResult
                          ? gameResult.community.map(
                              (card: string, i: number) => (
                                <motion.div
                                  key={i}
                                  initial={{
                                    rotateY: 180,
                                    opacity: 0,
                                    scale: 0.8,
                                  }}
                                  animate={{
                                    rotateY:
                                      i < revealedCommunityCards ? 0 : 180,
                                    opacity:
                                      i < revealedCommunityCards ? 1 : 0.3,
                                    scale: i < revealedCommunityCards ? 1 : 0.8,
                                  }}
                                  transition={{ duration: 0.6 }}
                                >
                                  <PlayingCard
                                    card={
                                      i < revealedCommunityCards ? card : ''
                                    }
                                    isRevealed={i < revealedCommunityCards}
                                  />
                                </motion.div>
                              )
                            )
                          : Array(5)
                              .fill(0)
                              .map((_, i) => (
                                <PlayingCard
                                  key={i}
                                  card=""
                                  isRevealed={false}
                                />
                              ))}
                      </AnimatePresence>
                    </div>

                    {/* Live status indicator */}
                    {currentStatus && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center mt-1"
                      >
                        <div className="inline-block bg-yellow-500/20 border border-yellow-500 rounded-lg px-3 py-1">
                          <p className="text-yellow-300 text-sm font-bold">
                            {currentStatus}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Player's Hand */}
                  <div>
                    <h3 className="text-white text-sm mb-1 text-center font-bold flex items-center justify-center">
                      Your Hand
                    </h3>
                    <div className="flex justify-center gap-1">
                      <AnimatePresence>
                        {gameResult ? (
                          gameResult.playerHole.map(
                            (card: string, i: number) => (
                              <motion.div
                                key={i}
                                initial={{ rotateY: 180, opacity: 0, y: 50 }}
                                animate={{
                                  rotateY: i < revealedPlayerCards ? 0 : 180,
                                  opacity: i < revealedPlayerCards ? 1 : 0.3,
                                  y: 0,
                                }}
                                transition={{ duration: 0.6 }}
                              >
                                <PlayingCard
                                  card={i < revealedPlayerCards ? card : ''}
                                  isRevealed={i < revealedPlayerCards}
                                />
                              </motion.div>
                            )
                          )
                        ) : (
                          <>
                            <PlayingCard card="" isRevealed={false} />
                            <PlayingCard card="" isRevealed={false} />
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                    {gameResult && revealedPlayerCards === 2 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-center text-white mt-4"
                      >
                        <p className="text-lg font-bold">
                          {gameResult.playerHand.name}
                        </p>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Result Banner */}
              <AnimatePresence>
                {gameResult && revealedCommunityCards === 5 && (
                  <motion.div
                    initial={{ scale: 0, rotateZ: -10 }}
                    animate={{ scale: 1, rotateZ: 0 }}
                    exit={{ scale: 0, rotateZ: 10 }}
                    transition={{ type: 'spring', duration: 0.6, delay: 0.8 }}
                    className={`mt-3 p-4 rounded-xl text-center shadow-xl ${
                      gameResult.won
                        ? 'bg-gradient-to-r from-green-600 to-green-500'
                        : gameResult.tied
                        ? 'bg-gradient-to-r from-yellow-600 to-yellow-500'
                        : 'bg-gradient-to-r from-red-600 to-red-500'
                    }`}
                  >
                    <motion.h2
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.0, type: 'spring' }}
                      className="text-2xl font-bold text-white mb-1"
                    >
                      {gameResult.won
                        ? 'YOU WON!'
                        : gameResult.tied
                        ? 'PUSH!'
                        : 'YOU LOST'}
                    </motion.h2>
                    <p className="text-base text-white/90 mb-2">
                      {gameResult.message}
                    </p>
                    <div className="flex justify-center gap-6 text-white">
                      <div className="bg-white/10 rounded-lg px-4 py-2">
                        <p className="text-xs opacity-75">Bet</p>
                        <p className="text-xl font-bold">
                          {gameResult.betAmount} SOL
                        </p>
                      </div>
                      <div className="bg-white/10 rounded-lg px-4 py-2">
                        <p className="text-xs opacity-75">Win</p>
                        <p className="text-xl font-bold">
                          {gameResult.winAmount} SOL
                        </p>
                      </div>
                      <div className="bg-white/10 rounded-lg px-4 py-2">
                        <p className="text-xs opacity-75">Profit</p>
                        <p
                          className={`text-xl font-bold ${
                            parseFloat(gameResult.profit) > 0
                              ? 'text-green-200'
                              : 'text-red-200'
                          }`}
                        >
                          {parseFloat(gameResult.profit) > 0 ? '+' : ''}
                          {gameResult.profit} SOL
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Betting Controls */}
              <div className="mt-3 bg-black/60 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/20">
                <div className="max-w-md mx-auto">
                  <label className="block text-white text-sm mb-2 font-semibold">
                    Bet Amount (SOL)
                  </label>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    step="0.001"
                    min="0.001"
                    disabled={isPlaying}
                    className="w-full px-4 py-3 text-lg rounded-lg bg-gray-800 text-white border border-yellow-500/30 focus:border-yellow-500 outline-none transition-all disabled:opacity-50"
                  />

                  <button
                    onClick={handlePlayPoker}
                    disabled={
                      isPlaying || !isConnected || parseFloat(betAmount) <= 0
                    }
                    className="w-full mt-3 px-6 py-3 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  >
                    {isPlaying ? 'Dealing Cards...' : 'Deal Hand'}
                  </button>

                  {gameResult && (
                    <button
                      onClick={() => {
                        setGameResult(null);
                      }}
                      className="w-full mt-2 px-4 py-2 text-sm font-semibold bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all"
                    >
                      Clear Table
                    </button>
                  )}
                </div>
              </div>

              {/* Poker Hand Rankings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-3 bg-black/60 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/20"
              >
                <h3 className="text-base font-bold text-center mb-3 text-yellow-300">
                  💰 Payout Table
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                  <div className="bg-purple-900/30 rounded-lg p-2 text-center">
                    <p className="font-bold text-yellow-400 text-xs">Royal Flush</p>
                    <p className="text-xl font-bold text-white">50:1</p>
                  </div>
                  <div className="bg-purple-900/30 rounded-lg p-2 text-center">
                    <p className="font-bold text-yellow-400 text-xs">Straight Flush</p>
                    <p className="text-xl font-bold text-white">20:1</p>
                  </div>
                  <div className="bg-purple-900/30 rounded-lg p-2 text-center">
                    <p className="font-bold text-yellow-400 text-xs">Four of a Kind</p>
                    <p className="text-xl font-bold text-white">10:1</p>
                  </div>
                  <div className="bg-purple-900/30 rounded-lg p-2 text-center">
                    <p className="font-bold text-yellow-400 text-xs">Full House</p>
                    <p className="text-xl font-bold text-white">5:1</p>
                  </div>
                  <div className="bg-purple-900/30 rounded-lg p-2 text-center">
                    <p className="font-bold text-yellow-400 text-xs">Flush</p>
                    <p className="text-xl font-bold text-white">4:1</p>
                  </div>
                  <div className="bg-purple-900/30 rounded-lg p-2 text-center">
                    <p className="font-bold text-yellow-400 text-xs">Straight</p>
                    <p className="text-xl font-bold text-white">3:1</p>
                  </div>
                  <div className="bg-purple-900/30 rounded-lg p-2 text-center">
                    <p className="font-bold text-yellow-400 text-xs">Three of a Kind</p>
                    <p className="text-xl font-bold text-white">2:1</p>
                  </div>
                  <div className="bg-purple-900/30 rounded-lg p-2 text-center">
                    <p className="font-bold text-yellow-400 text-xs">Two Pair</p>
                    <p className="text-xl font-bold text-white">1:1</p>
                  </div>
                  <div className="bg-purple-900/30 rounded-lg p-2 text-center">
                    <p className="font-bold text-yellow-400 text-xs">Pair</p>
                    <p className="text-xl font-bold text-white">1:1</p>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-2 text-center">
                    <p className="font-bold text-gray-400 text-xs">High Card</p>
                    <p className="text-xl font-bold text-gray-500">Push</p>
                  </div>
                </div>
                <p className="text-center text-gray-400 text-xs mt-2">
                  * Dealer must qualify with at least a Pair. If dealer doesn't qualify, you win ante only.
                </p>
              </motion.div>
            </div>
          </>
        )}
      </div>

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
