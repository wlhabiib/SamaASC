'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/app-shell';
import { useTeam } from '@/contexts/team-context';
import { User as UserIcon, Upload, Save, Check } from 'lucide-react';

export default function ProfilPage() {
  const router = useRouter();
  const { team, user, loading: contextLoading } = useTeam();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication
    if (!contextLoading) {
      if (!team || !user) {
        router.push('/login');
        return;
      }
    }
  }, [team, user, contextLoading, router]);

  useEffect(() => {
    if (user) {
      setName(`${user.first_name || ''} ${user.last_name || ''}`.trim());
      setUsername(user.email || '');
      setEmail(user.email || '');
      setProfilePhotoPreview(null);
      setLoading(false);
    }
  }, [user]);

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!team || !user) return;

    setSaving(true);
    setSuccess(false);

    try {
      let profilePhotoUrl = user.profile_photo_url || null;

      // Upload profile photo if changed using Base64
      if (profilePhotoFile) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(profilePhotoFile);
        });
        profilePhotoUrl = await base64Promise;
      }

      // Update profile photo via API
      if (profilePhotoUrl !== user.profile_photo_url) {
        const photoResponse = await fetch('/api/admin/profile-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.user_id,
            team_id: team.id,
            profile_photo_url: profilePhotoUrl
          }),
        });

        if (!photoResponse.ok) {
          const photoError = await photoResponse.json();
          throw new Error(photoError.error || 'Failed to update profile photo');
        }
      }

      // Update user name via API route
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user_id,
          team_id: team.id,
          first_name: firstName,
          last_name: lastName,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || `HTTP ${response.status}: Failed to update profile`);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      // Reset file input
      setProfilePhotoFile(null);
      setProfilePhotoPreview(null);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Erreur lors de la sauvegarde: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || contextLoading) {
    return (
      <AppShell>
        <div className="space-y-4 pt-4">
          <div className="h-64 rounded-2xl bg-gray-100 animate-pulse" />
          <div className="h-20 rounded-xl bg-gray-100 animate-pulse" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-5 pt-4">
        {/* Page Header with Icon */}
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg icon-hover relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${team?.secondary_color || '#e0f2fe'} 0%, ${team?.primary_color || '#0ea5e9'} 50%, ${team?.secondary_color || '#e0f2fe'} 100%)`,
              boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
            }}
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#0ea5e9]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-14 h-14 bg-[#0284c7]/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
            <div className="relative z-10">
              <UserIcon size={24} className="text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold drop-shadow-md" style={{ color: team?.primary_color || '#020617' }}>Mon Profil</h1>
            <p className="text-sm drop-shadow-sm" style={{ color: team?.primary_color || '#020617' }}>Informations personnelles</p>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div></div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, #e0f2fe 0%, #0ea5e9 50%, #0284c7 100%)`,
              boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
            }}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save size={18} />
                Sauvegarder
              </>
            )}
          </button>
        </div>

        {/* Success message */}
        {success && (
          <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
            <Check size={20} className="text-green-600" />
            <span className="text-green-700 font-medium">Profil sauvegardé avec succès</span>
          </div>
        )}

        {/* Profile Photo */}
        <div className="rounded-2xl shadow-lg p-5 relative overflow-hidden" style={{
          background: `linear-gradient(135deg, #e0f2fe 0%, #0ea5e9 50%, #0284c7 100%)`,
          boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
        }}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#0ea5e9]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-[#0284c7]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <UserIcon size={20} className="text-white" />
              Photo de profil
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border-2 border-dashed border-white/30">
                {profilePhotoPreview ? (
                  <img src={profilePhotoPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={48} className="text-white/50" />
                )}
              </div>
              <div className="flex-1">
                <label className="flex items-center justify-center px-4 py-3 bg-white/20 backdrop-blur-sm rounded-xl cursor-pointer hover:bg-white/30 transition-all border border-white/30">
                  <Upload size={18} className="text-white mr-2" />
                  <span className="text-white font-medium">Télécharger une photo</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleProfilePhotoChange} 
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-white/70 mt-2">JPG ou PNG, max 5MB</p>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="rounded-2xl shadow-lg p-5 bg-white space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <UserIcon size={20} />
            Informations personnelles
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom complet
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              placeholder="Votre nom"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom d'utilisateur
            </label>
            <input
              type="text"
              value={username}
              disabled
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
              placeholder="Nom d'utilisateur"
            />
            <p className="text-xs text-gray-500 mt-1">Le nom d'utilisateur ne peut pas être modifié</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
              placeholder="Email"
            />
            <p className="text-xs text-gray-500 mt-1">L'email est utilisé pour la connexion</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
