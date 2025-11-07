'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';

// European roulette numbers and colors
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

interface SimpleRouletteWheelProps {
  isSpinning: boolean;
  winningNumber: number | null;
  onSpinComplete: () => void;
}

export default function SimpleRouletteWheel({ isSpinning, winningNumber, onSpinComplete }: SimpleRouletteWheelProps) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSpinning && winningNumber !== null && wheelRef.current && ballRef.current) {
      const winningIndex = ROULETTE_NUMBERS.findIndex(n => n.number === winningNumber);
      const anglePerSegment = 360 / ROULETTE_NUMBERS.length;
      const targetAngle = winningIndex * anglePerSegment;

      // Multiple rotations for effect
      const extraRotations = 5 + Math.random() * 3;
      const totalRotation = extraRotations * 360 + targetAngle;

      // Animate wheel spin
      gsap.to(wheelRef.current, {
        rotation: -totalRotation,
        duration: 4,
        ease: 'power2.out',
        onComplete: () => {
          onSpinComplete();
        }
      });

      // Animate ball
      const ballTimeline = gsap.timeline();

      // Ball spins on rim
      ballTimeline.to(ballRef.current, {
        rotation: totalRotation * 1.2,
        duration: 2.5,
        ease: 'power1.in',
      });

      // Ball drops into pocket
      ballTimeline.to(ballRef.current, {
        scale: 0.8,
        duration: 0.5,
        ease: 'bounce.out'
      });
    }
  }, [isSpinning, winningNumber, onSpinComplete]);

  const getColorClass = (color: string) => {
    if (color === 'red') return 'bg-red-600';
    if (color === 'black') return 'bg-gray-900';
    return 'bg-green-600';
  };

  return (
    <div className="w-full h-[600px] flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl overflow-hidden relative">
      {/* Wheel container */}
      <div className="relative w-96 h-96">
        {/* Outer rim */}
        <div className="absolute inset-0 rounded-full border-8 border-yellow-600 shadow-2xl"  style={{
          background: 'radial-gradient(circle, #1a1a1a 0%, #0a0a0a 100%)',
        }}></div>

        {/* Wheel segments */}
        <div
          ref={wheelRef}
          className="absolute inset-4 rounded-full overflow-hidden"
          style={{ transformOrigin: 'center' }}
        >
          {ROULETTE_NUMBERS.map((slot, i) => {
            const anglePerSegment = 360 / ROULETTE_NUMBERS.length;
            const angle = i * anglePerSegment;

            return (
              <div
                key={i}
                className={`absolute inset-0 ${getColorClass(slot.color)}`}
                style={{
                  clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((angle * Math.PI) / 180)}% ${50 + 50 * Math.sin((angle * Math.PI) / 180)}%, ${50 + 50 * Math.cos(((angle + anglePerSegment) * Math.PI) / 180)}% ${50 + 50 * Math.sin(((angle + anglePerSegment) * Math.PI) / 180)}%)`,
                }}
              >
                <div
                  className="absolute text-white font-bold text-sm"
                  style={{
                    top: '15%',
                    left: '50%',
                    transform: `translate(-50%, 0) rotate(${angle + anglePerSegment / 2}deg)`,
                  }}
                >
                  {slot.number}
                </div>
              </div>
            );
          })}
        </div>

        {/* Center hub */}
        <div className="absolute top-1/2 left-1/2 w-16 h-16 -ml-8 -mt-8 rounded-full bg-gradient-to-br from-yellow-600 to-yellow-800 shadow-lg border-2 border-yellow-400"></div>

        {/* Ball */}
        <div
          ref={ballRef}
          className="absolute top-8 left-1/2 w-4 h-4 -ml-2 rounded-full bg-white shadow-lg"
          style={{ transformOrigin: 'center 184px' }}
        ></div>
      </div>

      {/* Arrow indicator */}
      <div className="absolute top-20 left-1/2 -ml-3 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-yellow-500"></div>
    </div>
  );
}
