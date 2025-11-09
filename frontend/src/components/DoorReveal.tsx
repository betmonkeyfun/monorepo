'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRef, useEffect } from 'react';
import styles from './DoorReveal.module.css';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export interface DoorRevealProps {
  /**
   * Background image URL to reveal behind the doors
   * @default 'https://img.freepik.com/free-photo/luxury-casino-interior-with-roulette-tables_23-2148767745.jpg'
   */
  bgImage?: string;

  /**
   * Left door image URL
   * @default Versailles palace door
   */
  leftDoorImage?: string;

  /**
   * Right door image URL
   * @default Versailles palace door (mirrored)
   */
  rightDoorImage?: string;

  /**
   * Text to display as overlay during door opening
   * @default 'Enter the Palace Casino'
   */
  overlayText?: string;

  /**
   * Door opening rotation angle in degrees
   * @default 116
   */
  rotationAngle?: number;

  /**
   * Animation duration (scrub speed)
   * @default 1
   */
  scrubDuration?: number;

  /**
   * Height of the door section
   * @default '100vh'
   */
  doorHeight?: string;

  /**
   * Show debug markers for ScrollTrigger
   * @default false
   */
  showMarkers?: boolean;
}

export default function DoorReveal({
  bgImage = 'https://img.freepik.com/free-photo/luxury-casino-interior-with-roulette-tables_23-2148767745.jpg',
  leftDoorImage,
  rightDoorImage,
  overlayText = 'Enter the Palace Casino',
  rotationAngle = 116,
  scrubDuration = 1,
  doorHeight = '100vh',
  showMarkers = false,
}: DoorRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftDoorRef = useRef<HTMLDivElement>(null);
  const rightDoorRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;

    // Create timeline with ScrollTrigger based on document scroll
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: document.body,
        start: 'top top',
        end: '+=200vh',
        scrub: scrubDuration,
        markers: showMarkers,
      },
    });

    // Set initial state
    gsap.set(containerRef.current, { scale: 1, opacity: 1 });
    gsap.set(leftDoorRef.current, { rotationY: 0, z: 30 });
    gsap.set(rightDoorRef.current, { rotationY: 0, z: 30 });
    gsap.set(overlayRef.current, { opacity: 0, scale: 1 });

    // Zoom into the entire door container while doors open
    tl.to(
      containerRef.current,
      {
        scale: 3,
        ease: 'power2.inOut',
      },
      0
    );

    // Animate left door opening
    tl.to(
      leftDoorRef.current,
      {
        rotationY: -rotationAngle,
        z: 30,
        transformOrigin: 'left center',
        ease: 'power2.inOut',
      },
      0
    );

    // Animate right door opening
    tl.to(
      rightDoorRef.current,
      {
        rotationY: rotationAngle,
        z: 30,
        transformOrigin: 'right center',
        ease: 'power2.inOut',
      },
      0
    );

    // Fade in overlay text
    tl.to(
      overlayRef.current,
      {
        opacity: 1,
        scale: 1.2,
        ease: 'power1.in',
      },
      0.3
    );

    // Fade out overlay text
    tl.to(
      overlayRef.current,
      {
        opacity: 0,
        ease: 'power1.out',
      },
      0.7
    );

    // Fade out the entire container
    tl.to(
      containerRef.current,
      {
        opacity: 0,
        ease: 'power1.out',
      },
      0.85
    );
  });

  // Cleanup ScrollTrigger on unmount
  useEffect(() => {
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className={styles.doorWrapper}
      style={{ height: doorHeight }}
    >
      {/* Door Container */}
      <div className={styles.doorContainer}>
        {/* Left Door Panel */}
        <div
          ref={leftDoorRef}
          className={`${styles.door} ${styles.leftDoor}`}
          style={leftDoorImage ? {
            backgroundImage: `url(${leftDoorImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center right',
            backgroundRepeat: 'no-repeat',
          } : undefined}
        >
          <div className={styles.doorPanel}>
            {/* Ornate door design elements */}
            {!leftDoorImage && (
              <>
                <div className={styles.doorFrame} />
                <div className={styles.doorOrnament} />
              </>
            )}
          </div>
        </div>

        {/* Right Door Panel */}
        <div
          ref={rightDoorRef}
          className={`${styles.door} ${styles.rightDoor}`}
          style={rightDoorImage ? {
            backgroundImage: `url(${rightDoorImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center left',
            backgroundRepeat: 'no-repeat',
          } : undefined}
        >
          <div className={styles.doorPanel}>
            {/* Ornate door design elements */}
            {!rightDoorImage && (
              <>
                <div className={styles.doorFrame} />
                <div className={styles.doorOrnament} />
              </>
            )}
          </div>
        </div>

        {/* Overlay Text */}
        <div ref={overlayRef} className={styles.overlayText}>
          {overlayText}
        </div>
      </div>
    </section>
  );
}
