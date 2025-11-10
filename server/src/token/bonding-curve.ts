/**
 * Bonding Curve Implementation for BetMonkey Token
 *
 * The token price is dynamically calculated based on the casino's SOL reserves.
 * As the casino makes more profit, the token becomes more expensive.
 * This creates natural price appreciation tied to casino performance.
 */

export interface BondingCurveParams {
  basePrice: number;           // Base price in SOL per token
  reserveBalance: number;       // Current casino SOL reserves
  targetReserve: number;        // Target reserve for 2x price
  maxPriceMultiplier: number;   // Maximum price multiplier
}

export interface TokenQuote {
  tokenAmount: number;          // How many tokens you get
  solCost: number;              // How much SOL it costs
  pricePerToken: number;        // Current price per token
  priceImpact: number;          // Price impact percentage
  reserveRatio: number;         // Current reserve ratio (0-1)
}

/**
 * Calculate current token price based on reserves
 * Uses a logarithmic curve for smooth price appreciation
 */
export function calculateTokenPrice(params: BondingCurveParams): number {
  const { basePrice, reserveBalance, targetReserve, maxPriceMultiplier } = params;

  // Reserve ratio (0 to 1)
  const ratio = Math.min(reserveBalance / targetReserve, 1);

  // Logarithmic curve: price increases more slowly at first, then accelerates
  // Formula: basePrice * (1 + (maxMultiplier - 1) * log(1 + ratio * 9) / log(10))
  const multiplier = 1 + (maxPriceMultiplier - 1) * Math.log10(1 + ratio * 9);

  return basePrice * multiplier;
}

/**
 * Calculate how many tokens you get for a given SOL amount
 * Accounts for price impact (more SOL = higher avg price)
 */
export function getTokensForSOL(
  solAmount: number,
  params: BondingCurveParams
): TokenQuote {
  const startPrice = calculateTokenPrice(params);

  // Simulate the purchase to calculate average price
  // We integrate over the curve to get the total cost
  const steps = 100;
  const reserveIncrement = solAmount / steps;
  let totalTokens = 0;

  for (let i = 0; i < steps; i++) {
    const currentReserve = params.reserveBalance + (i * reserveIncrement);
    const currentParams = { ...params, reserveBalance: currentReserve };
    const price = calculateTokenPrice(currentParams);

    // Each step buys a portion of tokens
    totalTokens += reserveIncrement / price;
  }

  const avgPrice = solAmount / totalTokens;
  const priceImpact = ((avgPrice - startPrice) / startPrice) * 100;
  const reserveRatio = params.reserveBalance / params.targetReserve;

  return {
    tokenAmount: totalTokens,
    solCost: solAmount,
    pricePerToken: startPrice,
    priceImpact,
    reserveRatio: Math.min(reserveRatio, 1)
  };
}

/**
 * Calculate how much SOL is needed to buy a specific amount of tokens
 */
export function getSOLForTokens(
  tokenAmount: number,
  params: BondingCurveParams
): TokenQuote {
  // Use binary search to find the SOL amount needed
  let low = 0;
  let high = tokenAmount * params.basePrice * params.maxPriceMultiplier * 2;
  let iterations = 0;
  const maxIterations = 50;
  const tolerance = 0.0001;

  while (iterations < maxIterations) {
    const mid = (low + high) / 2;
    const quote = getTokensForSOL(mid, params);

    if (Math.abs(quote.tokenAmount - tokenAmount) < tolerance) {
      return {
        tokenAmount,
        solCost: mid,
        pricePerToken: quote.pricePerToken,
        priceImpact: quote.priceImpact,
        reserveRatio: quote.reserveRatio
      };
    }

    if (quote.tokenAmount < tokenAmount) {
      low = mid;
    } else {
      high = mid;
    }

    iterations++;
  }

  // Fallback: use the closest approximation
  const quote = getTokensForSOL(high, params);
  return {
    tokenAmount,
    solCost: high,
    pricePerToken: quote.pricePerToken,
    priceImpact: quote.priceImpact,
    reserveRatio: quote.reserveRatio
  };
}

/**
 * Default bonding curve configuration
 */
export const DEFAULT_BONDING_CURVE: Omit<BondingCurveParams, 'reserveBalance'> = {
  basePrice: 0.000001,          // 1 millionth SOL per token (1M tokens = 1 SOL at base)
  targetReserve: 100,           // Target 100 SOL in reserves for 2x price
  maxPriceMultiplier: 10        // Max 10x price when reserves are very high
};

/**
 * Calculate market cap based on current price
 */
export function calculateMarketCap(
  totalSupply: number,
  currentPrice: number
): number {
  return totalSupply * currentPrice;
}

/**
 * Estimate future price based on projected reserves
 */
export function projectFuturePrice(
  currentReserves: number,
  projectedProfit: number,
  params: Omit<BondingCurveParams, 'reserveBalance'>
): { currentPrice: number; futurePrice: number; priceIncrease: number } {
  const currentPrice = calculateTokenPrice({
    ...params,
    reserveBalance: currentReserves
  });

  const futurePrice = calculateTokenPrice({
    ...params,
    reserveBalance: currentReserves + projectedProfit
  });

  const priceIncrease = ((futurePrice - currentPrice) / currentPrice) * 100;

  return {
    currentPrice,
    futurePrice,
    priceIncrease
  };
}
