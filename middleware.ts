// @deprecated: Using middleware pattern. Consider using App Router API routes instead.
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Skip API routes - they should handle their own auth
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const res = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          res.cookies.delete({
            name,
            ...options,
          })
        },
      },
    }
  )

  // Try to get session from cookies first
  let {
    data: { session },
  } = await supabase.auth.getSession()

  // If no session in cookies, try to get from Authorization header (for fresh logins)
  if (!session) {
    const authHeader = req.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        // This will set the session from the token
        const { data: { user }, error } = await supabase.auth.getUser(token)
        if (user && !error) {
          session = { user, access_token: token } as any
        }
      } catch (err) {
        // Silently fail - let the normal flow continue
      }
    }
  }

  // Routes publiques (accessibles sans authentification)
  const publicRoutes = ['/login', '/register', '/create-team']
  const isPublicRoute = publicRoutes.some(route => req.nextUrl.pathname.startsWith(route))

  if (!session && !isPublicRoute) {
    // Rediriger vers la page de connexion si pas de session et route non publique
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (session && isPublicRoute && req.nextUrl.pathname !== '/create-team') {
    // Rediriger vers l'accueil si session et route publique (sauf create-team)
    return NextResponse.redirect(new URL('/', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
