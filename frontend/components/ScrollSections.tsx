'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function ScrollSections() {
  const welcomeRef = useRef<HTMLDivElement>(null);
  const gamesRef = useRef<HTMLDivElement>(null);
  const slotsRef = useRef<HTMLDivElement>(null);
  const pokerRef = useRef<HTMLDivElement>(null);
  const rouletteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Welcome overlay - fade in during 0-20% scroll
    if (welcomeRef.current) {
      gsap.fromTo(
        welcomeRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          scrollTrigger: {
            trigger: welcomeRef.current,
            start: 'top top',
            end: '20% top',
            scrub: true,
            markers: false, // Set to true for debugging
          },
        }
      );

      // Fade out welcome text
      gsap.to(welcomeRef.current, {
        opacity: 0,
        y: -50,
        scrollTrigger: {
          trigger: welcomeRef.current,
          start: '20% top',
          end: '40% top',
          scrub: true,
        },
      });
    }

    // Games section - reveal during 40-60% scroll
    if (gamesRef.current) {
      const gameCards = gamesRef.current.querySelectorAll('.game-card');

      gsap.fromTo(
        gamesRef.current,
        { opacity: 0 },
        {
          opacity: 1,
          scrollTrigger: {
            trigger: gamesRef.current,
            start: '40% top',
            end: '60% top',
            scrub: true,
            pin: false,
          },
        }
      );

      // Stagger game cards
      gsap.fromTo(
        gameCards,
        { opacity: 0, y: 100, scale: 0.8 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          stagger: 0.2,
          scrollTrigger: {
            trigger: gamesRef.current,
            start: '50% top',
            end: '80% top',
            scrub: true,
          },
        }
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <>
      {/* Welcome Overlay - 0-20% scroll */}
      <div
        ref={welcomeRef}
        className="fixed top-0 left-0 w-full h-screen flex items-center justify-center pointer-events-none z-10"
      >
        <div className="text-center">
          <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 mb-4 drop-shadow-2xl animate-pulse">
            Enter the Palace Casino
          </h1>
          <p className="text-xl md:text-2xl text-white/90 font-light tracking-wider">
            Where Fortune Meets Luxury
          </p>
        </div>
      </div>

      {/* Spacer for scroll - This creates the scrollable area */}
      <div className="h-[300vh] relative">
        {/* Games Section - appears at 40-60% scroll */}
        <div
          ref={gamesRef}
          className="absolute top-[150vh] w-full min-h-screen flex items-center justify-center px-4"
        >
          <div className="max-w-6xl w-full">
            <h2 className="text-5xl md:text-6xl font-bold text-center text-white mb-12">
              Choose Your Game
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Slots Card */}
              <Link href="/slots" className="game-card group">
                <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-8 hover:scale-105 transition-transform duration-300 cursor-pointer shadow-2xl border-2 border-yellow-400/30">
                  <div className="text-6xl mb-4 text-center">🎰</div>
                  <h3 className="text-3xl font-bold text-white text-center mb-2">
                    Slots
                  </h3>
                  <p className="text-white/80 text-center">
                    Spin to win big jackpots
                  </p>
                  <div className="mt-4 flex justify-center">
                    <span className="px-4 py-2 bg-yellow-400 text-purple-900 font-bold rounded-full group-hover:bg-yellow-300 transition-colors">
                      Play Now
                    </span>
                  </div>
                </div>
              </Link>

              {/* Poker Card */}
              <Link href="/poker" className="game-card group">
                <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl p-8 hover:scale-105 transition-transform duration-300 cursor-pointer shadow-2xl border-2 border-yellow-400/30">
                  <div className="text-6xl mb-4 text-center">🃏</div>
                  <h3 className="text-3xl font-bold text-white text-center mb-2">
                    Poker
                  </h3>
                  <p className="text-white/80 text-center">
                    Test your skills and bluff
                  </p>
                  <div className="mt-4 flex justify-center">
                    <span className="px-4 py-2 bg-yellow-400 text-green-900 font-bold rounded-full group-hover:bg-yellow-300 transition-colors">
                      Play Now
                    </span>
                  </div>
                </div>
              </Link>

              {/* Roulette Card */}
              <Link href="/roulette" className="game-card group">
                <div className="bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl p-8 hover:scale-105 transition-transform duration-300 cursor-pointer shadow-2xl border-2 border-yellow-400/30">
                  <div className="text-6xl mb-4 text-center">🎲</div>
                  <h3 className="text-3xl font-bold text-white text-center mb-2">
                    Roulette
                  </h3>
                  <p className="text-white/80 text-center">
                    Place your bets and spin
                  </p>
                  <div className="mt-4 flex justify-center">
                    <span className="px-4 py-2 bg-yellow-400 text-red-900 font-bold rounded-full group-hover:bg-yellow-300 transition-colors">
                      Play Now
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Additional content section - after scroll completes */}
      <div className="min-h-screen bg-gradient-to-b from-black to-purple-950 flex items-center justify-center px-4">
        <div className="max-w-4xl text-center">
          <h2 className="text-5xl font-bold text-white mb-6">
            Welcome to the Palace
          </h2>
          <p className="text-xl text-white/80 mb-8 leading-relaxed">
            Experience the finest casino games in a luxurious 3D environment.
            Step through the golden doors and enter a world of excitement,
            strategy, and fortune.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button className="px-8 py-4 bg-yellow-400 text-black font-bold rounded-full hover:bg-yellow-300 transition-colors text-lg">
              Sign Up Now
            </button>
            <button className="px-8 py-4 border-2 border-yellow-400 text-yellow-400 font-bold rounded-full hover:bg-yellow-400 hover:text-black transition-colors text-lg">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
