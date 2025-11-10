export enum Suit {
  HEARTS = 'hearts',
  DIAMONDS = 'diamonds',
  CLUBS = 'clubs',
  SPADES = 'spades',
}

export enum Rank {
  TWO = '2',
  THREE = '3',
  FOUR = '4',
  FIVE = '5',
  SIX = '6',
  SEVEN = '7',
  EIGHT = '8',
  NINE = '9',
  TEN = '10',
  JACK = 'J',
  QUEEN = 'Q',
  KING = 'K',
  ACE = 'A',
}

export interface Card {
  suit: Suit;
  rank: Rank;
}

export const RANK_VALUES: Record<Rank, number> = {
  [Rank.TWO]: 2,
  [Rank.THREE]: 3,
  [Rank.FOUR]: 4,
  [Rank.FIVE]: 5,
  [Rank.SIX]: 6,
  [Rank.SEVEN]: 7,
  [Rank.EIGHT]: 8,
  [Rank.NINE]: 9,
  [Rank.TEN]: 10,
  [Rank.JACK]: 11,
  [Rank.QUEEN]: 12,
  [Rank.KING]: 13,
  [Rank.ACE]: 14,
};

export enum PokerHandRank {
  HIGH_CARD = 0,
  PAIR = 1,
  TWO_PAIR = 2,
  THREE_OF_A_KIND = 3,
  STRAIGHT = 4,
  FLUSH = 5,
  FULL_HOUSE = 6,
  FOUR_OF_A_KIND = 7,
  STRAIGHT_FLUSH = 8,
  ROYAL_FLUSH = 9,
}

export interface PokerHand {
  rank: PokerHandRank;
  name: string;
  cards: Card[];
  values: number[];
}

export interface PokerPayoutConfig {
  rank: PokerHandRank;
  name: string;
  payout: number;
  description: string;
}

export const POKER_PAYOUTS: Record<PokerHandRank, PokerPayoutConfig> = {
  [PokerHandRank.HIGH_CARD]: {
    rank: PokerHandRank.HIGH_CARD,
    name: 'High Card',
    payout: 0,
    description: 'Highest card wins',
  },
  [PokerHandRank.PAIR]: {
    rank: PokerHandRank.PAIR,
    name: 'Pair',
    payout: 1,
    description: 'Two cards of the same rank',
  },
  [PokerHandRank.TWO_PAIR]: {
    rank: PokerHandRank.TWO_PAIR,
    name: 'Two Pair',
    payout: 1,
    description: 'Two different pairs',
  },
  [PokerHandRank.THREE_OF_A_KIND]: {
    rank: PokerHandRank.THREE_OF_A_KIND,
    name: 'Three of a Kind',
    payout: 2,
    description: 'Three cards of the same rank',
  },
  [PokerHandRank.STRAIGHT]: {
    rank: PokerHandRank.STRAIGHT,
    name: 'Straight',
    payout: 3,
    description: 'Five consecutive cards',
  },
  [PokerHandRank.FLUSH]: {
    rank: PokerHandRank.FLUSH,
    name: 'Flush',
    payout: 4,
    description: 'Five cards of the same suit',
  },
  [PokerHandRank.FULL_HOUSE]: {
    rank: PokerHandRank.FULL_HOUSE,
    name: 'Full House',
    payout: 5,
    description: 'Three of a kind + pair',
  },
  [PokerHandRank.FOUR_OF_A_KIND]: {
    rank: PokerHandRank.FOUR_OF_A_KIND,
    name: 'Four of a Kind',
    payout: 10,
    description: 'Four cards of the same rank',
  },
  [PokerHandRank.STRAIGHT_FLUSH]: {
    rank: PokerHandRank.STRAIGHT_FLUSH,
    name: 'Straight Flush',
    payout: 20,
    description: 'Five consecutive cards of the same suit',
  },
  [PokerHandRank.ROYAL_FLUSH]: {
    rank: PokerHandRank.ROYAL_FLUSH,
    name: 'Royal Flush',
    payout: 50,
    description: '10-J-Q-K-A of the same suit',
  },
};

