'use client';

import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';

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

interface SimpleRouletteWheelProps {
  isSpinning: boolean;
  winningNumber: number | null;
  onSpinComplete: () => void;
}

interface Coin {
  id: number;
  x: number;
  y: number;
  rotation: number;
  delay: number;
}

export default function SimpleRouletteWheel({ isSpinning, winningNumber, onSpinComplete }: SimpleRouletteWheelProps) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const [displayNumber, setDisplayNumber] = useState<number | null>(null);
  const [displayColor, setDisplayColor] = useState<string>('');
  const [coins, setCoins] = useState<Coin[]>([]);
  const [showExplosion, setShowExplosion] = useState(false);
  const [isWinner, setIsWinner] = useState(false);

  useEffect(() => {
    if (isSpinning && winningNumber !== null && wheelRef.current && ballRef.current) {
      const winningSlot = ROULETTE_NUMBERS.find(n => n.number === winningNumber);
      const winningIndex = ROULETTE_NUMBERS.findIndex(n => n.number === winningNumber);
      const anglePerSegment = 360 / ROULETTE_NUMBERS.length;

      // Reset display
      setDisplayNumber(null);
      setDisplayColor('');
      setCoins([]);
      setShowExplosion(false);
      setIsWinner(false);

      // Calculate target angle - align winning segment to top
      const targetAngle = -90 - (winningIndex * anglePerSegment);

      // Add rotations for effect
      const extraRotations = 6 + Math.random() * 2;
      const totalRotation = extraRotations * 360 + targetAngle;

      // Reset position
      gsap.set(wheelRef.current, { rotation: 0 });
      gsap.set(ballRef.current, { rotation: 0, scale: 1 });

      // Animate wheel
      gsap.to(wheelRef.current, {
        rotation: totalRotation,
        duration: 5,
        ease: 'power3.out',
        onComplete: () => {
          // Normalize rotation to prevent visual deformation
          if (wheelRef.current) {
            const normalizedRotation = targetAngle % 360;
            gsap.set(wheelRef.current, { rotation: normalizedRotation });
          }
          if (winningSlot) {
            setDisplayNumber(winningSlot.number);
            setDisplayColor(winningSlot.color);

            // Check if it's a win (you'll need to pass this from parent, for now assume random)
            // In real implementation, check against the bet
            const didWin = Math.random() > 0.5; // Replace with actual win condition
            setIsWinner(didWin);

            if (didWin) {
              // EXPLOSION OF COINS!
              setShowExplosion(true);
              createCoinExplosion();
            }
          }
          setTimeout(() => onSpinComplete(), 500);
        }
      });

      // Animate ball
      const ballTimeline = gsap.timeline();
      ballTimeline.to(ballRef.current, {
        rotation: -totalRotation * 1.2,
        duration: 3.5,
        ease: 'power2.in',
      });
      ballTimeline.to(ballRef.current, {
        scale: 0.8,
        duration: 0.8,
        ease: 'power1.out'
      }, '-=1');
    }
  }, [isSpinning, winningNumber, onSpinComplete]);

  const createCoinExplosion = () => {
    const coinCount = 30;
    const newCoins: Coin[] = [];

    for (let i = 0; i < coinCount; i++) {
      newCoins.push({
        id: i,
        x: Math.random() * 100 - 50,
        y: Math.random() * 100 - 50,
        rotation: Math.random() * 720,
        delay: Math.random() * 0.3
      });
    }

    setCoins(newCoins);

    // Clear coins after animation
    setTimeout(() => {
      setCoins([]);
      setShowExplosion(false);
    }, 2000);
  };

  const getColorClass = (color: string) => {
    if (color === 'red') return 'bg-red-600';
    if (color === 'black') return 'bg-black';
    return 'bg-green-600';
  };

  return (
    <div className="w-full h-[420px] flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-black rounded-2xl relative overflow-visible">
      {/* Ambient glow effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.15)_0%,transparent_60%)] pointer-events-none rounded-2xl"></div>

      {/* Wheel container */}
      <div className="relative w-[380px] h-[380px]">
        {/* Outer wooden rim with premium finish */}
        <div
          className="absolute inset-0 rounded-full border-[10px] border-yellow-700 overflow-hidden"
          style={{
            background: 'radial-gradient(circle, #4a2f1a 0%, #2d1810 100%)',
            boxShadow: '0 15px 50px rgba(0,0,0,0.6), inset 0 0 30px rgba(0,0,0,0.4), 0 0 60px rgba(234,179,8,0.2)'
          }}
        >
          {/* Animated shimmer on wood background */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent pointer-events-none"
            style={{
              animation: 'shimmer 3s infinite'
            }}
          ></div>
          {/* Golden decorative ring */}
          <div className="absolute inset-2 rounded-full border-[5px] border-yellow-600 shadow-inner" style={{
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6), 0 0 15px rgba(234,179,8,0.4)'
          }}></div>

          {/* Wheel segments */}
          <div
            ref={wheelRef}
            className="absolute inset-5 rounded-full overflow-hidden"
            style={{
              transformOrigin: 'center',
              boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)'
            }}
          >
            {ROULETTE_NUMBERS.map((slot, i) => {
              const anglePerSegment = 360 / ROULETTE_NUMBERS.length;
              const angle = i * anglePerSegment;
              const midAngle = angle + anglePerSegment / 2;

              return (
                <div
                  key={i}
                  className={`absolute inset-0 ${getColorClass(slot.color)}`}
                  style={{
                    clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((angle * Math.PI) / 180)}% ${50 + 50 * Math.sin((angle * Math.PI) / 180)}%, ${50 + 50 * Math.cos(((angle + anglePerSegment) * Math.PI) / 180)}% ${50 + 50 * Math.sin(((angle + anglePerSegment) * Math.PI) / 180)}%)`,
                  }}
                >
                  {/* Subtle gradient overlay for depth */}
                  <div className="absolute inset-0" style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)'
                  }}></div>

                  {/* Number - crystal clear */}
                  <div
                    className="absolute text-white font-black text-xl tracking-tight"
                    style={{
                      left: '50%',
                      top: '50%',
                      textShadow: '0 3px 6px rgba(0,0,0,1), 0 0 10px rgba(0,0,0,0.8)',
                      transform: `
                        rotate(${midAngle}deg)
                        translateY(-155px)
                        rotate(-${midAngle}deg)
                        translate(-50%, -50%)
                      `,
                    }}
                  >
                    {slot.number}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Premium center hub */}
          <div
            className="absolute top-1/2 left-1/2 w-24 h-24 -ml-12 -mt-12 rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-700"
            style={{
              boxShadow: '0 6px 20px rgba(0,0,0,0.5), inset 0 3px 6px rgba(255,255,255,0.5), inset 0 -3px 6px rgba(0,0,0,0.3)'
            }}
          >
            <div className="absolute inset-4 rounded-full border-[3px] border-yellow-300/50" style={{
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
            }}></div>
            <div className="absolute top-1/2 left-1/2 w-4 h-4 -ml-2 -mt-2 rounded-full bg-yellow-800 shadow-inner"></div>
          </div>

          {/* Chrome ball with realistic physics */}
          <div
            ref={ballRef}
            className="absolute top-12 left-1/2 w-6 h-6 -ml-3 rounded-full z-20"
            style={{
              transformOrigin: 'center 178px',
              background: 'radial-gradient(circle at 35% 35%, #ffffff, #f0f0f0 30%, #d0d0d0 60%, #808080 85%, #505050)',
              boxShadow: '0 4px 10px rgba(0,0,0,0.7), inset -2px -2px 3px rgba(0,0,0,0.4), inset 2px 2px 3px rgba(255,255,255,1)'
            }}
          ></div>
        </div>
      </div>

      {/* Premium arrow indicator */}
      <div className="absolute top-6 left-1/2 -ml-4 z-30">
        <div
          className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[28px] border-t-yellow-500"
          style={{
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.6)) drop-shadow(0 0 10px rgba(234,179,8,0.5))',
          }}
        ></div>
      </div>

      {/* Winning number display - OVERLAY (doesn't affect layout) */}
      {displayNumber !== null && displayColor && (
        <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-700 transform ${isWinner ? 'scale-110' : 'scale-100'}`}>
          <div className={`${getColorClass(displayColor)} rounded-2xl px-10 py-4 border-4 border-yellow-500 relative overflow-hidden shadow-2xl`}
            style={{
              boxShadow: isWinner
                ? '0 0 40px rgba(234,179,8,0.8), 0 10px 30px rgba(0,0,0,0.5)'
                : '0 10px 30px rgba(0,0,0,0.5)'
            }}
          >
            <div className="relative">
              <div className="text-yellow-300 text-sm font-bold mb-1 text-center uppercase tracking-widest">
                {isWinner ? '🎉 WINNER 🎉' : 'Result'}
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

      {/* COIN EXPLOSION - DOPAMINE OVERLOAD! */}
      {showExplosion && isWinner && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {coins.map((coin) => (
            <div
              key={coin.id}
              className="absolute top-1/2 left-1/2 w-12 h-12 -ml-6 -mt-6"
              style={{
                animation: `coinExplode 1.5s ease-out forwards ${coin.delay}s`,
                '--coin-x': `${coin.x}vw`,
                '--coin-y': `${coin.y}vh`,
                '--coin-rotation': `${coin.rotation}deg`,
              } as any}
            >
              <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 shadow-lg relative overflow-hidden"
                style={{
                  boxShadow: '0 4px 15px rgba(234,179,8,0.6), inset 0 2px 4px rgba(255,255,255,0.5)',
                  animation: 'coinSpin 0.6s linear infinite'
                }}
              >
                {/* SOL symbol or $ */}
                <div className="absolute inset-0 flex items-center justify-center text-yellow-900 font-black text-xl">
                  $
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes coinExplode {
          0% {
            transform: translate(0, 0) scale(0) rotate(0deg);
            opacity: 1;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translate(var(--coin-x), var(--coin-y)) scale(1.5) rotate(var(--coin-rotation));
            opacity: 0;
          }
        }

        @keyframes coinSpin {
          0%, 100% {
            transform: rotateY(0deg);
          }
          50% {
            transform: rotateY(180deg);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-200%);
          }
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
    </div>
  );
}
