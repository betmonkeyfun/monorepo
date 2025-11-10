'use client';

import { useState, useEffect, useRef } from 'react';

interface NumberPickerProps {
  onPlaceBet: (numbers: number[], amount: string, useBalance: boolean) => void;
  isSpinning: boolean;
  useBalance: boolean;
}

// Generate number grid for roulette table (European layout)
const NUMBER_GRID = [
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
];

function getNumberColor(num: number): { gradient: string; border: string; glow: string } {
  if (num === 0) {
    return {
      gradient: 'from-green-600 to-green-500',
      border: 'border-green-400',
      glow: 'hover:shadow-green-500/50'
    };
  }
  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  if (redNumbers.includes(num)) {
    return {
      gradient: 'from-red-600 to-red-500',
      border: 'border-red-400',
      glow: 'hover:shadow-red-500/50'
    };
  }
  return {
    gradient: 'from-gray-800 to-gray-900',
    border: 'border-gray-600',
    glow: 'hover:shadow-gray-500/50'
  };
}

export default function NumberPicker({ onPlaceBet, isSpinning, useBalance }: NumberPickerProps) {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element for click sound
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Hq00EYEj2K0+K1aSMDH3PB7eGYTQwTWKvl6qxZGAxOouHptWIdBTWN1PDFeSwGJ3fH8N+QPw0VXrXo7atWFA==');
  }, []);

  const playClickSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  const toggleNumber = (number: number) => {
    if (isSpinning) return;

    playClickSound();
    setSelectedNumbers(prev => {
      if (prev.includes(number)) {
        return prev.filter(n => n !== number);
      } else {
        return [...prev, number];
      }
    });
  };

  const placeBet = () => {
    if (selectedNumbers.length === 0 || isSpinning) return;
    onPlaceBet(selectedNumbers, '0.01', useBalance);
    setSelectedNumbers([]);
  };

  const clearSelection = () => {
    setSelectedNumbers([]);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="relative overflow-hidden bg-black/60 backdrop-blur-sm border border-red-500/20 rounded-2xl shadow-2xl">
        <div className="relative p-6 pb-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-black text-white tracking-wide">
                PICK NUMBERS
              </h3>
              <p className="text-gray-500 text-sm mt-1">0.01 SOL per number • 35:1 Payout</p>
            </div>
            {selectedNumbers.length > 0 && (
              <button
                onClick={clearSelection}
                className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-400 px-4 py-2 rounded-lg text-sm font-bold transition-all"
              >
                Clear ({selectedNumbers.length})
              </button>
            )}
          </div>

          {/* Green/Zero Button */}
          <div className="mb-6 flex justify-center">
            <button
              onClick={() => toggleNumber(0)}
              disabled={isSpinning}
              className={`
                group relative
                ${selectedNumbers.includes(0) ? 'ring-4 ring-yellow-400 scale-110 shadow-2xl shadow-yellow-500/50' : ''}
                ${isSpinning ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 hover:shadow-2xl hover:shadow-green-500/50'}
                bg-gradient-to-br from-green-600 to-green-500
                text-white font-black py-4 px-10 rounded-2xl
                transition-all duration-200
                border-3 border-green-400
                disabled:transform-none
              `}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent group-hover:from-black/10 rounded-2xl"></div>
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl"></div>
              <div className="relative">
                <div className="text-3xl tracking-wider">0</div>
                <div className="text-xs opacity-90 tracking-widest">GREEN</div>
              </div>
            </button>
          </div>

          {/* Number Grid */}
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full pt-2 px-2">
              {NUMBER_GRID.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-2 mb-2 justify-center">
                  {row.map((number) => {
                    const colors = getNumberColor(number);
                    return (
                      <button
                        key={number}
                        onClick={() => toggleNumber(number)}
                        disabled={isSpinning}
                        className={`
                          group relative
                          bg-gradient-to-br ${colors.gradient}
                          ${selectedNumbers.includes(number) ? 'ring-3 ring-yellow-400 scale-110 shadow-xl shadow-yellow-500/50' : ''}
                          ${isSpinning ? 'opacity-50 cursor-not-allowed' : `hover:scale-110 hover:shadow-xl ${colors.glow}`}
                          text-white font-black w-12 h-12 rounded-xl
                          transition-all duration-200 shadow-lg text-lg
                          border-2 ${colors.border}
                          disabled:transform-none
                        `}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent group-hover:from-black/10 rounded-xl"></div>
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl"></div>
                        <span className="relative">{number}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Place Bet Section - Always visible, full width */}
        <div className="mt-6 relative bg-black/80 border-t border-yellow-500/20 p-5 rounded-b-2xl">
          <div className="relative">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-white font-bold text-base">
                  {selectedNumbers.length === 0 ? 'NO BETS' : selectedNumbers.length === 1 ? 'STRAIGHT BET' : `${selectedNumbers.length} NUMBERS`}
                </p>
                {selectedNumbers.length > 0 && (
                  <p className="text-gray-400 text-sm mt-1">
                    {selectedNumbers.sort((a, b) => a - b).join(', ')}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-xs uppercase mb-1">Total Cost</p>
                <p className="text-yellow-400 font-black text-2xl">
                  {(selectedNumbers.length * 0.01).toFixed(3)} <span className="text-lg text-gray-400">SOL</span>
                </p>
              </div>
            </div>
            <button
              onClick={placeBet}
              disabled={isSpinning || selectedNumbers.length === 0}
              className={`
                w-full
                bg-gradient-to-r from-yellow-600 to-yellow-500
                hover:from-yellow-500 hover:to-yellow-400
                text-black font-black text-lg py-4 px-6 rounded-xl
                transition-all duration-200 shadow-xl
                ${isSpinning || selectedNumbers.length === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:shadow-2xl hover:shadow-yellow-500/20'}
                disabled:hover:shadow-xl
              `}
            >
              PLACE BET
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
