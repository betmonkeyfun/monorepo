'use client';

interface QuickBetsProps {
  onPlaceBet: (betType: string, amount: string, useBalance: boolean) => void;
  isSpinning: boolean;
  useBalance: boolean;
}

const SIMPLE_BETS = [
  { type: 'red', label: 'RED', color: 'bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600' },
  { type: 'black', label: 'BLACK', color: 'bg-gradient-to-br from-gray-900 to-black hover:from-gray-800 hover:to-gray-900' },
  { type: 'even', label: 'EVEN', color: 'bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600' },
  { type: 'odd', label: 'ODD', color: 'bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600' },
  { type: 'low', label: '1-18', color: 'bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600' },
  { type: 'high', label: '19-36', color: 'bg-gradient-to-br from-pink-600 to-pink-700 hover:from-pink-500 hover:to-pink-600' },
];

export default function QuickBets({ onPlaceBet, isSpinning, useBalance }: QuickBetsProps) {
  const handleBet = (betType: string) => {
    if (isSpinning) return;
    onPlaceBet(betType, '0.001', useBalance);
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="grid grid-cols-6 gap-2">
        {SIMPLE_BETS.map((bet) => (
          <button
            key={bet.type}
            onClick={() => handleBet(bet.type)}
            disabled={isSpinning}
            className={`
              ${bet.color}
              ${isSpinning ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105 active:scale-95'}
              text-white font-bold py-3 px-2 rounded-lg
              transition-all duration-150 shadow-md text-sm
              border border-white/20 hover:border-white/40
              disabled:transform-none
              relative overflow-hidden
            `}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            <div className="relative">{bet.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
