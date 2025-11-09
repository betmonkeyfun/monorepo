/**
 * DoorReveal Component - Usage Examples
 *
 * This file demonstrates various ways to use the DoorReveal component
 * in your Next.js application.
 */

import DoorReveal from './DoorReveal';

// ============================================
// Example 1: Basic Usage (Default Props)
// ============================================
export function BasicExample() {
  return (
    <div>
      {/* Previous page content */}
      <section style={{ height: '100vh', background: '#000' }}>
        <h1>Welcome to BetMonkey Casino</h1>
      </section>

      {/* Door Reveal Effect */}
      <DoorReveal />

      {/* Content after the reveal */}
      <section style={{ height: '100vh', background: '#1a1a2e' }}>
        <h2>Casino Games</h2>
      </section>
    </div>
  );
}

// ============================================
// Example 2: Custom Background Image
// ============================================
export function CustomImageExample() {
  return (
    <DoorReveal
      bgImage="/images/casino-palace-interior.jpg"
      overlayText="Welcome to BetMonkey"
    />
  );
}

// ============================================
// Example 3: Custom Animation Settings
// ============================================
export function CustomAnimationExample() {
  return (
    <DoorReveal
      rotationAngle={130} // More dramatic opening
      scrubDuration={2} // Slower scroll
      showMarkers={false} // Enable for debugging
    />
  );
}

// ============================================
// Example 4: Multiple Door Sections
// ============================================
export function MultipleDoorExample() {
  return (
    <div>
      {/* First door reveal */}
      <DoorReveal
        bgImage="/images/casino-entrance.jpg"
        overlayText="Enter the Lobby"
      />

      {/* Some content */}
      <section style={{ height: '100vh' }}>
        <h2>Lobby Content</h2>
      </section>

      {/* Second door reveal */}
      <DoorReveal
        bgImage="/images/vip-lounge.jpg"
        overlayText="VIP Lounge"
        rotationAngle={120}
      />
    </div>
  );
}

// ============================================
// Example 5: Integration in Landing Page
// ============================================
export function LandingPageExample() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900">
        <div className="text-center text-white">
          <h1 className="text-6xl font-bold mb-4">BetMonkey Casino</h1>
          <p className="text-xl mb-8">Scroll to enter the palace</p>
          <div className="animate-bounce">↓</div>
        </div>
      </section>

      {/* Door Reveal Effect */}
      <DoorReveal
        bgImage="https://img.freepik.com/free-photo/luxury-casino-interior-with-roulette-tables_23-2148767745.jpg"
        overlayText="Enter the Palace Casino"
        rotationAngle={116}
        scrubDuration={1}
      />

      {/* Casino Content After Reveal */}
      <section className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-20">
          <h2 className="text-4xl font-bold mb-8">Our Games</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Game cards here */}
          </div>
        </div>
      </section>
    </main>
  );
}

// ============================================
// Example 6: With Dynamic Image from API
// ============================================
export function DynamicImageExample() {
  // In a real component, you'd fetch this from an API
  const casinoData = {
    backgroundImage: '/api/images/featured-casino.jpg',
    welcomeText: 'Welcome to Tonight\'s Featured Table',
  };

  return (
    <DoorReveal
      bgImage={casinoData.backgroundImage}
      overlayText={casinoData.welcomeText}
    />
  );
}

// ============================================
// Example 7: Debug Mode (Development Only)
// ============================================
export function DebugModeExample() {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <DoorReveal
      showMarkers={isDevelopment} // Show ScrollTrigger markers in dev
      bgImage="/images/test-background.jpg"
      overlayText="Debug Mode Active"
    />
  );
}

// ============================================
// HOW TO USE IN YOUR APP
// ============================================

/**
 * 1. Import the component in your page file:
 *
 *    import DoorReveal from '@/components/DoorReveal';
 *
 * 2. Add it to your page JSX:
 *
 *    export default function Home() {
 *      return (
 *        <main>
 *          <DoorReveal />
 *        </main>
 *      );
 *    }
 *
 * 3. Customize with props as needed (see examples above)
 *
 * 4. Make sure you have content before AND after the DoorReveal
 *    for the scroll trigger to work properly
 */

/**
 * PROPS REFERENCE:
 *
 * @param bgImage - Background image URL (string)
 *   Default: Freepik casino image
 *
 * @param overlayText - Text shown during door opening (string)
 *   Default: 'Enter the Palace Casino'
 *
 * @param rotationAngle - Door rotation angle in degrees (number)
 *   Default: 116
 *
 * @param scrubDuration - Animation scrub speed (number)
 *   Default: 1 (higher = slower)
 *
 * @param doorHeight - Height of door section (string)
 *   Default: '100vh'
 *
 * @param showMarkers - Show GSAP debug markers (boolean)
 *   Default: false
 */
