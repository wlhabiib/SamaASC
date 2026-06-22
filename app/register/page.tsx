'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, ArrowRight, Check } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [teamName, setTeamName] = useState('');
  const [domain, setDomain] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9.-]/g, '');
    setDomain(value);
    // Auto-fill admin email with domain
    if (value && !adminEmail) {
      setAdminEmail(`admin@${value}`);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Rediriger vers Clerk sign-up
      router.push('/user-register');
      return;

      // if (!supabase) {
      //   setError('Erreur de connexion');
      //   setLoading(false);
      //   return;
      // }

      // Validate email domain
      const emailDomain = adminEmail.split('@')[1];
      if (emailDomain !== domain) {
        setError('L\'email doit appartenir au domaine de l\'équipe');
        setLoading(false);
        return;
      }

      const adminUsername = adminEmail.split('@')[0];

      // Create team and admin user via RPC (without password, using Supabase Auth) - DISABLED (Supabase removed)
      // const { data, error: rpcError } = await supabase.rpc('create_team_with_admin', {
      //   p_team_name: teamName,
      //   p_team_domain: domain,
      //   p_admin_email: adminEmail,
      //   p_admin_username: adminUsername,
      //   p_admin_password_hash: '' // Not used anymore
      // });

      // console.log('RPC result:', data, rpcError);

      // if (rpcError) {
      //   console.error('RPC error:', rpcError);
      //   throw rpcError;
      // }

      // const result = data as { success?: boolean; error?: string; team_id?: string; user_id?: string };

      // if (result.error) {
      //   setError(result.error);
      //   setLoading(false);
      //   return;
      // }

      // if (!result.team_id || !result.user_id) {
      //   setError('Failed to create team or user');
      //   setLoading(false);
      //   return;
      // }

      // Sign up user in Supabase Auth - DISABLED (Supabase removed)
      // const { data: authData, error: authError } = await supabase.auth.signUp({
      //   email: adminEmail,
      //   password: adminPassword,
      //   options: {
      //     data: {
      //       user_id: result.user_id,
      //       team_id: result.team_id,
      //       username: adminUsername,
      //     }
      //   }
      // });

      // if (authError) {
      //   console.error('Auth error:', authError);
      //   setError('Erreur lors de la création du compte: ' + authError.message);
      //   setLoading(false);
      //   return;
      // }

      // setSuccess(true);
      
      // // Redirect to login page after a moment
      // setTimeout(() => {
      //   router.push('/login');
      // }, 2000);
    } catch (err) {
      console.error('Erreur lors de la création de l\'équipe:', err);
      setError('Erreur lors de la création de l\'équipe: ' + (err as Error).message);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Check size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Équipe créée avec succès !</h2>
          <p className="text-gray-600">Votre compte admin a été créé</p>
          <p className="text-gray-500 text-sm mt-2">Connexion automatique et redirection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-4xl">⚽</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Sama ASC</h1>
          <p className="text-green-200">Créez votre équipe</p>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'équipe
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
                  placeholder="Ex: ASC Diambars"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Domaine
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={domain}
                  onChange={handleDomainChange}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
                  placeholder="Ex: asc-diambars.com"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Utilisé pour valider les emails de l'équipe
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email admin
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
                  placeholder="Ex: admin@asc-diambars.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe admin
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  Créer mon équipe
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Déjà une équipe ?{' '}
              <button
                onClick={() => router.push('/login')}
                className="text-green-600 font-medium hover:underline"
              >
                Se connecter
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
