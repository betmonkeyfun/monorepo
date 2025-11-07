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

function getNumberColor(num: number): string {
  if (num === 0) return 'bg-green-600 hover:bg-green-500';
  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  return redNumbers.includes(num)
    ? 'bg-red-600 hover:bg-red-500'
    : 'bg-gray-900 hover:bg-gray-800';
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
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-red-500/30 rounded-xl p-3 shadow-lg">
        <div className="relative">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-red-400 via-yellow-200 to-red-400 bg-clip-text text-transparent">
                PICK NUMBERS
              </h3>
              <p className="text-gray-400 text-xs">0.01 SOL • 35:1 Payout</p>
            </div>
            {selectedNumbers.length > 0 && (
              <button
                onClick={clearSelection}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              >
                Clear ({selectedNumbers.length})
              </button>
            )}
          </div>

          {/* Green/Zero Button - Compact */}
          <div className="mb-3 flex justify-center">
            <button
              onClick={() => toggleNumber(0)}
              disabled={isSpinning}
              className={`
                ${selectedNumbers.includes(0) ? 'ring-2 ring-yellow-400 scale-105' : ''}
                ${isSpinning ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600
                text-white font-bold py-3 px-8 rounded-xl
                transition-all duration-150
                border-2 border-green-400/50
                disabled:transform-none
              `}
            >
              <div className="text-2xl">0</div>
              <div className="text-xs opacity-75">GREEN</div>
            </button>
          </div>

          {/* Number Grid - Compact */}
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {NUMBER_GRID.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-1 mb-1 justify-center">
                  {row.map((number) => (
                    <button
                      key={number}
                      onClick={() => toggleNumber(number)}
                      disabled={isSpinning}
                      className={`
                        ${getNumberColor(number)}
                        ${selectedNumbers.includes(number) ? 'ring-2 ring-yellow-400 scale-105' : ''}
                        ${isSpinning ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:brightness-125'}
                        text-white font-bold w-11 h-11 rounded-lg
                        transition-all duration-150 shadow-sm text-base
                        border border-gray-700
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

          {/* Place Bet Button - Compact */}
          {selectedNumbers.length > 0 && (
            <div className="mt-3 bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="text-yellow-200 font-bold text-sm">
                    {selectedNumbers.length === 1 ? 'STRAIGHT BET' : `${selectedNumbers.length} NUMBERS`}
                  </p>
                  <p className="text-yellow-100/70 text-xs">
                    {selectedNumbers.sort((a, b) => a - b).join(', ')}
                  </p>
                </div>
                <div className="text-right bg-black/30 rounded-lg px-3 py-1">
                  <p className="text-yellow-300 text-xs">Cost</p>
                  <p className="text-yellow-100 font-bold text-lg">
                    {(selectedNumbers.length * 0.01).toFixed(3)} SOL
                  </p>
                </div>
              </div>
              <button
                onClick={placeBet}
                disabled={isSpinning}
                className={`
                  w-full bg-gradient-to-r from-yellow-600 to-orange-500
                  hover:from-yellow-500 hover:to-orange-400
                  text-white font-bold text-sm py-3 px-4 rounded-lg
                  transition-all shadow-lg
                  border border-yellow-400/50
                  ${isSpinning ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                  disabled:transform-none
                `}
              >
                PLACE BET
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
