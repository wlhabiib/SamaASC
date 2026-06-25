'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Plus, Users, Download, Eye, EyeOff } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with proper cookie handling for SSR
const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      storageKey: 'supabase.auth.token',
      storage: {
        getItem: (key: string) => {
          if (typeof window === 'undefined') return null
          return localStorage.getItem(key)
        },
        setItem: (key: string, value: string) => {
          if (typeof window !== 'undefined') {
            localStorage.setItem(key, value)
          }
        },
        removeItem: (key: string) => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(key)
          }
        },
      },
    },
  }
)

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      setIsInstalled(isStandalone);
    };

    checkInstalled();

    // Force logout if user arrives on login page with existing session
    const forceLogout = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase.auth.signOut();
          // Nettoyer localStorage
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('sb-') && key.includes('-auth-token')) {
              localStorage.removeItem(key);
            }
          });
          localStorage.removeItem('supabase.auth.token');
        }
      } catch (error) {
        // Ignore errors during force logout
      }
    };

    forceLogout();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Sign in with Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authError) {
        setError('Identifiants incorrects ou compte non activé. Message: ' + authError.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError('Erreur lors de la connexion');
        setLoading(false);
        return;
      }

      // Attendre que la session soit synchronisée dans les cookies
      await supabase.auth.refreshSession();

      // Wait for session sync
      await supabase.auth.refreshSession();

      // Get the session with the new tokens
      const { data: { session: freshSession } } = await supabase.auth.getSession();

      if (!freshSession) {
        setError('Erreur de synchronisation de session');
        setLoading(false);
        return;
      }

      // Store session in localStorage for client-side Supabase to find
      const sessionData = {
        access_token: freshSession.access_token,
        refresh_token: freshSession.refresh_token,
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: freshSession.user,
      };

      // Store for Supabase Auth SDK
      localStorage.setItem(
        `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1].split('.')[0]}-auth-token`,
        JSON.stringify(sessionData)
      );

      // Also sync session to server-side cookies
      try {
        const syncResponse = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            access_token: freshSession.access_token,
            refresh_token: freshSession.refresh_token 
          }),
        });

        if (!syncResponse.ok) {
          console.warn('Sync failed:', await syncResponse.text());
        }
      } catch (syncErr) {
        console.error('Sync error:', syncErr);
      }

      // Now redirect to home
      window.location.href = '/';
    } catch (err) {
      console.error('Erreur lors de la connexion:', err);
      setError('Erreur lors de la connexion');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Background with dark gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#020617] via-[#071A3D] to-[#2D0A5B]" />
      
      {/* Stadium effect */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/30 to-transparent opacity-40 blur-sm" />
      
      {/* Spotlights */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-[#22D3EE]/20 rounded-full blur-3xl" />
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#8B5CF6]/20 rounded-full blur-3xl" />
      
      {/* Particles */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#22D3EE] rounded-full animate-pulse" />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-[#3B82F6] rounded-full animate-pulse delay-100" />
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-[#8B5CF6] rounded-full animate-pulse delay-200" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#22D3EE] via-[#3B82F6] to-[#8B5CF6] rounded-2xl blur-lg opacity-50" />
            <div className="relative w-full h-full bg-gradient-to-br from-[#22D3EE]/20 via-[#3B82F6]/20 to-[#8B5CF6]/20 backdrop-blur-xl rounded-2xl border border-white/20 flex items-center justify-center shadow-2xl">
              <span className="text-5xl">⚽</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wider">SAMA ASC</h1>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <p className="text-sm text-white/70 mb-2">Connexion à votre</p>
          <h2 className="text-5xl font-black bg-gradient-to-r from-[#22D3EE] via-[#3B82F6] to-[#8B5CF6] bg-clip-text text-transparent">
            Club
          </h2>
        </div>

        {/* Subtitle */}
        <p className="text-center text-white/70 text-sm mb-8 leading-relaxed">
          Gérez votre club, vos joueurs,<br />
          vos matchs et vos finances<br />
          comme un professionnel.
        </p>

        {/* Login Form */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
          <form onSubmit={(e) => { console.log('Formulaire soumis'); handleLogin(e); }} className="space-y-6">
            <div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#22D3EE]" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#020617]/50 border border-[#22D3EE]/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/50 focus:border-[#22D3EE] backdrop-blur-sm transition-all"
                  placeholder="Email"
                  required
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#22D3EE]" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 rounded-2xl bg-[#020617]/50 border border-[#22D3EE]/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/50 focus:border-[#22D3EE] backdrop-blur-sm transition-all"
                  placeholder="Mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#22D3EE] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm backdrop-blur-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-[#22D3EE] via-[#3B82F6] to-[#8B5CF6] text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-[#22D3EE]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#22D3EE] via-[#3B82F6] to-[#8B5CF6] opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10">
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Connexion...
                  </>
                ) : (
                  <>
                    Continuer
                    <ArrowRight size={18} />
                  </>
                )}
              </span>
            </button>

            {/* Separator */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-white/20" />
              <span className="text-white/50 text-sm">ou</span>
              <div className="flex-1 h-px bg-white/20" />
            </div>

            {/* Create team button */}
            <button
              type="button"
              onClick={() => router.push('/register')}
              className="w-full flex items-center justify-center gap-2 py-4 border border-[#22D3EE]/50 text-[#22D3EE] rounded-2xl font-medium hover:bg-[#22D3EE]/10 hover:shadow-lg hover:shadow-[#22D3EE]/20 transition-all"
            >
              <Users size={18} />
              Créer une nouvelle équipe
            </button>

            {/* PWA Install button */}
            {deferredPrompt && !isInstalled && (
              <button
                type="button"
                onClick={installApp}
                className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-[#22D3EE] to-[#3B82F6] text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-[#22D3EE]/30 transition-all relative overflow-hidden group"
              >
                <Download size={18} />
                Installer l'application
              </button>
            )}

            {isInstalled && (
              <div className="w-full flex items-center justify-center gap-2 py-4 bg-green-500/20 border border-green-500/30 text-green-400 rounded-2xl font-medium">
                <Download size={18} />
                Application déjà installée
              </div>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-white/50">
              Votre ASC n'est pas encore inscrite ?{' '}
              <button
                onClick={() => router.push('/register')}
                className="text-[#22D3EE] font-medium hover:underline flex items-center justify-center gap-1"
              >
                <Plus size={14} />
                Créer une équipe
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
