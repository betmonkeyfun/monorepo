'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';

export default function Home() {
  const router = useRouter();
  const [isZooming, setIsZooming] = useState(false);
  const [activeCard, setActiveCard] = useState(0);
  const heroSectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const performZoomAnimation = () => {
    if (isZooming || !heroSectionRef.current) return;

    setIsZooming(true);

    // Zoom in animation
    gsap.to(heroSectionRef.current, {
      scale: 2.5,
      opacity: 0,
      duration: 1.2,
      ease: 'power2.inOut',
      onComplete: () => {
        // Scroll to cards section after zoom
        const cardsSection = document.querySelector('#cards-section');
        cardsSection?.scrollIntoView({ behavior: 'smooth' });

        // Reset after scroll
        setTimeout(() => {
          if (heroSectionRef.current) {
            gsap.set(heroSectionRef.current, { scale: 1, opacity: 1 });
            setIsZooming(false);
          }
        }, 800);
      }
    });
  };

  const handlePlayClick = () => {
    performZoomAnimation();
  };

  const handleRouletteClick = () => {
    router.push('/roulette');
  };


  const handlePokerClick = () => {
    router.push('/poker');
  };

  const handleTokenClick = () => {
    router.push('/token');
  };

  // Block scrolling until user clicks ENTER
  useEffect(() => {
    // Disable scrolling on mount
    document.body.style.overflow = 'hidden';

    return () => {
      // Re-enable scrolling on unmount (shouldn't happen but just in case)
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Re-enable scrolling after zoom animation starts
  useEffect(() => {
    if (isZooming) {
      // Wait a bit before re-enabling scroll
      setTimeout(() => {
        document.body.style.overflow = 'unset';
      }, 500);
    }
  }, [isZooming]);

  // Track active card based on scroll progress
  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    const cardLength = cardContent.length;
    const cardsBreakpoints = cardContent.map((_, index) => index / cardLength);
    const closestBreakpointIndex = cardsBreakpoints.reduce(
      (acc, breakpoint, index) => {
        const distance = Math.abs(latest - breakpoint);
        if (distance < Math.abs(latest - cardsBreakpoints[acc])) {
          return index;
        }
        return acc;
      },
      0
    );
    setActiveCard(closestBreakpointIndex);
  });

  const cardContent = [
    {
      title: "Decentralized Gaming on Solana",
      content: (
        <>
          <h3 className="text-2xl font-bold text-yellow-400 mb-4">Decentralized Gaming on Solana</h3>
          <p className="mb-4 text-gray-300">
            BetMonkey Casino brings you the thrill of classic casino games, powered entirely by blockchain technology.
            Play roulette, poker, and more with complete transparency and fairness, all on the Solana network.
          </p>
          <p className="text-gray-300">
            Every bet, every spin, every win is recorded on-chain, ensuring a provably fair gaming experience
            where the house can't cheat and your winnings are guaranteed.
          </p>
        </>
      ),
    },
    {
      title: "HTTP 402: Payment Required",
      content: (
        <>
          <h3 className="text-2xl font-bold text-yellow-400 mb-4">HTTP 402: Payment Required</h3>
          <p className="mb-4 text-gray-300">
            BetMonkey Casino uses the HTTP 402 status code protocol - a revolutionary payment standard that enables
            seamless micropayments directly in your wallet. No more complex payment flows or third-party processors.
          </p>
          <p className="mb-4 text-gray-300">
            When you place a bet, your wallet automatically signs the transaction and includes it in the HTTP request
            header (X-PAYMENT). The casino backend verifies your payment and processes your bet instantly.
          </p>
          <p className="text-gray-300">
            It's the future of web payments: simple, secure, and built on open standards.
          </p>
        </>
      ),
    },
    {
      title: "How It Works",
      content: (
        <>
          <h3 className="text-2xl font-bold text-yellow-400 mb-4">How It Works</h3>
          <ol className="list-decimal list-inside space-y-3 text-gray-300">
            <li>Connect your Solana wallet (Phantom, Solflare, or any compatible wallet)</li>
            <li>Choose your game and place your bet</li>
            <li>Your wallet signs a payment transaction automatically</li>
            <li>The payment is included in the HTTP request to our backend</li>
            <li>Backend verifies the signature and processes your bet on-chain</li>
            <li>Results are returned instantly and your winnings are deposited to your casino balance</li>
            <li>Withdraw anytime to your wallet with zero fees</li>
          </ol>
        </>
      ),
    },
    {
      title: "Ready to Play?",
      content: (
        <>
          <h3 className="text-3xl font-bold text-yellow-400 mb-6">Ready to Play?</h3>
          <p className="text-gray-300 mb-8 max-w-md">
            Join the future of decentralized gaming. Start playing provably fair casino games on Solana today.
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleRouletteClick}
              className="bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white font-bold py-4 px-12 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-xl"
            >
              Play Roulette
            </button>
            <button
              onClick={handlePokerClick}
              className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold py-4 px-12 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-xl"
            >
              Play Poker
            </button>
          </div>

        </>
      ),
    },
  ];

  return (
    <>
      {/* Hero Section - Video Landing */}
      <section
        ref={heroSectionRef}
        className="relative h-screen bg-black text-white overflow-hidden snap-start"
        style={{ pointerEvents: isZooming ? 'none' : 'auto' }}
      >
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/landing.webm" type="video/webm" />
        </video>

        {/* Center Button */}
        <div className="relative z-10 h-full flex items-center justify-center">
          <button
            onClick={handlePlayClick}
            disabled={isZooming}
            className="group relative"
          >
            {/* Outer glow */}
            <div className="absolute inset-0 bg-red-600/30 blur-xl scale-150 group-hover:scale-[1.7] transition-transform duration-500" />

            {/* Button rectangle */}
            <div className="relative px-12 py-3 bg-black/40 backdrop-blur-sm border border-red-600/40 flex items-center justify-center transition-all duration-300 group-hover:bg-black/60 group-hover:border-red-600/70 group-hover:scale-105">
              {/* Play icon / Text */}
              <span className="text-xl font-bold tracking-widest text-red-500"
                style={{
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  fontWeight: '700'
                }}>
                ENTER
              </span>
            </div>

            {/* Pulse animation border */}
            <div className="absolute inset-0 border border-red-600/50 animate-ping opacity-20" />
          </button>
        </div>
      </section>

      {/* 3D Game Cards Section */}
      <section id="cards-section" className="relative py-24 px-4 overflow-hidden snap-start">
        {/* Background pattern */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-black bg-[linear-gradient(to_right,#4a0000_1px,transparent_1px),linear-gradient(to_bottom,#4a0000_1px,transparent_1px)] bg-[size:6rem_4rem]"></div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-20 md:gap-24">
            {/* Roulette Card */}
            <div className="group relative" style={{ perspective: '2000px', transformStyle: 'preserve-3d' }}>
              {/* Glow behind card */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/30 via-orange-500/20 to-pink-500/30 blur-3xl scale-110 opacity-50 group-hover:opacity-70 transition-opacity duration-300" style={{ transform: 'translateZ(-50px)' }} />

              {/* Gradient border wrapper */}
              <div
                className="card-gradient-red relative transition-all duration-500 hover:-translate-y-8 hover:scale-110 cursor-pointer group-hover:shadow-2xl"
                style={{
                  borderRadius: '20px',
                  padding: '3px',
                  boxShadow: `
                    6px 6px 0 rgba(255, 107, 0, 0.8),
                    8px 8px 0 rgba(255, 107, 0, 0.7),
                    10px 10px 0 rgba(255, 165, 0, 0.6),
                    12px 12px 0 rgba(255, 165, 0, 0.5),
                    14px 14px 0 rgba(255, 107, 0, 0.4),
                    16px 16px 0 rgba(255, 0, 0, 0.4),
                    18px 18px 0 rgba(255, 0, 0, 0.3),
                    20px 20px 0 rgba(200, 0, 0, 0.3),
                    22px 22px 0 rgba(150, 0, 0, 0.2),
                    24px 24px 0 rgba(100, 0, 0, 0.2),
                    26px 26px 0 rgba(80, 0, 0, 0.2),
                    28px 28px 0 rgba(60, 0, 0, 0.1),
                    30px 30px 0 rgba(40, 0, 0, 0.1),
                    -6px 6px 0 rgba(255, 107, 0, 0.8),
                    -8px 8px 0 rgba(255, 107, 0, 0.7),
                    -10px 10px 0 rgba(255, 165, 0, 0.6),
                    -12px 12px 0 rgba(255, 165, 0, 0.5),
                    -14px 14px 0 rgba(255, 107, 0, 0.4),
                    -16px 16px 0 rgba(255, 0, 0, 0.4),
                    -18px 18px 0 rgba(255, 0, 0, 0.3),
                    -20px 20px 0 rgba(200, 0, 0, 0.3),
                    -22px 22px 0 rgba(150, 0, 0, 0.2),
                    -24px 24px 0 rgba(100, 0, 0, 0.2),
                    -26px 26px 0 rgba(80, 0, 0, 0.2),
                    -28px 28px 0 rgba(60, 0, 0, 0.1),
                    -30px 30px 0 rgba(40, 0, 0, 0.1),
                    0 40px 80px rgba(0, 0, 0, 0.9)
                  `,
                  transform: 'translateZ(60px)',
                  transformStyle: 'preserve-3d'
                }}
              >
                {/* Inner card content */}
                <div
                  className="flex flex-col overflow-hidden"
                  style={{
                    minHeight: '600px',
                    borderRadius: '18px',
                    background: 'linear-gradient(135deg, #1a0000 0%, #2d0000 50%, #1a0000 100%)'
                  }}
                >
                {/* Content */}
                <div className="p-8 flex flex-col flex-1 justify-center">
                  <h3 className="text-3xl font-bold text-red-500 mb-3 tracking-wider">
                    ROULETTE
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed mb-6 flex-1">
                    Classic casino game with 36 numbers. Bet on red, black, odds, evens, or specific numbers for big wins.
                  </p>

                  {/* Play Button */}
                  <button
                    onClick={handleRouletteClick}
                    className="w-full py-3 bg-gradient-to-r from-red-600 via-orange-600 to-red-600 hover:from-red-500 hover:via-orange-500 hover:to-red-500 text-white font-bold text-lg tracking-wider transition-all duration-300 rounded-lg"
                  >
                    PLAY NOW
                  </button>
                </div>
                </div>
              </div>
            </div>

            {/* Poker Card */}
            <div className="group relative" style={{ perspective: '2000px', transformStyle: 'preserve-3d' }}>
              {/* Glow behind card */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 via-pink-500/20 to-fuchsia-500/30 blur-3xl scale-110 opacity-50 group-hover:opacity-70 transition-opacity duration-300" style={{ transform: 'translateZ(-50px)' }} />

              <div
                className="card-gradient-purple relative transition-all duration-500 hover:-translate-y-8 hover:scale-110 cursor-pointer group-hover:shadow-2xl"
                style={{
                  borderRadius: '20px',
                  padding: '3px',
                  boxShadow: `
                    6px 6px 0 rgba(204, 0, 255, 0.8),
                    8px 8px 0 rgba(204, 0, 255, 0.7),
                    10px 10px 0 rgba(153, 0, 255, 0.6),
                    12px 12px 0 rgba(153, 0, 255, 0.5),
                    14px 14px 0 rgba(204, 0, 255, 0.4),
                    16px 16px 0 rgba(255, 0, 255, 0.4),
                    18px 18px 0 rgba(255, 0, 255, 0.3),
                    20px 20px 0 rgba(200, 0, 200, 0.3),
                    22px 22px 0 rgba(150, 0, 150, 0.2),
                    24px 24px 0 rgba(120, 0, 120, 0.2),
                    26px 26px 0 rgba(100, 0, 100, 0.2),
                    28px 28px 0 rgba(80, 0, 80, 0.1),
                    30px 30px 0 rgba(60, 0, 60, 0.1),
                    -6px 6px 0 rgba(204, 0, 255, 0.8),
                    -8px 8px 0 rgba(204, 0, 255, 0.7),
                    -10px 10px 0 rgba(153, 0, 255, 0.6),
                    -12px 12px 0 rgba(153, 0, 255, 0.5),
                    -14px 14px 0 rgba(204, 0, 255, 0.4),
                    -16px 16px 0 rgba(255, 0, 255, 0.4),
                    -18px 18px 0 rgba(255, 0, 255, 0.3),
                    -20px 20px 0 rgba(200, 0, 200, 0.3),
                    -22px 22px 0 rgba(150, 0, 150, 0.2),
                    -24px 24px 0 rgba(120, 0, 120, 0.2),
                    -26px 26px 0 rgba(100, 0, 100, 0.2),
                    -28px 28px 0 rgba(80, 0, 80, 0.1),
                    -30px 30px 0 rgba(60, 0, 60, 0.1),
                    0 40px 80px rgba(0, 0, 0, 0.9)
                  `,
                  transform: 'translateZ(60px)',
                  transformStyle: 'preserve-3d'
                }}
              >
                <div
                  className="flex flex-col overflow-hidden"
                  style={{
                    minHeight: '600px',
                    borderRadius: '18px',
                    background: 'linear-gradient(135deg, #1a001a 0%, #2d002d 50%, #1a001a 100%)'
                  }}
                >
                {/* Content */}
                <div className="p-8 flex flex-col flex-1 justify-center">
                  <h3 className="text-3xl font-bold text-purple-400 mb-3 tracking-wider">
                    POKER
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed mb-6 flex-1">
                    Texas Hold'em against the dealer. Get the best 5-card hand from your hole cards and community cards. Royal flush pays 50:1!
                  </p>

                  {/* Play Button */}
                  <button
                    onClick={handlePokerClick}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white font-bold text-lg tracking-wider transition-all duration-300 rounded-lg"
                  >
                    PLAY NOW
                  </button>
                </div>
                </div>
              </div>
            </div>

            {/* Token Card */}
            <div className="group relative" style={{ perspective: '2000px', transformStyle: 'preserve-3d' }}>
              {/* Glow behind card */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/30 via-emerald-500/20 to-teal-500/30 blur-3xl scale-110 opacity-50 group-hover:opacity-70 transition-opacity duration-300" style={{ transform: 'translateZ(-50px)' }} />

              <div
                className="card-gradient-green relative transition-all duration-500 hover:-translate-y-8 hover:scale-110 cursor-pointer group-hover:shadow-2xl"
                style={{
                  borderRadius: '20px',
                  padding: '3px',
                  boxShadow: `
                    6px 6px 0 rgba(0, 153, 255, 0.8),
                    8px 8px 0 rgba(0, 153, 255, 0.7),
                    10px 10px 0 rgba(51, 102, 255, 0.6),
                    12px 12px 0 rgba(51, 102, 255, 0.5),
                    14px 14px 0 rgba(0, 153, 255, 0.4),
                    16px 16px 0 rgba(0, 212, 255, 0.4),
                    18px 18px 0 rgba(0, 212, 255, 0.3),
                    20px 20px 0 rgba(0, 150, 200, 0.3),
                    22px 22px 0 rgba(0, 100, 150, 0.2),
                    24px 24px 0 rgba(0, 80, 120, 0.2),
                    26px 26px 0 rgba(0, 60, 100, 0.2),
                    28px 28px 0 rgba(0, 40, 80, 0.1),
                    30px 30px 0 rgba(0, 20, 60, 0.1),
                    -6px 6px 0 rgba(0, 153, 255, 0.8),
                    -8px 8px 0 rgba(0, 153, 255, 0.7),
                    -10px 10px 0 rgba(51, 102, 255, 0.6),
                    -12px 12px 0 rgba(51, 102, 255, 0.5),
                    -14px 14px 0 rgba(0, 153, 255, 0.4),
                    -16px 16px 0 rgba(0, 212, 255, 0.4),
                    -18px 18px 0 rgba(0, 212, 255, 0.3),
                    -20px 20px 0 rgba(0, 150, 200, 0.3),
                    -22px 22px 0 rgba(0, 100, 150, 0.2),
                    -24px 24px 0 rgba(0, 80, 120, 0.2),
                    -26px 26px 0 rgba(0, 60, 100, 0.2),
                    -28px 28px 0 rgba(0, 40, 80, 0.1),
                    -30px 30px 0 rgba(0, 20, 60, 0.1),
                    0 40px 80px rgba(0, 0, 0, 0.9)
                  `,
                  transform: 'translateZ(60px)',
                  transformStyle: 'preserve-3d'
                }}
              >
                <div
                  className="flex flex-col overflow-hidden"
                  style={{
                    minHeight: '600px',
                    borderRadius: '18px',
                    background: 'linear-gradient(135deg, #001a2d 0%, #002d4a 50%, #001a2d 100%)'
                  }}
                >
                {/* Content */}
                <div className="p-8 flex flex-col flex-1 justify-center">
                  <h3 className="text-3xl font-bold text-green-400 mb-3 tracking-wider">
                    BMONKEY TOKEN
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed mb-6 flex-1">
                    Buy & sell BMONKEY tokens. Price increases as casino reserves grow. Dynamic bonding curve trading.
                  </p>

                  {/* Play Button */}
                  <button
                    onClick={handleTokenClick}
                    className="w-full py-3 bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 hover:from-green-500 hover:via-emerald-500 hover:to-green-500 text-white font-bold text-lg tracking-wider transition-all duration-300 rounded-lg"
                  >
                    TRADE NOW
                  </button>
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section - Casino and 402 Integration */}
      <section ref={containerRef} className="relative text-white snap-start" style={{ height: '300vh' }}>
        {/* Background pattern */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-black bg-[linear-gradient(to_right,#4a0000_1px,transparent_1px),linear-gradient(to_bottom,#4a0000_1px,transparent_1px)] bg-[size:6rem_4rem]"></div>

        <div className="sticky top-0 h-screen flex items-center">
          <div className="container mx-auto max-w-7xl px-10">
            <div className="flex justify-center relative space-x-10">
              {/* Left Side - Single Active Title */}
              <div className="flex items-center justify-center px-4 w-1/2">
                <div className="max-w-2xl w-full">
                  <motion.h2
                    key={activeCard}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent"
                  >
                    {cardContent[activeCard].title}
                  </motion.h2>
                </div>
              </div>

              {/* Right Side - Active Content */}
              <div className="hidden lg:flex items-center justify-start w-1/2">
                <motion.div
                  key={activeCard}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="text-white max-w-xl"
                >
                  {cardContent[activeCard].content}
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
