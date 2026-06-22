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

      const adminUsername = adminEmail.split('@')[0];

      // Call the create-team API route instead of RPC directly
      console.log('Calling create-team API route...');
      const teamResponse = await fetch('/api/auth/create-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_name: teamName,
          team_domain: domain,
          admin_email: adminEmail,
          admin_username: adminUsername,
        }),
      });

      if (!teamResponse.ok) {
        const errorText = await teamResponse.text();
        console.error('Team creation API error:', { status: teamResponse.status, body: errorText });
        
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || 'Erreur lors de la création de l\'équipe');
        } catch {
          throw new Error('Erreur lors de la création de l\'équipe');
        }
      }

      const result = await teamResponse.json();
      console.log('Team creation result:', result);

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.team_id || !result.user_id) {
        throw new Error('Failed to create team or user');
      }

      // Sign up user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
        options: {
          data: {
            user_id: result.user_id,
            team_id: result.team_id,
            username: adminUsername,
          }
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        setError('Erreur lors de la création du compte: ' + authError.message);
        setLoading(false);
        return;
      }

      console.log('✅ Supabase Auth user created:', authData.user?.id);
      console.log('Placeholder user_id was:', result.user_id);

      // Update team_members with the real Supabase Auth user ID via API
      const realUserId = authData.user?.id;
      if (realUserId && result.team_id) {
        console.log('🔄 Calling API to update team_members with real user ID:', realUserId);
        try {
          const updateResponse = await fetch('/api/auth/update-user-id', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              team_id: result.team_id,
              temp_user_id: result.user_id,
              real_user_id: realUserId,
            }),
          });

          if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error('❌ Update API error response:', {
              status: updateResponse.status,
              statusText: updateResponse.statusText,
              body: errorText,
            });
          } else {
            const updateData = await updateResponse.json();
            console.log('✅ Successfully updated team_members via API:', updateData);
          }
        } catch (apiError) {
          console.error('❌ Error calling update-user-id API:', apiError);
          // Don't fail - continue anyway
        }
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
      <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Check size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Équipe créée avec succès ! ✅</h2>
          <p className="text-gray-600 mb-6">Votre compte admin a été créé</p>
          
          {/* Credentials Display */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">Identifiants Admin</p>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-600 mb-1">Email:</p>
                <p className="font-mono bg-white border border-gray-300 rounded p-2 text-sm text-gray-900 break-all">{createdEmail}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Mot de passe:</p>
                <p className="font-mono bg-white border border-gray-300 rounded p-2 text-sm text-gray-900 break-all">{createdPassword}</p>
              </div>
            </div>
            <p className="text-xs text-amber-600 mt-3 bg-amber-50 p-2 rounded">
              ⚠️ Sauvegardez ces identifiants! Vous en aurez besoin pour vous connecter.
            </p>
          </div>
          
          <p className="text-gray-500 text-sm mt-2">Redirection vers la connexion...</p>
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
