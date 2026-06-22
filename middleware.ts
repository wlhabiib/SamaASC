import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Définir les routes publiques (accessibles sans authentification)
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/register(.*)',
  '/user-login(.*)',
  '/user-register(.*)',
  '/api/webhooks/clerk(.*)',
]);

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) {
    auth.protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