export const DEALER_QUALIFYING_HAND = PokerHandRank.PAIR;

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of Object.values(Suit)) {
    for (const rank of Object.values(Rank)) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealCards(deck: Card[], count: number): { cards: Card[]; remaining: Card[] } {
  const cards = deck.slice(0, count);
  const remaining = deck.slice(count);
  return { cards, remaining };
}

export function evaluateBestHand(cards: Card[]): PokerHand {
  if (cards.length < 5) {
    throw new Error('Need at least 5 cards to evaluate a poker hand');
  }

  const combinations = getCombinations(cards, 5);

  let bestHand: PokerHand = {
    rank: PokerHandRank.HIGH_CARD,
    name: 'High Card',
    cards: combinations[0],
    values: [],
  };

  for (const combo of combinations) {
    const hand = evaluateHand(combo);
    if (compareHands(hand, bestHand) > 0) {
      bestHand = hand;
    }
  }

  return bestHand;
}

function getCombinations(cards: Card[], size: number): Card[][] {
  if (size > cards.length) return [];
  if (size === cards.length) return [cards];
  if (size === 1) return cards.map((c) => [c]);

  const combinations: Card[][] = [];

  for (let i = 0; i <= cards.length - size; i++) {
    const head = cards[i];
    const tailCombinations = getCombinations(cards.slice(i + 1), size - 1);
    for (const tail of tailCombinations) {
      combinations.push([head, ...tail]);
    }
  }

  return combinations;
}

function evaluateHand(cards: Card[]): PokerHand {
  if (cards.length !== 5) {
    throw new Error('Hand must contain exactly 5 cards');
  }

  const sortedCards = [...cards].sort((a, b) => RANK_VALUES[b.rank] - RANK_VALUES[a.rank]);

  const isFlush = cards.every((c) => c.suit === cards[0].suit);

  const { isStraight, straightHigh } = checkStraight(sortedCards);

  const rankCounts = new Map<Rank, number>();
  for (const card of cards) {
    rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
  }

  const counts = Array.from(rankCounts.values()).sort((a, b) => b - a);
  const ranks = Array.from(rankCounts.entries())
    .sort((a, b) => {
      if (a[1] !== b[1]) return b[1] - a[1];
      return RANK_VALUES[b[0]] - RANK_VALUES[a[0]];
    })
    .map(([rank]) => RANK_VALUES[rank]);

  if (isFlush && isStraight && straightHigh === 14) {
    return {
      rank: PokerHandRank.ROYAL_FLUSH,
      name: 'Royal Flush',
      cards: sortedCards,
      values: [14],
    };
  }

  if (isFlush && isStraight) {
    return {
      rank: PokerHandRank.STRAIGHT_FLUSH,
      name: 'Straight Flush',
      cards: sortedCards,
      values: [straightHigh],
    };
  }

  if (counts[0] === 4) {
    return {
      rank: PokerHandRank.FOUR_OF_A_KIND,
      name: 'Four of a Kind',
      cards: sortedCards,
      values: ranks,
    };
  }

  if (counts[0] === 3 && counts[1] === 2) {
    return {
      rank: PokerHandRank.FULL_HOUSE,
      name: 'Full House',
      cards: sortedCards,
      values: ranks,
    };
  }

  if (isFlush) {
    return {
      rank: PokerHandRank.FLUSH,
      name: 'Flush',
      cards: sortedCards,
      values: ranks,
    };
  }

  if (isStraight) {
    return {
      rank: PokerHandRank.STRAIGHT,
      name: 'Straight',
      cards: sortedCards,
      values: [straightHigh],
    };
  }

  if (counts[0] === 3) {
    return {
      rank: PokerHandRank.THREE_OF_A_KIND,
      name: 'Three of a Kind',
      cards: sortedCards,
      values: ranks,
    };
  }

  if (counts[0] === 2 && counts[1] === 2) {
    return {
      rank: PokerHandRank.TWO_PAIR,
      name: 'Two Pair',
      cards: sortedCards,
      values: ranks,
    };
  }

  if (counts[0] === 2) {
    return {
      rank: PokerHandRank.PAIR,
      name: 'Pair',
      cards: sortedCards,
      values: ranks,
    };
  }

  return {
    rank: PokerHandRank.HIGH_CARD,
    name: 'High Card',
    cards: sortedCards,
    values: ranks,
  };
}

function checkStraight(sortedCards: Card[]): { isStraight: boolean; straightHigh: number } {
  const values = sortedCards.map((c) => RANK_VALUES[c.rank]);

  let isStraight = true;
  for (let i = 0; i < values.length - 1; i++) {
    if (values[i] - values[i + 1] !== 1) {
      isStraight = false;
      break;
    }
  }

  if (isStraight) {
    return { isStraight: true, straightHigh: values[0] };
  }

  if (values[0] === 14 && values[1] === 5 && values[2] === 4 && values[3] === 3 && values[4] === 2) {
    return { isStraight: true, straightHigh: 5 };
  }

  return { isStraight: false, straightHigh: 0 };
}

export function compareHands(hand1: PokerHand, hand2: PokerHand): number {
  if (hand1.rank !== hand2.rank) {
    return hand1.rank > hand2.rank ? 1 : -1;
  }

  for (let i = 0; i < Math.min(hand1.values.length, hand2.values.length); i++) {
    if (hand1.values[i] !== hand2.values[i]) {
      return hand1.values[i] > hand2.values[i] ? 1 : -1;
    }
  }

  return 0;
}

export function dealTexasHoldem(): {
  playerHole: Card[];
  dealerHole: Card[];
  community: Card[];
} {
  const deck = shuffleDeck(createDeck());

  const { cards: playerHole, remaining: afterPlayer } = dealCards(deck, 2);

  const { cards: dealerHole, remaining: afterDealer } = dealCards(afterPlayer, 2);

  const { cards: community } = dealCards(afterDealer, 5);

  return {
    playerHole,
    dealerHole,
    community,
  };
}

export function determineWinner(
  playerHand: PokerHand,
  dealerHand: PokerHand
): {
  winner: 'player' | 'dealer' | 'tie';
  comparison: number;
} {
  const comparison = compareHands(playerHand, dealerHand);

  if (comparison > 0) {
    return { winner: 'player', comparison };
  } else if (comparison < 0) {
    return { winner: 'dealer', comparison };
  } else {
    return { winner: 'tie', comparison };
  }
}

export function calculatePokerWinAmount(
  betAmount: string,
  playerHand: PokerHand,
  dealerHand: PokerHand,
  winner: 'player' | 'dealer' | 'tie'
): {
  winAmount: string;
  dealerQualified: boolean;
  payoutType: 'loss' | 'push' | 'ante-only' | 'ante-plus-bonus';
} {
  const amount = parseFloat(betAmount);

  if (winner === 'dealer') {
    return {
      winAmount: '0',
      dealerQualified: true,
      payoutType: 'loss',
    };
  }

  if (winner === 'tie') {
    return {
      winAmount: betAmount,
      dealerQualified: dealerHand.rank >= DEALER_QUALIFYING_HAND,
      payoutType: 'push',
    };
  }

  const dealerQualified = dealerHand.rank >= DEALER_QUALIFYING_HAND;

  if (!dealerQualified) {
    return {
      winAmount: (amount * 1).toFixed(9),
      dealerQualified: false,
      payoutType: 'ante-only',
    };
  }

  const bonusPayout = POKER_PAYOUTS[playerHand.rank].payout;
  const totalPayout = 1 + bonusPayout;

  return {
    winAmount: (amount * totalPayout).toFixed(9),
    dealerQualified: true,
    payoutType: 'ante-plus-bonus',
  };
}

export function cardToString(card: Card): string {
  return `${card.rank}${card.suit[0].toUpperCase()}`;
}

export function cardsToString(cards: Card[]): string {
  return cards.map(cardToString).join(' ');
}
