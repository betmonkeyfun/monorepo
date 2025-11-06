import Link from 'next/link';

export default function SlotsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-black flex items-center justify-center px-4">
      <div className="max-w-4xl text-center">
        <div className="text-9xl mb-8 animate-pulse">🎰</div>
        <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-400 mb-6">
          Slots
        </h1>
        <p className="text-2xl text-white/80 mb-12">
          Spin the reels and win big! Coming soon...
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-4 bg-yellow-400 text-black font-bold rounded-full hover:bg-yellow-300 transition-colors text-lg"
        >
          Back to Palace
        </Link>
      </div>
    </div>
  );
}
