'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function UserRegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Redirect to Clerk sign-up since Supabase registration is disabled
    const teamSlug = searchParams.get('team');
    const redirectUrl = teamSlug ? `/sign-up?team=${teamSlug}` : '/sign-up';
    router.push(redirectUrl);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Redirection...</h2>
        <p className="text-gray-600">Vous allez être redirigé vers la page d'inscription.</p>
      </div>
    </div>
  );
}

export default function UserRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Chargement...</h2>
      </div>
    </div>}>
      <UserRegisterForm />
    </Suspense>
  );
}
