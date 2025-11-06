'use client';

import { useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ScrollSections from '@/components/ScrollSections';
import StickyNavbar from '@/components/StickyNavbar';

// Dynamically import Palace3D to avoid SSR issues
const Palace3D = dynamic(() => import('@/components/Palace3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-b from-purple-900 to-black">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-pulse">🎰</div>
        <p className="text-white text-xl font-bold">Loading Palace Casino...</p>
      </div>
    </div>
  ),
});

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Home() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const scrollProgress = useRef<number>(0);

  useEffect(() => {
    // Pin the 3D canvas during scroll (0-60%)
    const pinTrigger = ScrollTrigger.create({
      trigger: canvasContainerRef.current,
      start: 'top top',
      end: '60% top',
      pin: true,
      pinSpacing: false,
      scrub: true,
      markers: false, // Set to true for debugging
      onUpdate: (self) => {
        scrollProgress.current = self.progress;
      },
    });

    // Fade out the canvas after 60%
    if (canvasContainerRef.current) {
      gsap.to(canvasContainerRef.current, {
        opacity: 0,
        scrollTrigger: {
          trigger: canvasContainerRef.current,
          start: '60% top',
          end: '80% top',
          scrub: true,
        },
      });
    }

    // Smooth scrolling
    const lenis = () => {
      window.scrollTo({
        behavior: 'smooth',
      });
    };

    return () => {
      pinTrigger.kill();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <main className="relative bg-black">
      {/* Sticky Navbar - appears after 60% scroll */}
      <StickyNavbar />

      {/* 3D Canvas Container - Pinned during scroll */}
      <div
        ref={canvasContainerRef}
        className="fixed top-0 left-0 w-full h-screen z-0"
        style={{
          background: 'linear-gradient(to bottom, #1a0033, #000000)',
        }}
      >
        <Palace3D scrollProgress={scrollProgress} />
      </div>

      {/* Scroll Content - Overlays on top of 3D scene */}
      <div className="relative z-10">
        <ScrollSections />
      </div>

      {/* Scroll Indicator - Only show at the beginning */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-20 animate-bounce">
        <div className="flex flex-col items-center gap-2">
          <span className="text-white/70 text-sm font-medium">Scroll to explore</span>
          <svg
            className="w-6 h-6 text-yellow-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </div>
    </main>
  );
}
