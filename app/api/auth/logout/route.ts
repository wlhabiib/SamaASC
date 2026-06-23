import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Remove ALL Supabase auth cookies
    const allCookies = cookieStore.getAll();
    allCookies.forEach(cookie => {
      if (cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')) {
        cookieStore.delete(cookie.name);
      }
    });
    
    // Also clear the specific cookie
    cookieStore.delete('sb-dsxpdonaziczmkzhjzdw-auth-token');
    
    // Create response with cleared cookies
    const response = NextResponse.json({ success: true });
    
    // Clear cookies in response as well
    allCookies.forEach(cookie => {
      if (cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')) {
        response.cookies.delete(cookie.name);
      }
    });
    
    return response;
  } catch (error) {
    console.error('Error logging out:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
