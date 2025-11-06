'use client';

import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function StickyNavbar() {
  const navRef = useRef<HTMLDivElement>(null);
  const palaceIconRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!navRef.current) return;

    // Show navbar after 60% scroll
    const showTrigger = ScrollTrigger.create({
      trigger: document.body,
      start: '60% top',
      onEnter: () => setIsVisible(true),
      onLeaveBack: () => setIsVisible(false),
    });

    return () => {
      showTrigger.kill();
    };
  }, []);

  useEffect(() => {
    if (isVisible && navRef.current) {
      gsap.fromTo(
        navRef.current,
        { y: -100, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }
      );
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 w-full bg-black/90 backdrop-blur-md border-b border-yellow-400/30 z-50 px-6 py-4"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo with animated palace icon */}
        <Link href="/" className="flex items-center gap-3 group">
          <div
            ref={palaceIconRef}
            className="text-3xl transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300"
          >
            🏰
          </div>
          <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200">
            Palace Casino
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/slots"
            className="text-white hover:text-yellow-400 transition-colors font-medium"
          >
            Slots
          </Link>
          <Link
            href="/poker"
            className="text-white hover:text-yellow-400 transition-colors font-medium"
          >
            Poker
          </Link>
          <Link
            href="/roulette"
            className="text-white hover:text-yellow-400 transition-colors font-medium"
          >
            Roulette
          </Link>
          <Link
            href="/about"
            className="text-white hover:text-yellow-400 transition-colors font-medium"
          >
            About
          </Link>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-4">
          <button className="hidden sm:block px-6 py-2 text-white hover:text-yellow-400 transition-colors font-medium">
            Login
          </button>
          <button className="px-6 py-2 bg-yellow-400 text-black font-bold rounded-full hover:bg-yellow-300 transition-colors">
            Sign Up
          </button>
        </div>
      </div>
    </nav>
  );
}
