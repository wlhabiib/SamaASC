'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, User, ArrowRight } from 'lucide-react';

function UserLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [teamSlug, setTeamSlug] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const slug = searchParams.get('team');
    setTeamSlug(slug);
    
    if (!slug) {
      router.push('/login');
    }
  }, [router, searchParams]);

  if (!mounted || !teamSlug) {
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Supabase removed - Login disabled
      setError('Connexion non disponible - Supabase supprimé');
      setLoading(false);
      return;

      // if (!supabase) {
      //   setError('Erreur de connexion');
      //   setLoading(false);
      //   return;
      // }

      // Sign in with Supabase Auth - DISABLED (Supabase removed)
      // const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      //   email: username,
      //   password: password,
      // });

      // if (authError) {
      //   setError('Identifiants incorrects');
      //   setLoading(false);
      //   return;
      // }

      // if (!authData.user) {
      //   setError('Erreur lors de la connexion');
      //   setLoading(false);
      //   return;
      // }

      // Redirect to Clerk sign-in since Supabase is disabled
      router.push('/sign-in');
      return;

      // Get team by slug - DISABLED (Supabase removed)
      // const { data: team, error: teamError } = await supabase
      //   .from('teams')
      //   .select('*')
      //   .eq('slug', teamSlug)
      //   .single();

      // if (teamError || !team) {
      //   setError('Équipe non trouvée');
      //   setLoading(false);
      //   return;
      // }

      // Get user from custom users table using Supabase Auth user ID - DISABLED (Supabase removed)
      // const { data: user, error: userError } = await supabase
      //   .from('users')
      //   .select('*')
      //   .eq('id', authData.user.id)
      //   .eq('team_id', team.id)
      //   .single();

      // if (userError || !user) {
      //   setError('Identifiants incorrects');
      //   setLoading(false);
      //   return;
      // }

      // Redirect to home - DISABLED (Supabase removed)
      // router.push('/');
    } catch (err) {
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
          <h1 className="text-2xl font-bold text-white tracking-wider">{teamSlug}</h1>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <p className="text-sm text-white/70 mb-2">Connexion à votre</p>
          <h2 className="text-5xl font-black bg-gradient-to-r from-[#22D3EE] via-[#3B82F6] to-[#8B5CF6] bg-clip-text text-transparent">
            Compte
          </h2>
        </div>

        {/* Subtitle */}
        <p className="text-center text-white/70 text-sm mb-8 leading-relaxed">
          Accédez à votre espace personnel<br />
          pour gérer votre club.
        </p>

        {/* Login Form */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#22D3EE]" size={20} />
                <input
                  type="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#020617]/50 border border-[#22D3EE]/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/50 focus:border-[#22D3EE] backdrop-blur-sm transition-all"
                  placeholder="Email (ex: admin@asc-penc.com)"
                  required
                />
              </div>
              <p className="text-xs text-white/50 mt-2">
                Entrez votre email complet (ex: admin@asc-penc.com)
              </p>
            </div>

            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#22D3EE]" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#020617]/50 border border-[#22D3EE]/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/50 focus:border-[#22D3EE] backdrop-blur-sm transition-all"
                  placeholder="••••••••"
                  required
                />
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
                    Se connecter
                    <ArrowRight size={18} />
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/10">
            <button
              onClick={() => router.push('/login')}
              className="text-sm text-white/50 hover:text-white transition-colors"
            >
              ← Changer d'équipe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UserLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Chargement...</h2>
      </div>
    </div>}>
      <UserLoginForm />
    </Suspense>
  );
}
