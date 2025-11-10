import { motion } from 'framer-motion';

interface PlayingCardProps {
  card: string; // Format: "AH" (Ace of Hearts), "KS" (King of Spades), etc.
  isRevealed?: boolean;
  delay?: number;
}

const SUIT_SYMBOLS = {
  H: '♥',
  D: '♦',
  C: '♣',
  S: '♠',
};

const SUIT_COLORS = {
  H: 'text-red-600',
  D: 'text-red-600',
  C: 'text-black',
  S: 'text-black',
};

export default function PlayingCard({ card, isRevealed = true, delay = 0 }: PlayingCardProps) {
  if (!isRevealed || !card) {
    // Card back
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay, duration: 0.3 }}
        className="w-24 h-36 bg-gradient-to-br from-blue-700 to-blue-900 rounded-lg shadow-2xl border-2 border-yellow-600 flex items-center justify-center relative overflow-hidden"
      >
        {/* Card back pattern */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(255,255,255,0.2) 10px,
            rgba(255,255,255,0.2) 20px
          )`
        }} />
        <div className="absolute inset-4 border-4 border-yellow-500 rounded-md flex items-center justify-center">
          <div className="text-5xl opacity-50">🎴</div>
        </div>
      </motion.div>
    );
  }

  // Parse card string (e.g., "AS" = Ace of Spades)
  const rank = card.slice(0, -1);
  const suit = card.slice(-1).toUpperCase() as keyof typeof SUIT_SYMBOLS;
  const suitSymbol = SUIT_SYMBOLS[suit] || '?';
  const suitColor = SUIT_COLORS[suit] || 'text-gray-500';

  // Display rank
  const displayRank = rank;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ scale: 1.05, rotateZ: 2 }}
      className="w-24 h-36 bg-white rounded-lg shadow-2xl border-2 border-gray-300 relative overflow-hidden cursor-pointer select-none"
    >
      {/* Top left corner */}
      <div className={`absolute top-2 left-2 flex flex-col items-center ${suitColor} font-bold`}>
        <div className="text-2xl leading-none">{displayRank}</div>
        <div className="text-2xl leading-none mt-0.5">{suitSymbol}</div>
      </div>

      {/* Center suit symbol */}
      <div className={`absolute inset-0 flex items-center justify-center ${suitColor}`}>
        <div className="text-7xl opacity-15">{suitSymbol}</div>
      </div>

      {/* Bottom right corner (upside down) */}
      <div className={`absolute bottom-2 right-2 flex flex-col-reverse items-center ${suitColor} font-bold rotate-180`}>
        <div className="text-2xl leading-none">{displayRank}</div>
        <div className="text-2xl leading-none mt-0.5">{suitSymbol}</div>
      </div>

      {/* Card shine effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Subtle shadow for depth */}
      <div className="absolute inset-0 shadow-inner rounded-lg pointer-events-none" />
    </motion.div>
  );
}
