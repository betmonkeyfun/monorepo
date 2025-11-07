'use client';

interface BettingInterfaceProps {
  onPlaceBet: (betType: string, amount: string, useBalance: boolean) => void;
  isSpinning: boolean;
  balance?: string;
  useBalance: boolean;
  setUseBalance: (value: boolean) => void;
}

export default function BettingInterface({
  onPlaceBet,
  isSpinning,
  balance,
  useBalance,
  setUseBalance
}: BettingInterfaceProps) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Balance Display and Payment Source - Compact */}
      {balance && (
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border-2 border-yellow-500/30 rounded-xl p-4 shadow-lg">
          <div className="grid grid-cols-2 gap-4">
            {/* Balance */}
            <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-lg p-3">
              <div className="text-xs text-green-300 mb-1">Casino Balance</div>
              <div className="text-xl font-bold text-green-400 tabular-nums">{balance} SOL</div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-bold text-yellow-400 mb-1">
                PAYMENT SOURCE
              </label>
              <select
                value={useBalance ? 'balance' : 'wallet'}
                onChange={(e) => setUseBalance(e.target.value === 'balance')}
                disabled={parseFloat(balance) <= 0 && useBalance}
                className="w-full bg-gray-800 border border-yellow-500/50 rounded-lg px-3 py-2 text-white text-sm font-bold cursor-pointer focus:border-yellow-500 focus:outline-none transition-all appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23EAB308'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.5rem center',
                  backgroundSize: '1.2em 1.2em',
                }}
              >
                <option value="wallet" className="bg-gray-900">New Transaction</option>
                <option value="balance" className="bg-gray-900" disabled={parseFloat(balance) <= 0}>
                  Casino Balance {parseFloat(balance) <= 0 ? '(Empty)' : ''}
                </option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                {useBalance ? 'Instant bets' : 'Blockchain secured'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
