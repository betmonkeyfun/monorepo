'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface CoinAnimationProps {
  count: number;
  isWin: boolean;
  amount?: string;
  onComplete?: () => void;
}

export default function CoinAnimation({ count, isWin, amount: _amount, onComplete }: CoinAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const coins: HTMLDivElement[] = [];

    // Create coins
    for (let i = 0; i < count; i++) {
      const coin = document.createElement('div');
      coin.className = 'absolute w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-2xl';
      coin.style.background = isWin
        ? 'linear-gradient(135deg, #D4AF37 0%, #F4E5A8 50%, #D4AF37 100%)'
        : 'linear-gradient(135deg, #9CA3AF 0%, #D1D5DB 50%, #9CA3AF 100%)';
      coin.style.border = '3px solid rgba(255, 255, 255, 0.3)';
      coin.textContent = '◎';
      coin.style.fontSize = '24px';
      coin.style.left = '50%';
      coin.style.top = '50%';
      coin.style.transform = 'translate(-50%, -50%)';
      coin.style.zIndex = '1000';

      container.appendChild(coin);
      coins.push(coin);
    }

    // Animate coins
    coins.forEach((coin, i) => {
      const delay = i * 0.1;
      const angle = (Math.PI * 2 * i) / count;
      const distance = 200 + Math.random() * 100;
      const endX = Math.cos(angle) * distance;
      const endY = Math.sin(angle) * distance;

      const timeline = gsap.timeline({
        delay,
        onComplete: () => {
          if (i === coins.length - 1) {
            // Clean up after last coin
            setTimeout(() => {
              coins.forEach(c => c.remove());
              onComplete?.();
            }, 500);
          }
        }
      });

      // Launch coin
      timeline.to(coin, {
        x: endX,
        y: endY,
        duration: 0.8,
        ease: 'power2.out',
      });

      // Spin effect
      timeline.to(coin, {
        rotateY: 1080,
        duration: 0.8,
        ease: 'none',
      }, 0);

      // Scale effect
      timeline.to(coin, {
        scale: 1.5,
        duration: 0.4,
        ease: 'power2.out',
      }, 0);

      timeline.to(coin, {
        scale: 0,
        duration: 0.4,
        ease: 'power2.in',
      }, 0.4);

      // Fade out
      timeline.to(coin, {
        opacity: 0,
        duration: 0.5,
        ease: 'power2.in',
      }, 0.3);
    });

  }, [count, isWin, onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ perspective: '1000px' }}
    />
  );
}

interface WinningAnimationProps {
  amount: string;
  onComplete?: () => void;
}

export function WinningAnimation({ amount, onComplete }: WinningAnimationProps) {
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!textRef.current) return;

    const timeline = gsap.timeline({
      onComplete: () => {
        setTimeout(() => {
          onComplete?.();
        }, 1000);
      }
    });

    timeline.fromTo(
      textRef.current,
      {
        scale: 0,
        opacity: 0,
        rotationZ: -180,
      },
      {
        scale: 1,
        opacity: 1,
        rotationZ: 0,
        duration: 0.6,
        ease: 'back.out(1.7)',
      }
    );

    timeline.to(textRef.current, {
      scale: 1.2,
      duration: 0.3,
      yoyo: true,
      repeat: 3,
      ease: 'power1.inOut',
    });

    timeline.to(textRef.current, {
      scale: 0,
      opacity: 0,
      duration: 0.4,
      ease: 'power2.in',
    });

  }, [amount, onComplete]);

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
      <div
        ref={textRef}
        className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 drop-shadow-2xl"
        style={{
          textShadow: '0 0 20px rgba(212, 175, 55, 0.8), 0 0 40px rgba(212, 175, 55, 0.4)',
        }}
      >
        +{amount} SOL
      </div>
    </div>
  );
}

interface LosingAnimationProps {
  onComplete?: () => void;
}

export function LosingAnimation({ onComplete }: LosingAnimationProps) {
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!textRef.current) return;

    const timeline = gsap.timeline({
      onComplete: () => {
        setTimeout(() => {
          onComplete?.();
        }, 500);
      }
    });

    timeline.fromTo(
      textRef.current,
      {
        scale: 0,
        opacity: 0,
      },
      {
        scale: 1,
        opacity: 1,
        duration: 0.3,
        ease: 'power2.out',
      }
    );

    timeline.to(textRef.current, {
      y: 100,
      opacity: 0,
      duration: 0.5,
      ease: 'power2.in',
    }, 0.5);

  }, [onComplete]);

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
      <div
        ref={textRef}
        className="text-5xl font-bold text-red-500 drop-shadow-2xl"
        style={{
          textShadow: '0 0 20px rgba(220, 38, 38, 0.8)',
        }}
      >
        Try Again
      </div>
    </div>
  );
}
