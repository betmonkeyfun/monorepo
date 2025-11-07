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

const TOTAL_SEGMENTS = ROULETTE_NUMBERS.length;
const ANGLE_PER_SEGMENT = 360 / TOTAL_SEGMENTS;
const BASE_START_ANGLE = -90 - ANGLE_PER_SEGMENT / 2; // zero centered at top

const toRadians = (deg: number) => (deg * Math.PI) / 180;

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
  const wheelRotationRef = useRef(0);
  const ballRotationRef = useRef(0);
  const wheelTweenRef = useRef<gsap.core.Tween | null>(null);
  const ballTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const [displayNumber, setDisplayNumber] = useState<number | null>(null);
  const [displayColor, setDisplayColor] = useState<string>('');
  const [coins, setCoins] = useState<Coin[]>([]);
  const [showExplosion, setShowExplosion] = useState(false);
  const [isWinner, setIsWinner] = useState(false);

  useEffect(() => {
    if (isSpinning && winningNumber !== null && wheelRef.current && ballRef.current) {
      const winningSlot = ROULETTE_NUMBERS.find(n => n.number === winningNumber);
      const winningIndex = ROULETTE_NUMBERS.findIndex(n => n.number === winningNumber);

      if (!winningSlot || winningIndex === -1) {
        return;
      }

      // Kill previous animations before starting a new spin
      if (wheelTweenRef.current) {
        wheelTweenRef.current.kill();
        const currentValue = gsap.getProperty(wheelRef.current, 'rotation');
        if (typeof currentValue === 'number') {
          wheelRotationRef.current = currentValue;
        }
      }
      if (ballTimelineRef.current) {
        ballTimelineRef.current.kill();
        const currentBallValue = gsap.getProperty(ballRef.current, 'rotation');
        if (typeof currentBallValue === 'number') {
          ballRotationRef.current = currentBallValue;
        }
      }

      // Reset display
      setDisplayNumber(null);
      setDisplayColor('');
      setCoins([]);
      setShowExplosion(false);
      setIsWinner(false);

      const slotMidAngle = winningIndex * ANGLE_PER_SEGMENT; // 0deg = top, clockwise positive
      const ballOffset = (Math.random() - 0.5) * ANGLE_PER_SEGMENT * 0.6;
      const ballFinalAngle = slotMidAngle + ballOffset;
      const alignmentBase = ballFinalAngle - slotMidAngle; // equals ballOffset
      const currentRotation = wheelRotationRef.current;
      const extraRotations = 6 + Math.random() * 2;
      const minRotation = currentRotation + extraRotations * 360;
      let targetRotation = alignmentBase;
      while (targetRotation < minRotation) {
        targetRotation += 360;
      }

      gsap.set(ballRef.current, { rotation: ballRotationRef.current, scale: 1 });

      // Animate wheel with buttery easing
      wheelTweenRef.current = gsap.to(wheelRef.current, {
        rotation: targetRotation,
        duration: 5.4,
        ease: 'power3.inOut',
        onComplete: () => {
          wheelRotationRef.current = targetRotation;
          setDisplayNumber(winningSlot.number);
          setDisplayColor(winningSlot.color);

          // Check if it's a win (placeholder logic)
          const didWin = Math.random() > 0.5; // Replace with actual win condition
          setIsWinner(didWin);

          if (didWin) {
            setShowExplosion(true);
            createCoinExplosion();
          }
          setTimeout(() => onSpinComplete(), 500);
        }
      });

      // Animate ball with staggered easing to mimic bouncing into pocket
      const ballTimeline = gsap.timeline();
      ballTimelineRef.current = ballTimeline;
      const currentBallRotation = ballRotationRef.current;
      const ballExtraSpins = 7 + Math.random() * 2;
      let targetBallRotation = ballFinalAngle - ballExtraSpins * 360;
      while (targetBallRotation >= currentBallRotation - ANGLE_PER_SEGMENT) {
        targetBallRotation -= 360;
      }
      ballTimeline.to(ballRef.current, {
        rotation: targetBallRotation,
        duration: 4,
        ease: 'power2.out',
      });
      ballTimeline.to(ballRef.current, {
        scale: 0.82,
        duration: 1,
        ease: 'power1.out'
      }, '-=1.3');
      ballTimeline.eventCallback('onComplete', () => {
        const normalized = ((ballFinalAngle % 360) + 360) % 360;
        gsap.set(ballRef.current, { rotation: normalized });
        ballRotationRef.current = normalized;
      });
    }
  }, [isSpinning, winningNumber, onSpinComplete]);

  useEffect(() => {
    return () => {
      wheelTweenRef.current?.kill();
      ballTimelineRef.current?.kill();
    };
  }, []);

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
    <div className="w-full h-[540px] flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-black rounded-2xl relative overflow-visible">
      {/* Ambient glow effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.15)_0%,transparent_60%)] pointer-events-none rounded-2xl"></div>

      {/* Wheel container */}
      <div className="relative w-[460px] h-[460px]">
        {/* Outer wooden rim with premium finish */}
        <div
          className="absolute inset-0 rounded-full border-[14px] border-yellow-700 overflow-hidden"
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
          <div className="absolute inset-3 rounded-full border-[5px] border-yellow-600 shadow-inner" style={{
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6), 0 0 15px rgba(234,179,8,0.4)'
          }}></div>

          {/* Wheel segments */}
          <div
            ref={wheelRef}
            className="absolute inset-7 rounded-full overflow-hidden"
            style={{
              transformOrigin: 'center',
              boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)'
            }}
          >
            {ROULETTE_NUMBERS.map((slot, i) => {
              const startAngle = BASE_START_ANGLE + i * ANGLE_PER_SEGMENT;
              const endAngle = startAngle + ANGLE_PER_SEGMENT;
              const midAngle = startAngle + ANGLE_PER_SEGMENT / 2;
              const startRad = toRadians(startAngle);
              const endRad = toRadians(endAngle);
              const isHighlighted = !isSpinning && displayNumber === slot.number;

              return (
                <div
                  key={i}
                  className={`absolute inset-0 ${getColorClass(slot.color)} ${isHighlighted ? 'shadow-[0_0_25px_rgba(250,204,21,0.9)]' : ''}`}
                  style={{
                    clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos(startRad)}% ${50 + 50 * Math.sin(startRad)}%, ${50 + 50 * Math.cos(endRad)}% ${50 + 50 * Math.sin(endRad)}%)`,
                    filter: isHighlighted ? 'brightness(1.3)' : 'none'
                  }}
                >
                  {/* Subtle gradient overlay for depth */}
                  <div className="absolute inset-0" style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)'
                  }}></div>

                  {/* Number - crystal clear */}
                  <div
                    className="absolute text-white font-black text-2xl tracking-tight"
                    style={{
                      left: '50%',
                      top: '50%',
                      textShadow: '0 3px 6px rgba(0,0,0,1), 0 0 10px rgba(0,0,0,0.8)',
                      transform: `
                        rotate(${midAngle}deg)
                        translateY(-190px)
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
            className="absolute top-1/2 left-1/2 w-32 h-32 -ml-16 -mt-16 rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-700"
            style={{
              boxShadow: '0 6px 20px rgba(0,0,0,0.5), inset 0 3px 6px rgba(255,255,255,0.5), inset 0 -3px 6px rgba(0,0,0,0.3)'
            }}
          >
            <div className="absolute inset-5 rounded-full border-[3px] border-yellow-300/50" style={{
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
            }}></div>
            <div className="absolute top-1/2 left-1/2 w-4 h-4 -ml-2 -mt-2 rounded-full bg-yellow-800 shadow-inner"></div>
          </div>

          {/* Chrome ball with realistic physics */}
          <div
            ref={ballRef}
            className="absolute top-10 left-1/2 w-7 h-7 -ml-[14px] rounded-full z-20"
            style={{
              transformOrigin: 'center 214px',
              background: 'radial-gradient(circle at 35% 35%, #ffffff, #f0f0f0 30%, #d0d0d0 60%, #808080 85%, #505050)',
              boxShadow: '0 4px 10px rgba(0,0,0,0.7), inset -2px -2px 3px rgba(0,0,0,0.4), inset 2px 2px 3px rgba(255,255,255,1)'
            }}
          ></div>
        </div>
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
