'use client';

import { useState } from 'react';

interface BettingInterfaceProps {
  onPlaceBet: (betType: string, amount: string) => void;
  onPlaceNumberBet: (number: number, amount: string) => void;
  isSpinning: boolean;
  balance?: string;
}

const SIMPLE_BETS = [
  { type: 'red', label: 'Red', color: 'bg-red-600 hover:bg-red-700', amount: '0.001' },
  { type: 'black', label: 'Black', color: 'bg-gray-900 hover:bg-black', amount: '0.001' },
  { type: 'even', label: 'Even', color: 'bg-blue-600 hover:bg-blue-700', amount: '0.001' },
  { type: 'odd', label: 'Odd', color: 'bg-purple-600 hover:bg-purple-700', amount: '0.001' },
  { type: 'low', label: '1-18', color: 'bg-indigo-600 hover:bg-indigo-700', amount: '0.001' },
  { type: 'high', label: '19-36', color: 'bg-pink-600 hover:bg-pink-700', amount: '0.001' },
];

const GREEN_BET = { number: 0, label: 'Green (0)', color: 'bg-green-600 hover:bg-green-700', amount: '0.01' };

// Generate number grid for roulette table (European layout simplified)
const NUMBER_GRID = [
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
];

function getNumberColor(num: number): string {
  if (num === 0) return 'bg-green-600 hover:bg-green-700';
  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  return redNumbers.includes(num) ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-900 hover:bg-black';
}

export default function BettingInterface({
  onPlaceBet,
  onPlaceNumberBet,
  isSpinning,
  balance
}: BettingInterfaceProps) {
  const [selectedBetType, setSelectedBetType] = useState<string | null>(null);

  const handleSimpleBet = (betType: string, amount: string) => {
    if (isSpinning) return;
    setSelectedBetType(betType);
    onPlaceBet(betType, amount);
  };

  const handleNumberBet = (number: number, amount: string) => {
    if (isSpinning) return;
    setSelectedBetType(`number-${number}`);
    onPlaceNumberBet(number, amount);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Balance Display */}
      {balance && (
        <div className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 rounded-xl p-4 text-center shadow-xl">
          <div className="text-sm text-yellow-100 font-medium">Casino Balance</div>
          <div className="text-3xl font-bold text-white mt-1">{balance} SOL</div>
        </div>
      )}

      {/* Simple Bets */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Simple Bets (0.001 SOL - Pays 1:1)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {SIMPLE_BETS.map((bet) => (
            <button
              key={bet.type}
              onClick={() => handleSimpleBet(bet.type, bet.amount)}
              disabled={isSpinning}
              className={`
                ${bet.color}
                ${isSpinning ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105 active:scale-95'}
                ${selectedBetType === bet.type ? 'ring-4 ring-yellow-400' : ''}
                text-white font-bold py-4 px-6 rounded-xl
                transition-all duration-200 shadow-lg
                disabled:transform-none
              `}
            >
              <div className="text-lg">{bet.label}</div>
              <div className="text-xs opacity-75 mt-1">{bet.amount} SOL</div>
            </button>
          ))}
        </div>
      </div>

      {/* Green/Zero Bet */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Special Bet (0.01 SOL - Pays 35:1)</h3>
        <button
          onClick={() => handleNumberBet(GREEN_BET.number, GREEN_BET.amount)}
          disabled={isSpinning}
          className={`
            ${GREEN_BET.color}
            ${isSpinning ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105 active:scale-95'}
            ${selectedBetType === 'number-0' ? 'ring-4 ring-yellow-400' : ''}
            text-white font-bold py-6 px-12 rounded-xl
            transition-all duration-200 shadow-lg w-full md:w-auto
            disabled:transform-none
          `}
        >
          <div className="text-2xl">{GREEN_BET.label}</div>
          <div className="text-sm opacity-75 mt-2">{GREEN_BET.amount} SOL</div>
        </button>
      </div>

      {/* Number Grid */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Number Bets (0.01 SOL - Pays 35:1)</h3>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {NUMBER_GRID.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-1 mb-1">
                {row.map((number) => (
                  <button
                    key={number}
                    onClick={() => handleNumberBet(number, '0.01')}
                    disabled={isSpinning}
                    className={`
                      ${getNumberColor(number)}
                      ${isSpinning ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105 active:scale-95'}
                      ${selectedBetType === `number-${number}` ? 'ring-4 ring-yellow-400' : ''}
                      text-white font-bold w-12 h-12 rounded-lg
                      transition-all duration-200 shadow-md text-sm
                      border border-gray-600/50
                      disabled:transform-none
                    `}
                  >
                    {number}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
        <p className="text-gray-400 text-sm mt-4 text-center">
          Click any number to place a straight bet
        </p>
      </div>

      {/* Info */}
      <div className="bg-blue-900/30 backdrop-blur-sm rounded-xl p-4 border border-blue-700/50">
        <p className="text-blue-200 text-sm text-center">
          💡 <strong>Tip:</strong> Simple bets cost 0.001 SOL and pay 1:1. Number bets (including green) cost 0.01 SOL and pay 35:1!
        </p>
      </div>
    </div>
  );
}
