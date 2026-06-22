import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(req: NextRequest) {
  const { accessToken } = await req.json()

  if (!accessToken) {
    return NextResponse.json({ error: 'No token provided' }, { status: 400 })
  }

  // Set the session in cookies via the response
  const res = NextResponse.json({ success: true })
  
  // Set auth token in cookies so middleware can read it
  res.cookies.set({
    name: `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('.')[0]}-auth-token`,
    value: JSON.stringify({
      access_token: accessToken,
      token_type: 'bearer',
    }),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  })

  return res
}

