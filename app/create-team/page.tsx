'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Check, ArrowRight } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function CreateTeamPage() {
  const router = useRouter();
  const [teamName, setTeamName] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Générer automatiquement le slug à partir du nom
  const handleTeamNameChange = (value: string) => {
    setTeamName(value);
    const generatedSlug = value
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
    setSlug(generatedSlug);
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Créer l'équipe dans Supabase
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: teamName,
          slug: slug,
        })
        .select()
        .single();

      if (teamError) {
        throw new Error('Erreur lors de la création de l\'équipe');
      }

      // Créer l'utilisateur admin avec le rôle admin
      const adminEmail = `admin@${slug}.com`;
      const adminPassword = 'admin123'; // Mot de passe par défaut

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
      });

      if (authError) {
        throw new Error('Erreur lors de la création du compte admin: ' + authError.message);
      }

      // Ajouter l'utilisateur à team_members avec le rôle admin
      if (authData.user) {
        const { error: memberError } = await supabase
          .from('team_members')
          .insert({
            team_id: team.id,
            user_id: authData.user.id,
            email: adminEmail,
            first_name: 'Admin',
            last_name: teamName,
            role: 'admin',
            is_active: true,
          });

        if (memberError) {
          throw new Error('Erreur lors de l\'ajout du membre admin: ' + memberError.message);
        }
      }

      setSuccess(true);

      // Rediriger vers la page d'accueil après 2 secondes
      setTimeout(() => {
        router.push('/');
      }, 2000);
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
            <h2 className="text-2xl font-bold text-white mb-2">Équipe créée avec succès !</h2>
            <p className="text-white/70">Votre équipe {teamName} a été créée</p>
            <p className="text-sm text-white/50 mt-2">Redirection en cours...</p>
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
          <form onSubmit={handleCreateTeam} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Nom de l'équipe
              </label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-[#22D3EE]" size={20} />
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => handleTeamNameChange(e.target.value)}
                  placeholder="Ex: ASC Teenbi"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#020617]/50 border border-[#22D3EE]/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/50 focus:border-[#22D3EE] backdrop-blur-sm transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Slug (identifiant unique)
              </label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-[#22D3EE]" size={20} />
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="teenbi"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#020617]/50 border border-[#22D3EE]/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/50 focus:border-[#22D3EE] backdrop-blur-sm transition-all"
                  required
                />
              </div>
              <p className="text-xs text-white/50 mt-1">
                Utilisé pour l'email de l'administrateur: admin@{slug}.com
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm backdrop-blur-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !teamName || !slug}
              className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-[#22D3EE] via-[#3B82F6] to-[#8B5CF6] text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-[#22D3EE]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#22D3EE] via-[#3B82F6] to-[#8B5CF6] opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10">
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    Créer l'équipe
                    <ArrowRight size={18} />
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-white/50">
              Vous avez déjà une équipe ?{' '}
              <button
                type="button"
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
