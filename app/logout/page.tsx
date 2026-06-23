'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      try {
        // Appeler l'API de déconnexion pour nettoyer les cookies serveur
        await fetch('/api/auth/logout', { method: 'POST' });
        
        // Déconnexion Supabase
        await supabase.auth.signOut();
        
        // Nettoyer TOUTES les clés Supabase dans localStorage
        if (typeof window !== 'undefined') {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('sb-') && key.includes('-auth-token')) {
              localStorage.removeItem(key);
            }
          });
          localStorage.removeItem('supabase.auth.token');
        }
        
        // Nettoyer tous les cookies
        document.cookie.split(';').forEach(cookie => {
          const cookieName = cookie.split('=')[0].trim();
          if (cookieName.startsWith('sb-')) {
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          }
        });
        
        // Redirection vers login
        window.location.href = '/login';
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        // En cas d'erreur, quand même rediriger
        window.location.href = '/login';
      }
    };

    performLogout();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#071A3D] to-[#2D0A5B] flex items-center justify-center">
      <div className="text-white text-center">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p>Déconnexion en cours...</p>
      </div>
    </div>
  );
}
