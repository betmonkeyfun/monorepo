'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PitchPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < 6) setCurrentSlide(currentSlide + 1);
  };

  const prevSlide = () => {
    if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background pattern */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-black bg-[linear-gradient(to_right,#4a0000_1px,transparent_1px),linear-gradient(to_bottom,#4a0000_1px,transparent_1px)] bg-[size:6rem_4rem]"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-red-900/30 bg-black/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1
            onClick={() => router.push('/home')}
            className="text-3xl font-black bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 bg-clip-text text-transparent tracking-wider cursor-pointer hover:scale-105 transition-transform"
          >
            BETMONKEY CASINO
          </h1>
          <div className="text-yellow-400 font-bold">
            Pitch Deck
          </div>
        </div>
      </header>

      {/* Slides Container */}
      <div className="container mx-auto px-4 py-8 md:py-16 pb-32">
        <div className="max-w-6xl mx-auto">
          {/* Slide Display */}
          <div className="relative min-h-[600px] flex flex-col justify-center">

            {/* Slide 1: Title */}
            {currentSlide === 0 && (
              <div className="text-center space-y-8 animate-fade-in">
                <div className="space-y-4">
                  <h1 className="text-7xl md:text-9xl font-black bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400 bg-clip-text text-transparent tracking-wider">
                    BETMONKEY
                  </h1>
                  <h2 className="text-4xl md:text-6xl font-bold text-red-500">
                    CASINO
                  </h2>
                </div>
                <div className="h-1 w-64 mx-auto bg-gradient-to-r from-transparent via-yellow-400 to-transparent"></div>
                <p className="text-2xl md:text-3xl text-gray-300 font-light">
                  The First AI-Managed Casino on Solana
                </p>
                <p className="text-xl text-gray-400">
                  Where Treasury Meets Intelligence
                </p>
              </div>
            )}

            {/* Slide 2: The Problem */}
            {currentSlide === 1 && (
              <div className="space-y-8 animate-fade-in">
                <h2 className="text-5xl md:text-6xl font-black text-yellow-400 mb-8">
                  The Problem
                </h2>
                <div className="space-y-6 text-xl md:text-2xl text-gray-300">
                  <div className="flex items-start gap-4">
                    <span className="text-4xl text-red-500">🎰</span>
                    <p>
                      Traditional online casinos are <span className="text-red-400 font-bold">black boxes</span> -
                      players never know if the house is playing fair
                    </p>
                  </div>
                  <div className="flex items-start gap-4">
                    <span className="text-4xl text-red-500">💰</span>
                    <p>
                      Casino profits go to <span className="text-red-400 font-bold">centralized owners</span>,
                      not the community
                    </p>
                  </div>
                  <div className="flex items-start gap-4">
                    <span className="text-4xl text-red-500">📊</span>
                    <p>
                      No intelligent treasury management - casinos don't adapt to player preferences
                      or <span className="text-red-400 font-bold">optimize their offerings</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Slide 3: The Solution */}
            {currentSlide === 2 && (
              <div className="space-y-8 animate-fade-in">
                <h2 className="text-5xl md:text-6xl font-black text-yellow-400 mb-8">
                  The Solution
                </h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-gradient-to-br from-red-900/30 to-orange-900/30 border border-red-500/50 rounded-xl p-6 space-y-4">
                    <h3 className="text-3xl font-bold text-red-400">Provably Fair Casino</h3>
                    <p className="text-lg text-gray-300">
                      Built on Solana blockchain with transparent, verifiable games including Roulette, Poker, and Slots
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border border-blue-500/50 rounded-xl p-6 space-y-4">
                    <h3 className="text-3xl font-bold text-blue-400">AI Treasury Agent</h3>
                    <p className="text-lg text-gray-300">
                      An autonomous agent that manages the casino treasury, token economics, and proposes new features based on player data
                    </p>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-yellow-900/20 to-red-900/20 border border-yellow-500/50 rounded-xl p-6 text-center">
                  <p className="text-2xl text-yellow-300 font-bold">
                    Casino Success = Token Value Growth
                  </p>
                  <p className="text-gray-400 mt-2">
                    The better the casino performs, the more valuable the $MONKEY token becomes
                  </p>
                </div>
              </div>
            )}

            {/* Slide 4: Token Economics */}
            {currentSlide === 3 && (
              <div className="space-y-8 animate-fade-in">
                <h2 className="text-5xl md:text-6xl font-black text-yellow-400 mb-8">
                  Token Economics
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-6">
                      <h3 className="text-2xl font-bold text-red-400 mb-2">Token Supply</h3>
                      <p className="text-4xl font-black text-white">1,000,000,000</p>
                      <p className="text-gray-400">$MONKEY tokens</p>
                    </div>
                    <div className="bg-blue-900/20 border border-blue-500/50 rounded-xl p-6">
                      <h3 className="text-2xl font-bold text-blue-400 mb-2">Buyback Threshold</h3>
                      <p className="text-4xl font-black text-white">10,000 SOL</p>
                      <p className="text-gray-400">in casino revenue</p>
                    </div>
                  </div>
                  <div className="space-y-4 text-lg text-gray-300">
                    <h3 className="text-2xl font-bold text-yellow-400 mb-4">How It Works</h3>
                    <div className="space-y-3">
                      <p className="flex items-start gap-3">
                        <span className="text-green-400 font-bold">1.</span>
                        Casino generates revenue from games
                      </p>
                      <p className="flex items-start gap-3">
                        <span className="text-green-400 font-bold">2.</span>
                        AI agent monitors treasury balance
                      </p>
                      <p className="flex items-start gap-3">
                        <span className="text-green-400 font-bold">3.</span>
                        When threshold is hit, agent buys back $MONKEY tokens
                      </p>
                      <p className="flex items-start gap-3">
                        <span className="text-green-400 font-bold">4.</span>
                        Buybacks reduce supply and increase token value
                      </p>
                      <p className="flex items-start gap-3">
                        <span className="text-green-400 font-bold">5.</span>
                        Holders benefit from casino success
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Slide 5: Token Distribution */}
            {currentSlide === 4 && (
              <div className="space-y-8 animate-fade-in">
                <h2 className="text-5xl md:text-6xl font-black text-yellow-400 mb-8">
                  Token Distribution
                </h2>
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  {/* Pie Chart */}
                  <div className="relative w-80 h-80 mx-auto">
                    <svg viewBox="0 0 100 100" className="transform -rotate-90">
                      {/* Community (40%) - Yellow */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#FCD34D"
                        strokeWidth="80"
                        strokeDasharray="251.2 0"
                        strokeDashoffset="0"
                      />
                      {/* Treasury/Buybacks (30%) - Red */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#EF4444"
                        strokeWidth="80"
                        strokeDasharray="188.4 62.8"
                        strokeDashoffset="-100.48"
                      />
                      {/* Team (15%) - Blue */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#3B82F6"
                        strokeWidth="80"
                        strokeDasharray="94.2 157"
                        strokeDashoffset="-163.12"
                      />
                      {/* Liquidity (15%) - Green */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#10B981"
                        strokeWidth="80"
                        strokeDasharray="94.2 157"
                        strokeDashoffset="-257.32"
                      />
                    </svg>
                  </div>

                  {/* Legend */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
                      <div className="w-8 h-8 bg-yellow-400 rounded"></div>
                      <div>
                        <p className="text-xl font-bold text-yellow-400">40% Community</p>
                        <p className="text-gray-400">Airdrops & Rewards</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                      <div className="w-8 h-8 bg-red-500 rounded"></div>
                      <div>
                        <p className="text-xl font-bold text-red-400">30% Treasury</p>
                        <p className="text-gray-400">AI-Managed Buybacks</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
                      <div className="w-8 h-8 bg-blue-500 rounded"></div>
                      <div>
                        <p className="text-xl font-bold text-blue-400">15% Team</p>
                        <p className="text-gray-400">2-year vesting</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 bg-green-900/20 border border-green-500/50 rounded-lg p-4">
                      <div className="w-8 h-8 bg-green-500 rounded"></div>
                      <div>
                        <p className="text-xl font-bold text-green-400">15% Liquidity</p>
                        <p className="text-gray-400">DEX Pools</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Slide 6: AI Treasury Agent Features */}
            {currentSlide === 5 && (
              <div className="space-y-8 animate-fade-in">
                <h2 className="text-5xl md:text-6xl font-black text-yellow-400 mb-8">
                  AI Treasury Agent
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/50 rounded-xl p-6 space-y-3">
                    <h3 className="text-2xl font-bold text-purple-400">🤖 Autonomous Management</h3>
                    <p className="text-gray-300">
                      Monitors treasury 24/7 and executes buybacks automatically when revenue thresholds are met
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border border-blue-500/50 rounded-xl p-6 space-y-3">
                    <h3 className="text-2xl font-bold text-blue-400">📊 Data Analysis</h3>
                    <p className="text-gray-300">
                      Analyzes player behavior and game performance to identify trends and opportunities
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-500/50 rounded-xl p-6 space-y-3">
                    <h3 className="text-2xl font-bold text-green-400">🎮 Game Proposals</h3>
                    <p className="text-gray-300">
                      Proposes new games and features based on what players actually want and what generates revenue
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-900/30 to-red-900/30 border border-orange-500/50 rounded-xl p-6 space-y-3">
                    <h3 className="text-2xl font-bold text-orange-400">💎 Value Optimization</h3>
                    <p className="text-gray-300">
                      Optimizes fund allocation between game development, marketing, and buybacks for maximum token value
                    </p>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-yellow-900/20 to-red-900/20 border border-yellow-500/50 rounded-xl p-6 text-center mt-6">
                  <p className="text-xl text-yellow-300 font-bold">
                    Powered by Solana x402 Protocol
                  </p>
                  <p className="text-gray-400 mt-2">
                    Leveraging AI agents for autonomous treasury operations
                  </p>
                </div>
              </div>
            )}

            {/* Slide 7: Roadmap */}
            {currentSlide === 6 && (
              <div className="space-y-8 animate-fade-in">
                <h2 className="text-5xl md:text-6xl font-black text-yellow-400 mb-8">
                  Roadmap
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Q1 2025 */}
                  <div className="flex gap-4 items-start">
                    <div className="bg-green-500 text-black font-bold px-3 py-1.5 rounded-lg text-sm whitespace-nowrap h-fit">
                      Q1 2025
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-green-400 mb-2">Launch Phase</h3>
                      <ul className="text-gray-300 space-y-1 text-sm">
                        <li>• Deploy Roulette & Poker games</li>
                        <li>• Launch $MONKEY token</li>
                        <li>• Initialize AI Treasury Agent</li>
                        <li>• Community airdrop (40% distribution begins)</li>
                      </ul>
                    </div>
                  </div>

                  {/* Q2 2025 */}
                  <div className="flex gap-4 items-start">
                    <div className="bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg text-sm whitespace-nowrap h-fit">
                      Q2 2025
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-blue-400 mb-2">Expansion Phase</h3>
                      <ul className="text-gray-300 space-y-1 text-sm">
                        <li>• Add Slots game</li>
                        <li>• First AI-proposed game based on player data</li>
                        <li>• Enhanced agent analytics dashboard</li>
                        <li>• First buyback event at 10K SOL revenue</li>
                      </ul>
                    </div>
                  </div>

                  {/* Q3 2025 */}
                  <div className="flex gap-4 items-start">
                    <div className="bg-purple-500 text-white font-bold px-3 py-1.5 rounded-lg text-sm whitespace-nowrap h-fit">
                      Q3 2025
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-purple-400 mb-2">Scale Phase</h3>
                      <ul className="text-gray-300 space-y-1 text-sm">
                        <li>• Multi-player tournaments</li>
                        <li>• DAO governance for major decisions</li>
                        <li>• Cross-chain expansion</li>
                        <li>• Agent-driven marketing campaigns</li>
                      </ul>
                    </div>
                  </div>

                  {/* Q4 2025 */}
                  <div className="flex gap-4 items-start">
                    <div className="bg-yellow-500 text-black font-bold px-3 py-1.5 rounded-lg text-sm whitespace-nowrap h-fit">
                      Q4 2025
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-yellow-400 mb-2">Ecosystem Phase</h3>
                      <ul className="text-gray-300 space-y-1 text-sm">
                        <li>• Open API for third-party game developers</li>
                        <li>• AI agent SDK for other casinos</li>
                        <li>• NFT integration for VIP players</li>
                        <li>• Global tournament series</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Navigation at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-red-900/30 py-6 z-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Navigation Controls */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={prevSlide}
                disabled={currentSlide === 0}
                className={`px-6 py-3 rounded-lg font-bold transition-all ${
                  currentSlide === 0
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white'
                }`}
              >
                ← Previous
              </button>

              {/* Slide Indicators */}
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4, 5, 6].map((index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      currentSlide === index
                        ? 'bg-yellow-400 w-8'
                        : 'bg-gray-600 hover:bg-gray-500'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextSlide}
                disabled={currentSlide === 6}
                className={`px-6 py-3 rounded-lg font-bold transition-all ${
                  currentSlide === 6
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white'
                }`}
              >
                Next →
              </button>
            </div>

            {/* Slide Counter */}
            <div className="text-center text-gray-400">
              Slide {currentSlide + 1} of 7
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </main>
  );
}
