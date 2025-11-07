import { Address } from 'viem'
import { paymentMiddleware, Network } from 'x402-next'
import { NextRequest } from 'next/server'

const address = process.env.NEXT_PUBLIC_RECEIVER_ADDRESS as Address
const network = process.env.NEXT_PUBLIC_NETWORK as Network
const facilitatorUrl = process.env.NEXT_PUBLIC_FACILITATOR_URL as string
const cdpClientKey = process.env.NEXT_PUBLIC_CDP_CLIENT_KEY as string

const x402PaymentMiddleware = paymentMiddleware(
  address,
  {
    '/play/quick': {
      price: '$0.001',
      config: {
        description: 'Quick roulette bet (red/black/even/odd)',
      },
      network,
    },
    '/play/custom': {
      price: '$0.01',
      config: {
        description: 'Custom roulette bet (numbers)',
      },
      network,
    },
  },
  {
    url: facilitatorUrl,
  },
  {
    cdpClientKey,
    appLogo: '/betmonkey-logo.png',
    appName: 'BetMonkey Casino',
    sessionTokenEndpoint: '/api/x402/session-token',
  },
)

export const middleware = (req: NextRequest) => {
  const delegate = x402PaymentMiddleware as unknown as (
    request: NextRequest,
  ) => ReturnType<typeof x402PaymentMiddleware>
  return delegate(req)
}

// Configure which paths the middleware should run on
// Temporarily disabled to allow direct API calls
export const config = {
  matcher: [
    // '/play/quick',
    // '/play/custom',
  ],
}
