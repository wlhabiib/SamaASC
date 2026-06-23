'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, ArrowRight, Check } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function RegisterPage() {
  const router = useRouter();
  const [teamName, setTeamName] = useState('');
  const [domain, setDomain] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdEmail, setCreatedEmail] = useState('');
  const [createdPassword, setCreatedPassword] = useState('');

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
      // Validate email domain
      const emailDomain = adminEmail.split('@')[1];
      if (emailDomain !== domain) {
        setError('L\'email doit appartenir au domaine de l\'équipe');
        setLoading(false);
        return;
      }

      // Call the complete team creation endpoint
      console.log('📝 Calling create-complete-team API...');
      const teamResponse = await fetch('/api/auth/create-complete-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_name: teamName,
          team_domain: domain,
          admin_email: adminEmail,
          admin_first_name: adminEmail.split('@')[0],
          admin_password: adminPassword,
        }),
      });

      if (!teamResponse.ok) {
        const errorText = await teamResponse.text();
        console.error('❌ Team creation API error:', { status: teamResponse.status, body: errorText });
        
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || 'Erreur lors de la création de l\'équipe');
        } catch {
          throw new Error('Erreur lors de la création de l\'équipe');
        }
      }

      const result = await teamResponse.json();
      console.log('✅ Team creation result:', result);

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.success || !result.team_id || !result.user_id) {
        throw new Error('Erreur lors de la création de l\'équipe ou de l\'utilisateur');
      }

      // Store credentials for display
      console.log('✅ Registration complete!');
      console.log('Email:', adminEmail);
      console.log('Password:', adminPassword);
      setCreatedEmail(adminEmail);
      setCreatedPassword(adminPassword);

      setSuccess(true);
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        console.log('Redirecting to login...');
        router.push('/login');
      }, 3000);
    } catch (err) {
      console.error('Erreur lors de la création de l\'équipe:', err);
      setError('Erreur lors de la création de l\'équipe: ' + (err as Error).message);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-[#020617] via-[#071A3D] to-[#2D0A5B]" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/30 to-transparent opacity-40 blur-sm" />
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-[#22D3EE]/20 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#8B5CF6]/20 rounded-full blur-3xl" />
        <div className="relative z-10 w-full max-w-md mx-auto">
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#22D3EE] via-[#3B82F6] to-[#8B5CF6]/20 rounded-full mx-auto mb-4 flex items-center justify-center backdrop-blur-sm border border-white/20">
              <Check size={40} className="text-[#22D3EE]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Équipe créée avec succès ! ✅</h2>
            <p className="text-white/70 mb-6">Votre compte admin a été créé</p>

            <div className="bg-white/10 border border-white/20 rounded-xl p-4 mb-6 text-left">
              <p className="text-xs text-white/50 uppercase tracking-wide font-semibold mb-3">Identifiants Admin</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-white/60 mb-1">Email:</p>
                  <p className="font-mono bg-black/30 border border-white/20 rounded p-2 text-sm text-white break-all">{createdEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-white/60 mb-1">Mot de passe:</p>
                  <p className="font-mono bg-black/30 border border-white/20 rounded p-2 text-sm text-white break-all">{createdPassword}</p>
                </div>
              </div>
              <p className="text-xs text-amber-400 mt-3 bg-amber-500/10 p-2 rounded border border-amber-500/30">
                ⚠️ Sauvegardez ces identifiants! Vous en aurez besoin pour vous connecter.
              </p>
            </div>

            <p className="text-white/50 text-sm mt-2">Redirection vers la connexion...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-[#020617] via-[#071A3D] to-[#2D0A5B]" />
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/30 to-transparent opacity-40 blur-sm" />
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-[#22D3EE]/20 rounded-full blur-3xl" />
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#8B5CF6]/20 rounded-full blur-3xl" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#22D3EE] rounded-full animate-pulse" />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-[#3B82F6] rounded-full animate-pulse delay-100" />
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-[#8B5CF6] rounded-full animate-pulse delay-200" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#22D3EE] via-[#3B82F6] to-[#8B5CF6] rounded-2xl blur-lg opacity-50" />
            <div className="relative w-full h-full bg-gradient-to-br from-[#22D3EE]/20 via-[#3B82F6]/20 to-[#8B5CF6]/20 backdrop-blur-xl rounded-2xl border border-white/20 flex items-center justify-center shadow-2xl">
              <span className="text-5xl">⚽</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wider">SAMA ASC</h1>
        </div>

        <div className="text-center mb-8">
          <p className="text-sm text-white/70 mb-2">Créer votre</p>
          <h2 className="text-5xl font-black bg-gradient-to-r from-[#22D3EE] via-[#3B82F6] to-[#8B5CF6] bg-clip-text text-transparent">
            Équipe
          </h2>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Nom de l'équipe
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#22D3EE]" size={20} />
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#020617]/50 border border-[#22D3EE]/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/50 focus:border-[#22D3EE] backdrop-blur-sm transition-all"
                  placeholder=""
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Domaine
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#22D3EE]" size={20} />
                <input
                  type="text"
                  value={domain}
                  onChange={handleDomainChange}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#020617]/50 border border-[#22D3EE]/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/50 focus:border-[#22D3EE] backdrop-blur-sm transition-all"
                  placeholder=""
                  required
                />
              </div>
              <p className="text-xs text-white/50 mt-1">
                Utilisé pour valider les emails de l'équipe
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Email admin
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#22D3EE]" size={20} />
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#020617]/50 border border-[#22D3EE]/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/50 focus:border-[#22D3EE] backdrop-blur-sm transition-all"
                  placeholder=""
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Mot de passe admin
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#22D3EE]" size={20} />
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#020617]/50 border border-[#22D3EE]/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/50 focus:border-[#22D3EE] backdrop-blur-sm transition-all"
                  placeholder=""
                  required
                  minLength={6}
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
                    Création...
                  </>
                ) : (
                  <>
                    Créer mon équipe
                    <ArrowRight size={18} />
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-white/50">
              Déjà une équipe ?{' '}
              <button
                onClick={() => router.push('/login')}
                className="text-[#22D3EE] font-medium hover:underline"
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
