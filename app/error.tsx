'use client';

import { useRouter } from 'next/navigation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  console.error('Application error:', error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-white">
          Une erreur est survenue
        </h1>
        
        <p className="text-gray-400">
          Cette page n'a pas pu charger. Veuillez réessayer.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full py-3 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-medium transition-colors"
          >
            Réessayer
          </button>
          
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="text-sm text-gray-500 hover:text-gray-400 transition-colors"
        >
          Recharger la page
        </button>
      </div>
    </div>
  );
}
