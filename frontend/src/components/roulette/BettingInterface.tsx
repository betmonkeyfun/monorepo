'use client';

import { useState } from 'react';

interface BettingInterfaceProps {
  onPlaceBet: (betType: string, amount: string, useBalance: boolean) => void;
  onPlaceMultiNumberBet: (numbers: number[], amount: string, useBalance: boolean) => void;
  isSpinning: boolean;
  balance?: string;
  onWithdraw?: () => void;
}

const SIMPLE_BETS = [
  { type: 'red', label: 'Rojo', color: 'bg-red-600 hover:bg-red-700', amount: '0.001', description: '18 números rojos' },
  { type: 'black', label: 'Negro', color: 'bg-gray-900 hover:bg-black', amount: '0.001', description: '18 números negros' },
  { type: 'even', label: 'Par', color: 'bg-blue-600 hover:bg-blue-700', amount: '0.001', description: 'Números pares' },
  { type: 'odd', label: 'Impar', color: 'bg-purple-600 hover:bg-purple-700', amount: '0.001', description: 'Números impares' },
  { type: 'low', label: '1-18', color: 'bg-indigo-600 hover:bg-indigo-700', amount: '0.001', description: 'Números bajos' },
  { type: 'high', label: '19-36', color: 'bg-pink-600 hover:bg-pink-700', amount: '0.001', description: 'Números altos' },
];

// Generate number grid for roulette table (European layout)
const NUMBER_GRID = [
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
];

function getNumberColor(num: number): string {
  if (num === 0) return 'bg-green-600';
  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  return redNumbers.includes(num) ? 'bg-red-600' : 'bg-gray-900';
}

