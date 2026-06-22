import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  console.log('🔐 /api/auth/sync endpoint called');
  
  try {
    const body = await req.json();
    console.log('📨 Request body received:', { hasAccessToken: !!body.access_token });
    
    const { access_token, refresh_token } = body;

    if (!access_token) {
      console.warn('⚠️ No access token provided');
      return NextResponse.json(
        { error: 'No access token provided' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    
    // Set secure cookies with the tokens
    // Supabase SSR expects specific cookie names
    const tokenData = {
      access_token,
      refresh_token,
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: null
    };
    
    console.log('🍪 Setting auth cookie...');
    cookieStore.set('sb-dsxpdonaziczmkzhjzdw-auth-token', JSON.stringify(tokenData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600,
      path: '/'
    });

    console.log('✅ Session synced to cookies successfully');
    return NextResponse.json({ 
      success: true,
      message: 'Session synced to cookies'
    });

  } catch (error) {
    console.error('❌ Error syncing session:', error);
    return NextResponse.json(
      { error: 'Failed to sync session', details: String(error) },
      { status: 500 }
    );
  }
}
