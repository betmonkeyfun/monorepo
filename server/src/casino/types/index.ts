/**
 * Casino Type Definitions
 * Clean, type-safe interfaces for the casino system
 */

import { z } from 'zod';

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  id: string;
  walletAddress: string;
  username: string;
  createdAt: number;
  lastLoginAt: number;
}

export const CreateUserSchema = z.object({
  walletAddress: z.string().min(32).max(44),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;

// ============================================================================
// WALLET TYPES
// ============================================================================

export interface Wallet {
  userId: string;
  balance: string; // String to handle large numbers precisely
  lockedBalance: string;
  updatedAt: number;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdraw' | 'bet' | 'win' | 'loss';
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  transactionSignature?: string;
  metadata?: string;
  createdAt: number;
}

export const DepositSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d+)?$/),
  transactionSignature: z.string().min(64),
});

export const WithdrawSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d+)?$/),
  destinationAddress: z.string().min(32).max(44),
});

export type DepositDto = z.infer<typeof DepositSchema>;
export type WithdrawDto = z.infer<typeof WithdrawSchema>;

// ============================================================================
// ROULETTE TYPES
// ============================================================================

export enum BetType {
  STRAIGHT = 'straight',           // Pleno - 1 número
  SPLIT = 'split',                 // Caballo - 2 números
  STREET = 'street',               // Calle - 3 números
  CORNER = 'corner',               // Cuadro - 4 números
  LINE = 'line',                   // Seisena - 6 números
  DOZEN = 'dozen',                 // Docena - 12 números
  COLUMN = 'column',               // Columna - 12 números
  RED = 'red',                     // Rojo - 18 números
  BLACK = 'black',                 // Negro - 18 números
  EVEN = 'even',                   // Par - 18 números
  ODD = 'odd',                     // Impar - 18 números
  LOW = 'low',                     // 1-18
  HIGH = 'high',                   // 19-36
}

export interface BetConfig {
  type: BetType;
  payout: number;      // Multiplicador de pago (35, 17, 11, 8, 5, 2, 1)
  probability: number; // Probabilidad real en ruleta europea
  numbers: number[];   // Números cubiertos por la apuesta
}

export interface Bet {
  id: string;
  gameId: string;
  userId: string;
  type: BetType;
  numbers: number[];
  amount: string;
  payout: number;
  result: 'pending' | 'win' | 'loss';
  winAmount: string;
  createdAt: number;
}

export interface Game {
  id: string;
  userId: string;
  result: number;      // Número ganador (0-36)
  totalBetAmount: string;
  totalWinAmount: string;
  profit: string;      // Ganancia/pérdida del usuario (positivo = ganó, negativo = perdió)
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: number;
  completedAt?: number;
}

export const PlaceBetSchema = z.object({
  bets: z.array(z.object({
    type: z.nativeEnum(BetType),
    numbers: z.array(z.number().int().min(0).max(36)),
    amount: z.string().regex(/^\d+(\.\d+)?$/),
  })).min(1).max(20), // Máximo 20 apuestas por juego
});

export type PlaceBetDto = z.infer<typeof PlaceBetSchema>;

// ============================================================================
// POKER TYPES
// ============================================================================

import type { Card, PokerHand } from '../config/poker.config.js';

export interface PokerGame {
  id: string;
  userId: string;
  gameType: 'texas-holdem';
  playerHole: Card[];        // Player's 2 hole cards
  dealerHole: Card[];        // Dealer's 2 hole cards
  community: Card[];         // 5 community cards
  playerHand: PokerHand;     // Best 5-card hand for player
  dealerHand: PokerHand;     // Best 5-card hand for dealer
  betAmount: string;
  winAmount: string;
  profit: string;            // Positive = player won, negative = player lost, 0 = tie
  winner: 'player' | 'dealer' | 'tie';
  dealerQualified: boolean;  // Did dealer have at least a Pair?
  payoutType: 'loss' | 'push' | 'ante-only' | 'ante-plus-bonus';
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: number;
  completedAt?: number;
}

export const PlacePokerBetSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d+)?$/),
});

export type PlacePokerBetDto = z.infer<typeof PlacePokerBetSchema>;

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class CasinoError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'CasinoError';
  }
}

export class InsufficientFundsError extends CasinoError {
  constructor(required: string, available: string) {
    super(
      `Insufficient funds. Required: ${required} SOL, Available: ${available} SOL`,
      'INSUFFICIENT_FUNDS',
      402
    );
  }
}

export class InvalidBetError extends CasinoError {
  constructor(message: string) {
    super(message, 'INVALID_BET', 400);
  }
}

export class UserNotFoundError extends CasinoError {
  constructor(identifier: string) {
    super(`User not found: ${identifier}`, 'USER_NOT_FOUND', 404);
  }
}
