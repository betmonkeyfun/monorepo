'use client';

interface QuickBetsProps {
  onPlaceBet: (betType: string, amount: string, useBalance: boolean) => void;
  isSpinning: boolean;
  useBalance: boolean;
}

const SIMPLE_BETS = [
  { type: 'red', label: 'RED', color: 'from-red-600 to-red-500', borderColor: 'border-red-500', glow: 'hover:shadow-red-500/50' },
  { type: 'black', label: 'BLACK', color: 'from-gray-800 to-gray-900', borderColor: 'border-gray-600', glow: 'hover:shadow-gray-500/50' },
  { type: 'even', label: 'EVEN', color: 'from-blue-600 to-blue-500', borderColor: 'border-blue-500', glow: 'hover:shadow-blue-500/50' },
  { type: 'odd', label: 'ODD', color: 'from-purple-600 to-purple-500', borderColor: 'border-purple-500', glow: 'hover:shadow-purple-500/50' },
  { type: 'low', label: '1-18', color: 'from-indigo-600 to-indigo-500', borderColor: 'border-indigo-500', glow: 'hover:shadow-indigo-500/50' },
  { type: 'high', label: '19-36', color: 'from-pink-600 to-pink-500', borderColor: 'border-pink-500', glow: 'hover:shadow-pink-500/50' },
];

export default function QuickBets({ onPlaceBet, isSpinning, useBalance }: QuickBetsProps) {
  const handleBet = (betType: string) => {
    if (isSpinning) return;
    onPlaceBet(betType, '0.001', useBalance);
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {SIMPLE_BETS.map((bet) => (
          <button
            key={bet.type}
            onClick={() => handleBet(bet.type)}
            disabled={isSpinning}
            className={`
              group relative
              bg-gradient-to-br ${bet.color}
              ${isSpinning ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105 active:scale-95 hover:shadow-2xl'}
              text-white font-black py-4 px-4 rounded-xl
              transition-all duration-200 shadow-lg
              border-2 ${bet.borderColor} ${bet.glow}
              disabled:transform-none
              overflow-hidden
            `}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent group-hover:from-black/10" />
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            <div className="relative text-base tracking-wider">{bet.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
