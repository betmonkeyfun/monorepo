import { NextRequest, NextResponse } from 'next/server'

const CASINO_API_URL = process.env.NEXT_PUBLIC_CASINO_API_URL || 'http://localhost:3003'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bets } = body

    // Get payment headers added by x402 middleware
    const paymentSignature = request.headers.get('x-payment-signature')
    const paymentPublicKey = request.headers.get('x-payment-public-key')

    // Forward custom bet request to casino backend
    const response = await fetch(`${CASINO_API_URL}/api/roulette/play`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(paymentSignature && { 'x-payment-signature': paymentSignature }),
        ...(paymentPublicKey && { 'x-payment-public-key': paymentPublicKey }),
      },
      body: JSON.stringify({ bets }),
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(error, { status: response.status })
    }

    const result = await response.json()

    // Transform backend response to match frontend expectations
    return NextResponse.json({
      game: {
        winningNumber: result.data.result,
        totalWinAmount: result.data.totalWin,
        totalBetAmount: result.data.totalBet,
      },
      won: result.data.won,
      message: result.data.message,
    })
  } catch (error: any) {
    console.error('Custom bet error:', error)
    return NextResponse.json(
      { error: 'Bet failed', message: error.message },
      { status: 500 }
    )
  }
}
