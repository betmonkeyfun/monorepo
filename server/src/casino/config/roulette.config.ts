/**
 * Roulette Configuration
 * Definición de todas las apuestas, payouts y números
 * Ruleta Europea (37 números: 0-36)
 */

import { BetType } from '../types/index.js';

// ============================================================================
// ROULETTE NUMBERS DEFINITION
// ============================================================================

export const ROULETTE_NUMBERS = Array.from({ length: 37 }, (_, i) => i); // 0-36

export const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
export const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

export const DOZEN_1 = Array.from({ length: 12 }, (_, i) => i + 1);   // 1-12
export const DOZEN_2 = Array.from({ length: 12 }, (_, i) => i + 13);  // 13-24
export const DOZEN_3 = Array.from({ length: 12 }, (_, i) => i + 25);  // 25-36

export const COLUMN_1 = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34];
export const COLUMN_2 = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35];
export const COLUMN_3 = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36];

// ============================================================================
// BET CONFIGURATION
// ============================================================================

export interface BetTypeConfig {
  type: BetType;
  payout: number;
  probability: number;
  description: string;
  minNumbers: number;
  maxNumbers: number;
  validateNumbers: (numbers: number[]) => boolean;
}

export const BET_CONFIGS: Record<BetType, BetTypeConfig> = {
  [BetType.STRAIGHT]: {
    type: BetType.STRAIGHT,
    payout: 35,
    probability: 0.027,
    description: 'Apuesta a un número específico',
    minNumbers: 1,
    maxNumbers: 1,
    validateNumbers: (nums) => nums.length === 1 && nums[0] >= 0 && nums[0] <= 36,
  },

  [BetType.SPLIT]: {
    type: BetType.SPLIT,
    payout: 17,
    probability: 0.0541,
    description: 'Apuesta a dos números adyacentes',
    minNumbers: 2,
    maxNumbers: 2,
    validateNumbers: (nums) => {
      if (nums.length !== 2) return false;
      const [a, b] = nums.sort((x, y) => x - y);
      // Validar que sean adyacentes horizontal o verticalmente
      return (b - a === 1) || (b - a === 3);
    },
  },

  [BetType.STREET]: {
    type: BetType.STREET,
    payout: 11,
    probability: 0.0811,
    description: 'Apuesta a tres números en línea horizontal',
    minNumbers: 3,
    maxNumbers: 3,
    validateNumbers: (nums) => {
      if (nums.length !== 3) return false;
      const sorted = [...nums].sort((a, b) => a - b);
      // Verificar que sean consecutivos y empiecen en múltiplo de 3 + 1
      return sorted[2] - sorted[0] === 2 && sorted[0] % 3 === 1;
    },
  },

  [BetType.CORNER]: {
    type: BetType.CORNER,
    payout: 8,
    probability: 0.1081,
    description: 'Apuesta a cuatro números que forman un cuadro',
    minNumbers: 4,
    maxNumbers: 4,
    validateNumbers: (nums) => {
      if (nums.length !== 4) return false;
      const sorted = [...nums].sort((a, b) => a - b);
      // Verificar que formen un cuadro válido
      return (
        sorted[1] - sorted[0] === 1 &&
        sorted[2] - sorted[0] === 3 &&
        sorted[3] - sorted[1] === 3
      );
    },
  },

  [BetType.LINE]: {
    type: BetType.LINE,
    payout: 5,
    probability: 0.1622,
    description: 'Apuesta a seis números (dos calles adyacentes)',
    minNumbers: 6,
    maxNumbers: 6,
    validateNumbers: (nums) => {
      if (nums.length !== 6) return false;
      const sorted = [...nums].sort((a, b) => a - b);
      // Verificar que sean dos calles consecutivas
      return sorted[5] - sorted[0] === 5 && sorted[0] % 3 === 1;
    },
  },

  [BetType.DOZEN]: {
    type: BetType.DOZEN,
    payout: 2,
    probability: 0.3243,
    description: 'Apuesta a una docena (1-12, 13-24, 25-36)',
    minNumbers: 12,
    maxNumbers: 12,
    validateNumbers: (nums) => {
      if (nums.length !== 12) return false;
      const sorted = [...nums].sort((a, b) => a - b);
      const first = sorted[0];
      return (
        (first === 1 && sorted[11] === 12) ||
        (first === 13 && sorted[11] === 24) ||
        (first === 25 && sorted[11] === 36)
      );
    },
  },

  [BetType.COLUMN]: {
    type: BetType.COLUMN,
    payout: 2,
    probability: 0.3243,
    description: 'Apuesta a una columna (12 números)',
    minNumbers: 12,
    maxNumbers: 12,
    validateNumbers: (nums) => {
      if (nums.length !== 12) return false;
      const sorted = [...nums].sort((a, b) => a - b);
      // Verificar que sea una columna válida
      return (
        JSON.stringify(sorted) === JSON.stringify(COLUMN_1) ||
        JSON.stringify(sorted) === JSON.stringify(COLUMN_2) ||
        JSON.stringify(sorted) === JSON.stringify(COLUMN_3)
      );
    },
  },

  [BetType.RED]: {
    type: BetType.RED,
    payout: 1,
    probability: 0.4864,
    description: 'Apuesta a todos los números rojos',
    minNumbers: 18,
    maxNumbers: 18,
    validateNumbers: (nums) => {
      if (nums.length !== 18) return false;
      return JSON.stringify([...nums].sort((a, b) => a - b)) === JSON.stringify(RED_NUMBERS);
    },
  },

  [BetType.BLACK]: {
    type: BetType.BLACK,
    payout: 1,
    probability: 0.4864,
    description: 'Apuesta a todos los números negros',
    minNumbers: 18,
    maxNumbers: 18,
    validateNumbers: (nums) => {
      if (nums.length !== 18) return false;
      return JSON.stringify([...nums].sort((a, b) => a - b)) === JSON.stringify(BLACK_NUMBERS);
    },
  },

  [BetType.EVEN]: {
    type: BetType.EVEN,
    payout: 1,
    probability: 0.4864,
    description: 'Apuesta a todos los números pares',
    minNumbers: 18,
    maxNumbers: 18,
    validateNumbers: (nums) => {
      if (nums.length !== 18) return false;
      return nums.every(n => n !== 0 && n % 2 === 0) && nums.length === 18;
    },
  },

  [BetType.ODD]: {
    type: BetType.ODD,
    payout: 1,
    probability: 0.4864,
    description: 'Apuesta a todos los números impares',
    minNumbers: 18,
    maxNumbers: 18,
    validateNumbers: (nums) => {
      if (nums.length !== 18) return false;
      return nums.every(n => n % 2 === 1) && nums.length === 18;
    },
  },

  [BetType.LOW]: {
    type: BetType.LOW,
    payout: 1,
    probability: 0.4864,
    description: 'Apuesta a números bajos (1-18)',
    minNumbers: 18,
    maxNumbers: 18,
    validateNumbers: (nums) => {
      if (nums.length !== 18) return false;
      return nums.every(n => n >= 1 && n <= 18);
    },
  },

  [BetType.HIGH]: {
    type: BetType.HIGH,
    payout: 1,
    probability: 0.4864,
    description: 'Apuesta a números altos (19-36)',
    minNumbers: 18,
    maxNumbers: 18,
    validateNumbers: (nums) => {
      if (nums.length !== 18) return false;
      return nums.every(n => n >= 19 && n <= 36);
    },
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getWinningNumbers(result: number): {
  straight: number[];
  red: boolean;
  black: boolean;
  even: boolean;
  odd: boolean;
  low: boolean;
  high: boolean;
  dozen: number;
  column: number;
} {
  return {
    straight: [result],
    red: RED_NUMBERS.includes(result),
    black: BLACK_NUMBERS.includes(result),
    even: result !== 0 && result % 2 === 0,
    odd: result % 2 === 1,
    low: result >= 1 && result <= 18,
    high: result >= 19 && result <= 36,
    dozen: result === 0 ? 0 : Math.ceil(result / 12),
    column: result === 0 ? 0 : ((result - 1) % 3) + 1,
  };
}

export function spinRoulette(): number {
  return Math.floor(Math.random() * 37); // 0-36
}

export function checkWin(betNumbers: number[], result: number): boolean {
  return betNumbers.includes(result);
}

export function calculateWinAmount(betAmount: string, payout: number): string {
  const amount = parseFloat(betAmount);
  return (amount * payout).toFixed(9);
}
