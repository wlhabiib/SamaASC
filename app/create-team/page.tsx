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
      <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Check size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Équipe créée avec succès !</h2>
          <p className="text-gray-600">Votre équipe {teamName} a été créée</p>
          <p className="text-sm text-gray-500 mt-2">Redirection en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <Building2 size={32} className="text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Créer votre équipe</h1>
          <p className="text-gray-600">Commencez par créer votre équipe de football</p>
        </div>

        <form onSubmit={handleCreateTeam} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de l'équipe
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => handleTeamNameChange(e.target.value)}
              placeholder="Ex: ASC Teenbi"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug (identifiant unique)
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="teenbi"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Utilisé pour l'email de l'administrateur: admin@{slug}.com
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !teamName || !slug}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                Créer l'équipe
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Vous avez déjà une équipe ?{' '}
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-green-600 font-semibold hover:underline"
            >
              Se connecter
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
