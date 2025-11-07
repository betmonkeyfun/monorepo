import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Here you would normally validate the request and create a session token
    // For now, we'll return a simple token
    const sessionToken = {
      token: `session_${Date.now()}`,
      expiresAt: Date.now() + 3600000, // 1 hour
    }

    return NextResponse.json(sessionToken)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create session token' },
      { status: 500 }
    )
  }
}
