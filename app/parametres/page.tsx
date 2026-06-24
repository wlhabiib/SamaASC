'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/app-shell';
import { useTeam } from '@/contexts/team-context';
import { useAuthUser } from '@/lib/auth-context';
import { Palette, Upload, Save, X, Check, ShieldAlert } from 'lucide-react';

export default function ParametresPage() {
  const router = useRouter();
  const { team, user, loading: contextLoading } = useTeam();
  const { userRole, loading: userLoading } = useAuthUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#020617');
  const [secondaryColor, setSecondaryColor] = useState('#e0f2fe');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [teamPhotoFile, setTeamPhotoFile] = useState<File | null>(null);
  const [teamPhotoPreview, setTeamPhotoPreview] = useState<string | null>(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication
    if (!contextLoading) {
      if (!team) {
        router.push('/login');
        return;
      }
    }
  }, [team, contextLoading, router]);

  // Check if user is admin
  useEffect(() => {
    if (!userLoading && userRole !== 'admin') {
      router.push('/');
    }
  }, [userRole, userLoading, router]);

  useEffect(() => {
    if (team) {
      setName(team.name);
      setSlug(team.slug);
      setDescription(team.description || '');
      setPrimaryColor(team.primary_color || '#020617');
      setSecondaryColor(team.secondary_color || '#e0f2fe');
      setLogoPreview(team.logo_url || null);
      setTeamPhotoPreview(team.team_photo_url || null);
      setLoading(false);
    }
  }, [team]);

  // Show loading or access denied while checking admin role
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#071A3D] to-[#2D0A5B] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#071A3D] to-[#2D0A5B] flex items-center justify-center p-4">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 text-center max-w-md">
          <ShieldAlert size={64} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Accès refusé</h2>
          <p className="text-white/70 mb-6">Seuls les administrateurs peuvent accéder à cette page.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gradient-to-r from-[#22D3EE] to-[#3B82F6] text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTeamPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTeamPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setTeamPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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
    if (!team) return;
    
    setSaving(true);
    setSuccess(false);

    try {
      let logoUrl = team.logo_url;
      let teamPhotoUrl = team.team_photo_url;
      let profilePhotoUrl = user?.profile_photo_url || null;

      // Upload profile photo if changed
      if (profilePhotoFile) {
        // Convert file to base64 for storage (since Supabase storage is disabled)
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(profilePhotoFile);
        });
        profilePhotoUrl = await base64Promise;
      }

      // Upload logo if changed - DISABLED (Supabase removed)
      // if (logoFile && supabase) {
      //   const fileExt = logoFile.name.split('.').pop();
      //   const fileName = `${team.id}-${Date.now()}.${fileExt}`;
      //   const filePath = `team-logos/${fileName}`;

      //   const { error: uploadError } = await supabase.storage
      //     .from('team-assets')
      //     .upload(filePath, logoFile);

      //   if (uploadError) throw uploadError;

      //   const { data: { publicUrl } } = supabase.storage
      //     .from('team-assets')
      //     .getPublicUrl(filePath);

      //   logoUrl = publicUrl;
      // }
      
      // Keep existing logo since upload is disabled
      logoUrl = team.logo_url;

      // Upload team photo if changed - DISABLED (Supabase removed)
      // if (teamPhotoFile && supabase) {
      //   const fileExt = teamPhotoFile.name.split('.').pop();
      //   const fileName = `${team.id}-photo-${Date.now()}.${fileExt}`;
      //   const filePath = `team-photos/${fileName}`;

      //   const { error: uploadError } = await supabase.storage
      //     .from('team-assets')
      //     .upload(filePath, teamPhotoFile);

      //   if (uploadError) throw uploadError;

      //   const { data: { publicUrl } } = supabase.storage
      //     .from('team-assets')
      //     .getPublicUrl(filePath);

      //   teamPhotoUrl = publicUrl;
      // }
      
      // Keep existing team photo since upload is disabled
      teamPhotoUrl = team.team_photo_url;

      // Update profile photo via API
      if (profilePhotoUrl !== user?.profile_photo_url && user) {
        await fetch('/api/admin/profile-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.user_id,
            team_id: team.id,
            profile_photo_url: profilePhotoUrl
          }),
        });
      }

      // Update team via API route
      const response = await fetch('/api/admin/team', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: team.id,
          name,
          slug,
          description,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          accent_color: primaryColor,
          nav_color: primaryColor,
          logo_url: logoUrl,
          team_photo_url: teamPhotoUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update team');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Update team context with new data
      if (team) {
        const updatedTeam = {
          ...team,
          name,
          slug,
          description,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          accent_color: primaryColor,
          nav_color: primaryColor,
          logo_url: logoUrl,
          team_photo_url: teamPhotoUrl,
        };
      }
    } catch (error) {
      console.error('Error saving team settings:', error);
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
              background: 'linear-gradient(135deg, #e0f2fe 0%, #0ea5e9 50%, #0284c7 100%)',
              boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
            }}
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#0ea5e9]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-14 h-14 bg-[#0284c7]/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
            <div className="relative z-10">
              <Palette size={24} className="text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-black drop-shadow-md">Paramètres</h1>
            <p className="text-sm drop-shadow-sm" style={{ color: team?.primary_color || '#020617' }}>Personnalisation de l'équipe</p>
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
              background: `linear-gradient(135deg, ${secondaryColor} 0%, ${primaryColor} 50%, ${secondaryColor} 100%)`,
              borderColor: '#0ea5e9',
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
            <span className="text-green-700 font-medium">Paramètres sauvegardés avec succès</span>
          </div>
        )}

        {/* Logo Upload */}
        <div className="rounded-2xl shadow-lg p-5 relative overflow-hidden" style={{
          background: `linear-gradient(135deg, ${secondaryColor} 0%, ${primaryColor} 50%, ${secondaryColor} 100%)`,
          borderColor: '#0ea5e9',
          boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
        }}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#0ea5e9]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-[#0284c7]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Palette size={20} className="text-white" />
              Logo de l'équipe
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border-2 border-dashed border-white/30">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Upload size={32} className="text-white/70" />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  id="logo-upload"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <label
                  htmlFor="logo-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl font-medium hover:bg-white/30 transition-colors cursor-pointer border border-white/30"
                >
                  <Upload size={18} />
                  Choisir un logo
                </label>
                <p className="text-xs text-white/70 mt-2">
                  Formats acceptés: JPG, PNG, GIF (max 5MB)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Photo Upload */}
        <div className="rounded-2xl shadow-lg p-5 relative overflow-hidden" style={{
          background: `linear-gradient(135deg, ${secondaryColor} 0%, ${primaryColor} 50%, ${secondaryColor} 100%)`,
          borderColor: '#0ea5e9',
          boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
        }}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#0ea5e9]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-[#0284c7]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Palette size={20} className="text-white" />
              Photo de profil
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border-2 border-dashed border-white/30">
                {profilePhotoPreview ? (
                  <img src={profilePhotoPreview} alt="Photo de profil" className="w-full h-full object-cover" />
                ) : (
                  <Upload size={32} className="text-white/70" />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  id="profile-photo-upload"
                  accept="image/*"
                  onChange={handleProfilePhotoChange}
                  className="hidden"
                />
                <label
                  htmlFor="profile-photo-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl font-medium hover:bg-white/30 transition-colors cursor-pointer border border-white/30"
                >
                  <Upload size={18} />
                  Choisir une photo
                </label>
                <p className="text-xs text-white/70 mt-2">
                  Formats acceptés: JPG, PNG, GIF (max 5MB)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Team Photo Upload */}
        <div className="rounded-2xl shadow-lg p-5 relative overflow-hidden" style={{
          background: `linear-gradient(135deg, ${secondaryColor} 0%, ${primaryColor} 50%, ${secondaryColor} 100%)`,
          borderColor: '#0ea5e9',
          boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
        }}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#0ea5e9]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-[#0284c7]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Palette size={20} className="text-white" />
              Photo de l'équipe
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-32 h-48 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border-2 border-dashed border-white/30">
                {teamPhotoPreview ? (
                  <img src={teamPhotoPreview} alt="Photo de l'équipe" className="w-full h-full object-cover" />
                ) : (
                  <Upload size={32} className="text-white/70" />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  id="team-photo-upload"
                  accept="image/*"
                  onChange={handleTeamPhotoChange}
                  className="hidden"
                />
                <label
                  htmlFor="team-photo-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl font-medium hover:bg-white/30 transition-colors cursor-pointer border border-white/30"
                >
                  <Upload size={18} />
                  Choisir une photo
                </label>
                <p className="text-xs text-white/70 mt-2">
                  Formats acceptés: JPG, PNG, GIF (max 5MB)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Team Info */}
        <div className="rounded-2xl shadow-lg p-5 relative overflow-hidden" style={{
          background: `linear-gradient(135deg, ${secondaryColor} 0%, ${primaryColor} 50%, ${secondaryColor} 100%)`,
          borderColor: '#0ea5e9',
          boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
        }}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#0ea5e9]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-[#0284c7]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Palette size={20} className="text-white" />
              Informations de l'équipe
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-1">
                  Nom de l'ASC
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-white/30 px-3 py-2.5 text-sm bg-white/20 backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/50"
                  placeholder="Ex: ASC Diambars"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/90 mb-1">
                  Slug (identifiant unique)
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  className="w-full rounded-xl border border-white/30 px-3 py-2.5 text-sm bg-white/20 backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/50"
                  placeholder="Ex: asc-diambars"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/90 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-white/30 px-3 py-2.5 text-sm bg-white/20 backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/50 resize-none"
                  placeholder="Décrivez votre équipe..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Colors */}
        <div className="rounded-2xl shadow-lg p-5 relative overflow-hidden" style={{
          background: `linear-gradient(135deg, ${secondaryColor} 0%, ${primaryColor} 50%, ${secondaryColor} 100%)`,
          borderColor: '#0ea5e9',
          boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
        }}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#0ea5e9]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-[#0284c7]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Palette size={20} className="text-white" />
              Couleurs de l'équipe
            </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Couleur Premium (dégradé foncé)
              </label>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div
                    className="w-16 h-16 rounded-xl shadow-md"
                    style={{ backgroundColor: primaryColor }}
                  />
                  {primaryColor === '#020617' && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md">
                      <Check size={12} className="text-green-600" />
                    </div>
                  )}
                </div>
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border-2 border-white/30"
                />
                <button
                  onClick={() => setPrimaryColor('#020617')}
                  className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-lg text-sm font-medium hover:bg-white/30 transition-colors border border-white/30"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Couleur Bleu Clair (dégradé clair)
              </label>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div
                    className="w-16 h-16 rounded-xl shadow-md"
                    style={{ backgroundColor: secondaryColor }}
                  />
                  {secondaryColor === '#e0f2fe' && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md">
                      <Check size={12} className="text-green-600" />
                    </div>
                  )}
                </div>
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border-2 border-white/30"
                />
                <button
                  onClick={() => setSecondaryColor('#e0f2fe')}
                  className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-lg text-sm font-medium hover:bg-white/30 transition-colors border border-white/30"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
