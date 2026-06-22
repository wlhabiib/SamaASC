'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Organization } from '@clerk/nextjs/server';
import { Building2, Check, ArrowRight } from 'lucide-react';

export default function CreateTeamPage() {
  const router = useRouter();
  const { userId } = useAuth();
  const [teamName, setTeamName] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState<{ email: string; password: string } | null>(null);

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
      // Créer l'organisation et l'utilisateur admin
      const response = await fetch('/api/admin/create-organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: teamName,
          slug: slug,
          createAdmin: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la création de l\'équipe');
      }

      const data = await response.json();
      setAdminCredentials({
        email: data.adminEmail,
        password: data.adminPassword,
      });
      setSuccess(true);
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
          
          {adminCredentials && (
            <div className="mt-6 bg-gray-50 rounded-xl p-4 text-left">
              <h3 className="font-semibold text-gray-900 mb-3">Identifiants administrateur</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500">Email</label>
                  <p className="text-sm font-medium text-gray-900">{adminCredentials.email}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Mot de passe</label>
                  <p className="text-sm font-medium text-gray-900">{adminCredentials.password}</p>
                </div>
              </div>
              <p className="text-xs text-red-500 mt-3">⚠️ Sauvegardez ces identifiants, ils ne seront plus affichés.</p>
            </div>
          )}
          
          <button
            onClick={() => router.push('/user-login')}
            className="mt-6 w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            Se connecter avec ces identifiants
            <ArrowRight size={20} />
          </button>
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
