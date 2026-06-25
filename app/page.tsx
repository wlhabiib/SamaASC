'use client';

// UI refinements: gradients and color settings updated

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Announcement, Match, Player } from '@/lib/types';
import AppShell from '@/components/app-shell';
import { useTeam } from '@/contexts/team-context';
import { fetchWithCache, clearCache } from '@/utils/cache';
import { Calendar, MapPin, Clock, Trophy, Users, Image, ChevronRight, Home } from 'lucide-react';

const TYPE_CONFIG: Record<string, { icon: typeof Calendar; color: string; bg: string; label: string }> = {
  match: { icon: Trophy, color: 'text-green-600', bg: 'bg-green-50 border-green-200', label: 'Match' },
  training: { icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', label: 'Entraînement' },
  meeting: { icon: Users, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', label: 'Réunion' },
  other: { icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', label: 'Annonce' },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(dateStr: string) {
  const now = new Date();
  now.setHours(0,0,0,0);
  const target = new Date(dateStr + 'T00:00:00');
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Demain';
  if (diff > 1 && diff <= 7) return `Dans ${diff} jours`;
  return formatDate(dateStr);
}

export default function AccueilPage() {
  const router = useRouter();
  const { team, user, loading: contextLoading } = useTeam();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [galleryCount, setGalleryCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Authentication check - must be before early return
  useEffect(() => {
    if (contextLoading) {
      return;
    }

    if (!team) {
      router.push('/login');
      return;
    }

    if (!user) {
      router.push('/user-login');
      return;
    }
  }, [team, user, contextLoading, router]);

  // Data loading - non-blocking pattern
  useEffect(() => {
    async function load() {
      if (!team) return;

      try {
        const [ann, m, p, g, u] = await Promise.all([
          fetchWithCache<Announcement[]>(`/api/data/announcements?team_id=${team.id}`, `announcements_${team.id}`),
          fetchWithCache<Match[]>(`/api/data/matches?team_id=${team.id}`, `matches_${team.id}`),
          fetchWithCache<Player[]>(`/api/data/players?team_id=${team.id}`, `players_${team.id}`),
          fetchWithCache<any[]>(`/api/data/gallery?team_id=${team.id}`, `gallery_${team.id}`),
          fetchWithCache<any[]>(`/api/data/users?team_id=${team.id}`, `users_${team.id}`),
        ]);

        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const validAnnouncements = ann.filter((announcement: Announcement) => {
          if (!announcement.event_date) return true;
          const eventDate = new Date(announcement.event_date + 'T00:00:00');
          return eventDate.getTime() >= now.getTime();
        });

        setAnnouncements(validAnnouncements);
        setAllMatches(m);
        setPlayers(p);
        setGalleryCount((g as any[]).length || 0);
        setUserCount((u as any[]).length || 0);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (team && !contextLoading) {
      load();
    }
  }, [team, contextLoading]);

  // Reload all data when page becomes visible (after admin adds items)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && team) {
        try {
          const [ann, m, p, g, u] = await Promise.all([
            fetchWithCache<Announcement[]>(`/api/data/announcements?team_id=${team.id}`, `announcements_${team.id}`, true),
            fetchWithCache<Match[]>(`/api/data/matches?team_id=${team.id}`, `matches_${team.id}`, true),
            fetchWithCache<Player[]>(`/api/data/players?team_id=${team.id}`, `players_${team.id}`, true),
            fetchWithCache<any[]>(`/api/data/gallery?team_id=${team.id}`, `gallery_${team.id}`, true),
            fetchWithCache<any[]>(`/api/data/users?team_id=${team.id}`, `users_${team.id}`, true),
          ]);

          const now = new Date();
          now.setHours(0, 0, 0, 0);
          const validAnnouncements = ann.filter((announcement: Announcement) => {
            if (!announcement.event_date) return true;
            const eventDate = new Date(announcement.event_date + 'T00:00:00');
            return eventDate.getTime() >= now.getTime();
          });

          setAnnouncements(validAnnouncements);
          setAllMatches(m);
          setPlayers(p);
          setGalleryCount((g as any[]).length || 0);
          setUserCount((u as any[]).length || 0);
        } catch (error) {
          console.error('Error reloading data:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [team]);

  const upcomingMatches = useMemo(() => allMatches.filter(m => m.status === 'upcoming' || m.status === 'live'), [allMatches]);

  // Show loading state only during initial authentication check
  if (contextLoading) {
    return (
      <AppShell>
        <div className="space-y-4 pt-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-32 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </AppShell>
    );
  }

  // Sort upcoming matches and get the closest one
  const sortedUpcomingMatches = upcomingMatches
    .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());
  const nextMatch = sortedUpcomingMatches[0];
  const completedMatches = allMatches.filter((m: Match) => m.status === 'completed').length;

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
              <Home size={24} className="text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold drop-shadow-md" style={{ color: team?.primary_color || '#020617' }}>Accueil</h1>
            <p className="text-sm drop-shadow-sm" style={{ color: team?.primary_color || '#020617' }}>Bienvenue sur {team?.name || 'votre ASC'}</p>
          </div>
        </div>

        {/* Team Photo Card */}
        {team?.team_photo_url && (
          <div 
            className="relative overflow-hidden rounded-2xl shadow-2xl"
            style={{ 
              background: 'linear-gradient(135deg, #020617, #071A3D, #2D0A5B)',
              height: '220px'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#22D3EE]/20 via-[#3B82F6]/20 to-[#8B5CF6]/20" />
            <div className="absolute top-0 left-0 w-96 h-96 bg-[#22D3EE]/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
            <div className="relative h-full">
              <img 
                src={team.team_photo_url} 
                alt={team.name} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Hero / Next Match Banner */}
        {nextMatch && (
          <div
            className="relative overflow-hidden rounded-2xl p-5 shadow-2xl border border-sky-300"
            style={{
              background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #020617 100%)',
              boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
            }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-sky-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#22D3EE]/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="px-2 py-0.5 bg-sky-600/20 rounded-full text-xs font-medium backdrop-blur-sm border border-sky-400/30">
                  Prochain Match
                </div>
                <span className="text-sky-600 text-xs">{daysUntil(nextMatch.match_date)}</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-xl bg-sky-600/20 backdrop-blur-sm flex items-center justify-center mb-1.5 shadow-inner overflow-hidden border border-sky-400/30">
                    {team?.logo_url ? (
                      <img src={team.logo_url} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-lg text-sky-600">{team?.name?.substring(0, 2).toUpperCase() || 'SA'}</span>
                    )}
                  </div>
                  <span className="text-xs text-sky-800">{team?.name || 'Sama ASC'}</span>
                </div>
                <div className="text-center px-3">
                  <span className="text-3xl font-bold bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">VS</span>
                  <div className="text-xs text-sky-700 mt-1">
                    {nextMatch.competition || 'Amical'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-14 h-14 rounded-xl bg-indigo-600/20 backdrop-blur-sm flex items-center justify-center mb-1.5 shadow-inner overflow-hidden border border-indigo-400/30">
                    {nextMatch.opponent_logo ? (
                      <img src={nextMatch.opponent_logo} alt="Logo adverse" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-sm text-sky-900">{nextMatch.opponent.replace('ASC ', '')}</span>
                    )}
                  </div>
                  <span className="text-xs text-sky-800">{nextMatch.opponent}</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-4 text-sm text-sky-800">
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-sky-600" />
                  <span>{formatDate(nextMatch.match_date)}</span>
                </div>
                {nextMatch.match_time && (
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-sky-600" />
                    <span>{nextMatch.match_time}</span>
                  </div>
                )}
              </div>
              {nextMatch.venue && (
                <div className="flex items-center justify-center gap-1.5 text-sm text-sky-700 mt-1.5">
                  <MapPin size={14} className="text-sky-600" />
                  <span>{nextMatch.venue}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* New Stats Cards */}
        <div className="grid grid-cols-4 gap-3">
          <div 
            className="rounded-xl p-4 text-center shadow-2xl border border-sky-300 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #020617 100%)',
              boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
            }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-sky-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#22D3EE]/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
            <div className="relative">
              <Users size={24} className="text-sky-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-sky-900">{players.length}</div>
              <div className="text-xs text-sky-700 mt-0.5">Joueurs</div>
            </div>
          </div>
          <Link
            href="/resultats"
            className="rounded-xl p-4 text-center shadow-2xl border border-sky-300 cursor-pointer hover:shadow-sky-400/50 transition-all relative overflow-hidden block"
            style={{
              background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #020617 100%)',
              boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
            }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-sky-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#3B82F6]/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
            <div className="relative">
              <Trophy size={24} className="text-sky-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-sky-900">{completedMatches}</div>
              <div className="text-xs text-sky-700 mt-0.5">Matchs</div>
            </div>
          </Link>
          <Link
            href="/galerie"
            className="rounded-xl p-4 text-center shadow-2xl border border-sky-300 cursor-pointer hover:shadow-sky-400/50 transition-all relative overflow-hidden block"
            style={{
              background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #020617 100%)',
              boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
            }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-sky-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#8B5CF6]/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
            <div className="relative">
              <Image size={24} className="text-sky-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-sky-900">{galleryCount}</div>
              <div className="text-xs text-sky-700 mt-0.5">Galerie</div>
            </div>
          </Link>
          <div 
            className="rounded-xl p-4 text-center shadow-2xl border border-sky-300 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #020617 100%)',
              boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
            }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-sky-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#22D3EE]/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
            <div className="relative">
              <Users size={24} className="text-sky-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-sky-900">{userCount}</div>
              <div className="text-xs text-sky-700 mt-0.5">Membres</div>
            </div>
          </div>
        </div>

        {/* Announcements */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">Annonces</h2>
            <span className="text-xs text-gray-400">{announcements.length} annonces</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {announcements.map((ann) => {
              const config = TYPE_CONFIG[ann.type];
              const Icon = config.icon;
              return (
                <div
                  key={ann.id}
                  className="relative overflow-hidden rounded-xl border p-4 hover-lift"
                  style={{
                    background: `linear-gradient(135deg, ${team?.secondary_color || '#e0f2fe'} 0%, ${team?.primary_color || '#020617'} 50%, ${team?.secondary_color || '#e0f2fe'} 100%)`,
                    borderColor: '#0ea5e9',
                    boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
                  }}
                >
                  <div className="absolute top-0 right-0 w-48 h-48 bg-[#0ea5e9]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#0284c7]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                  <div className="relative">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/60 backdrop-blur-sm border border-white/80`}>
                        <Icon size={18} className="text-sky-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-sky-700">
                            {config.label}
                          </span>
                          {ann.event_date && (
                            <span className="text-xs text-sky-600/70">
                              {daysUntil(ann.event_date)}
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-sky-900 text-sm mb-1">{ann.title}</h3>
                        <p className="text-xs text-sky-800/80 leading-relaxed">{ann.content}</p>
                      </div>
                      <ChevronRight size={16} className="text-sky-600/70 flex-shrink-0 mt-2" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
