'use client';

import { useState, useEffect } from 'react';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWithdraw: (amount: string) => Promise<void>;
  balance: string;
}

export default function WithdrawModal({ isOpen, onClose, onWithdraw, balance }: WithdrawModalProps) {
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setAmount('');
      setError('');
      setSuccess(false);
      setIsProcessing(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (withdrawAmount > parseFloat(balance)) {
      setError('Insufficient balance');
      return;
    }

    setIsProcessing(true);
    try {
      await onWithdraw(amount);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Withdrawal failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const setMaxAmount = () => {
    setAmount(balance);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md transform transition-all">
        <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black border-4 border-yellow-500/50 rounded-3xl shadow-2xl overflow-hidden">
          {/* Animated glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-red-500/20 to-yellow-500/20 animate-pulse" />

          <div className="relative p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 bg-clip-text text-transparent mb-2">
                Cash Out
              </h2>
              <p className="text-gray-400">Withdraw your winnings to your wallet</p>
            </div>

            {/* Available Balance */}
            <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-2 border-green-500/50 rounded-xl p-4 mb-6">
              <div className="text-sm text-green-300 mb-1">Available Balance</div>
              <div className="text-3xl font-bold text-green-400">{balance} SOL</div>
            </div>

            {success ? (
              <div className="text-center py-8">
                <h3 className="text-2xl font-bold text-green-400 mb-2">Success!</h3>
                <p className="text-gray-300">Your withdrawal is being processed</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Amount Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Withdrawal Amount (SOL)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      max={balance}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-gray-800/50 border-2 border-yellow-500/30 rounded-xl px-4 py-3 text-white text-lg focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all"
                      placeholder="0.000"
                      disabled={isProcessing}
                    />
                    <button
                      type="button"
                      onClick={setMaxAmount}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1 rounded-lg text-sm font-bold transition-all transform hover:scale-105"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-4 bg-red-900/50 border-2 border-red-500 rounded-xl p-3 text-red-300 text-sm">
                    {error}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isProcessing}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-105"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing || !amount}
                    className="flex-1 bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-400 hover:to-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-yellow-500/50"
                  >
                    {isProcessing ? 'Processing...' : 'Withdraw'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
