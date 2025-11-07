import Link from 'next/link';

export default function RoulettePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900 via-red-800 to-black flex items-center justify-center px-4">
      <div className="max-w-4xl text-center">
        <div className="text-9xl mb-8 animate-pulse">🎲</div>
        <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-400 mb-6">
          Roulette
        </h1>
        <p className="text-2xl text-white/80 mb-12">
          Place your bets and spin the wheel! Coming soon...
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