export default function BettingInterface({
  onPlaceBet,
  onPlaceMultiNumberBet,
  isSpinning,
  balance,
  onWithdraw
}: BettingInterfaceProps) {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [useBalance, setUseBalance] = useState(false);

  const handleSimpleBet = (betType: string, amount: string) => {
    if (isSpinning) return;
    onPlaceBet(betType, amount, useBalance);
  };

  const toggleNumber = (number: number) => {
    if (isSpinning) return;

    setSelectedNumbers(prev => {
      if (prev.includes(number)) {
        return prev.filter(n => n !== number);
      } else {
        return [...prev, number];
      }
    });
  };

  const placeBetOnSelectedNumbers = () => {
    if (selectedNumbers.length === 0 || isSpinning) return;

    onPlaceMultiNumberBet(selectedNumbers, '0.01', useBalance);
    setSelectedNumbers([]);
  };

  const clearSelection = () => {
    setSelectedNumbers([]);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Balance Display and Controls */}
      {balance && (
        <div className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 rounded-xl p-4 shadow-xl">
          <div className="text-center mb-3">
            <div className="text-sm text-yellow-100 font-medium">Balance del Casino</div>
            <div className="text-3xl font-bold text-white mt-1">{balance} SOL</div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-yellow-900/30 rounded-lg p-3 mb-2">
            <div className="text-sm text-yellow-100 font-medium mb-2">Método de Pago:</div>
            <div className="flex gap-3">
              <button
                onClick={() => setUseBalance(false)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  !useBalance
                    ? 'bg-white text-yellow-900 shadow-lg'
                    : 'bg-yellow-800/50 text-yellow-100 hover:bg-yellow-800'
                }`}
              >
                💳 Nueva Transacción
              </button>
              <button
                onClick={() => setUseBalance(true)}
                disabled={parseFloat(balance) <= 0}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  useBalance
                    ? 'bg-white text-yellow-900 shadow-lg'
                    : 'bg-yellow-800/50 text-yellow-100 hover:bg-yellow-800 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                💰 Usar Balance
              </button>
            </div>
          </div>

          {/* Withdraw Button */}
          {onWithdraw && parseFloat(balance) > 0 && (
            <button
              onClick={onWithdraw}
              disabled={isSpinning}
              className="w-full bg-yellow-800 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-yellow-100 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              💸 Retirar Balance
            </button>
          )}
        </div>
      )}

      {/* Simple Bets */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">💰 Apuestas Simples (0.001 SOL - Paga 1:1)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {SIMPLE_BETS.map((bet) => (
            <button
              key={bet.type}
              onClick={() => handleSimpleBet(bet.type, bet.amount)}
              disabled={isSpinning}
              className={`
                ${bet.color}
                ${isSpinning ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105 active:scale-95'}
                text-white font-bold py-4 px-6 rounded-xl
                transition-all duration-200 shadow-lg
                disabled:transform-none
              `}
            >
              <div className="text-lg">{bet.label}</div>
              <div className="text-xs opacity-75 mt-1">{bet.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Number Selection Grid */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">
            🎯 Selecciona Números (0.01 SOL - Paga 35:1)
          </h3>
          {selectedNumbers.length > 0 && (
            <button
              onClick={clearSelection}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Limpiar ({selectedNumbers.length})
            </button>
          )}
        </div>

        {/* Green/Zero Button */}
        <div className="mb-4">
          <button
            onClick={() => toggleNumber(0)}
            disabled={isSpinning}
            className={`
              ${selectedNumbers.includes(0) ? 'ring-4 ring-yellow-400 scale-105' : ''}
              ${isSpinning ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
              bg-green-600 hover:bg-green-700
              text-white font-bold py-4 px-8 rounded-xl
              transition-all duration-200 shadow-lg
              disabled:transform-none
            `}
          >
            <div className="text-2xl">0 (Verde)</div>
          </button>
        </div>

        {/* Number Grid */}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {NUMBER_GRID.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-1 mb-1">
                {row.map((number) => (
                  <button
                    key={number}
                    onClick={() => toggleNumber(number)}
                    disabled={isSpinning}
                    className={`
                      ${getNumberColor(number)}
                      ${selectedNumbers.includes(number) ? 'ring-4 ring-yellow-400 scale-110' : ''}
                      ${isSpinning ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 hover:brightness-125'}
                      text-white font-bold w-14 h-14 rounded-lg
                      transition-all duration-150 shadow-md text-lg
                      border-2 border-gray-700
                      disabled:transform-none
                    `}
                  >
                    {number}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Place Bet Button */}
        {selectedNumbers.length > 0 && (
          <div className="mt-6 p-4 bg-yellow-900/30 border border-yellow-600/50 rounded-xl">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-yellow-200 font-medium">
                  {selectedNumbers.length === 1 ? 'Apuesta Directa' : `${selectedNumbers.length} Números Seleccionados`}
                </p>
                <p className="text-yellow-100/70 text-sm">
                  Números: {selectedNumbers.sort((a, b) => a - b).join(', ')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-yellow-200 text-sm">Costo:</p>
                <p className="text-yellow-100 font-bold text-xl">
                  {(selectedNumbers.length * 0.01).toFixed(3)} SOL
                </p>
              </div>
            </div>
            <button
              onClick={placeBetOnSelectedNumbers}
              disabled={isSpinning}
              className={`
                w-full bg-gradient-to-r from-yellow-600 to-yellow-500
                hover:from-yellow-500 hover:to-yellow-400
                text-white font-bold py-4 px-6 rounded-xl
                transition-all duration-200 shadow-xl
                ${isSpinning ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105'}
                disabled:transform-none
              `}
            >
              🎲 Apostar {(selectedNumbers.length * 0.01).toFixed(3)} SOL
            </button>
          </div>
        )}

        <p className="text-gray-400 text-sm mt-4 text-center">
          💡 Click en los números para seleccionarlos. Puedes seleccionar múltiples números antes de apostar.
        </p>
      </div>

      {/* Info */}
      <div className="bg-blue-900/30 backdrop-blur-sm rounded-xl p-4 border border-blue-700/50">
        <p className="text-blue-200 text-sm text-center">
          <strong>Cómo jugar:</strong> Las apuestas simples (rojo/negro/par/impar) se envían inmediatamente.
          Para números específicos, selecciona uno o más números y luego click en "Apostar".
        </p>
      </div>
    </div>
  );
}
