'use client';

import { useEffect, useState } from 'react';
import { Wheel } from 'react-custom-roulette';

// European roulette numbers and colors in correct wheel order
const ROULETTE_NUMBERS = [
  { number: 0, color: 'green' },
  { number: 32, color: 'red' }, { number: 15, color: 'black' },
  { number: 19, color: 'red' }, { number: 4, color: 'black' },
  { number: 21, color: 'red' }, { number: 2, color: 'black' },
  { number: 25, color: 'red' }, { number: 17, color: 'black' },
  { number: 34, color: 'red' }, { number: 6, color: 'black' },
  { number: 27, color: 'red' }, { number: 13, color: 'black' },
  { number: 36, color: 'red' }, { number: 11, color: 'black' },
  { number: 30, color: 'red' }, { number: 8, color: 'black' },
  { number: 23, color: 'red' }, { number: 10, color: 'black' },
  { number: 5, color: 'red' }, { number: 24, color: 'black' },
  { number: 16, color: 'red' }, { number: 33, color: 'black' },
  { number: 1, color: 'red' }, { number: 20, color: 'black' },
  { number: 14, color: 'red' }, { number: 31, color: 'black' },
  { number: 9, color: 'red' }, { number: 22, color: 'black' },
  { number: 18, color: 'red' }, { number: 29, color: 'black' },
  { number: 7, color: 'red' }, { number: 28, color: 'black' },
  { number: 12, color: 'red' }, { number: 35, color: 'black' },
  { number: 3, color: 'red' }, { number: 26, color: 'black' },
];

// Format data for react-custom-roulette
const wheelData = ROULETTE_NUMBERS.map((slot) => ({
  option: slot.number.toString(),
  style: {
    backgroundColor: slot.color === 'green' ? '#059669' : slot.color === 'red' ? '#DC2626' : '#000000',
    textColor: '#ffffff',
  },
}));

interface SimpleRouletteWheelProps {
  isSpinning: boolean;
  winningNumber: number | null;
  onSpinComplete: () => void;
}

export default function SimpleRouletteWheel({ isSpinning, winningNumber, onSpinComplete }: SimpleRouletteWheelProps) {
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [displayNumber, setDisplayNumber] = useState<number | null>(null);
  const [displayColor, setDisplayColor] = useState<string>('');

  useEffect(() => {
    if (isSpinning && winningNumber !== null) {
      // Find the index of the winning number in our wheel data
      const winningIndex = ROULETTE_NUMBERS.findIndex(n => n.number === winningNumber);
      const winningSlot = ROULETTE_NUMBERS.find(n => n.number === winningNumber);

      if (winningIndex !== -1) {
        setPrizeNumber(winningIndex);
        setMustSpin(true);
        setDisplayNumber(null);
        setDisplayColor('');
      }
    }
  }, [isSpinning, winningNumber]);

  const handleStopSpinning = () => {
    setMustSpin(false);
    const winningSlot = ROULETTE_NUMBERS[prizeNumber];
    if (winningSlot) {
      setDisplayNumber(winningSlot.number);
      setDisplayColor(winningSlot.color);
    }
    onSpinComplete();
  };

  const getColorClass = (color: string) => {
    if (color === 'red') return 'bg-red-600';
    if (color === 'black') return 'bg-black';
    return 'bg-green-600';
  };

  return (
    <div className="w-full h-[600px] flex flex-col items-center justify-center relative overflow-visible py-8">
      {/* Roulette Wheel */}
      <div className="relative z-10 flex items-center justify-center">
        <Wheel
          mustStartSpinning={mustSpin}
          prizeNumber={prizeNumber}
          data={wheelData}
          onStopSpinning={handleStopSpinning}
          backgroundColors={['#DC2626', '#000000', '#059669']}
          textColors={['#ffffff']}
          outerBorderColor="#D4AF37"
          outerBorderWidth={8}
          innerBorderColor="#8B7355"
          innerBorderWidth={4}
          radiusLineColor="#D4AF37"
          radiusLineWidth={2}
          fontSize={20}
          fontWeight={700}
          perpendicularText={false}
          textDistance={85}
          spinDuration={0.5}
        />
      </div>

      {/* Winning number display */}
      {displayNumber !== null && displayColor && (
        <div className="mt-8 z-20">
          <div className={`${getColorClass(displayColor)} rounded-2xl px-10 py-4 border-4 border-yellow-500 relative overflow-hidden shadow-2xl`}
            style={{
              boxShadow: '0 0 40px rgba(234,179,8,0.8), 0 10px 30px rgba(0,0,0,0.5)'
            }}
          >
            <div className="relative">
              <div className="text-yellow-300 text-sm font-bold mb-1 text-center uppercase tracking-widest">
                Result
              </div>
              <div className="text-white text-6xl font-black text-center tabular-nums" style={{
                textShadow: '0 4px 12px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.5)'
              }}>{displayNumber}</div>
              <div className={`text-center text-sm mt-2 font-bold uppercase tracking-widest ${
                displayColor === 'red' ? 'text-red-200' :
                displayColor === 'black' ? 'text-gray-300' :
                'text-green-200'
              }`}>
                {displayColor}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
