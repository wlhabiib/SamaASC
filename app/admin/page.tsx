'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Player, Match, Announcement, Standing, GalleryItem, Coach, PlayerStat, MatchLineup, Competition, User, POSITION_LABELS } from '@/lib/types';
import AppShell from '@/components/app-shell';
import FileUpload from '@/components/file-upload';
import { useTeam } from '@/contexts/team-context';
import { useAuthUser } from '@/lib/auth-context';
import { Users, Calendar, Megaphone, Trophy, Image as ImageIcon, Settings, Plus, Trash2, Edit2, Save, X, ChevronDown, Target, Shirt, Check, Play, ShieldAlert, Upload } from 'lucide-react';

type Tab = 'players' | 'matches' | 'lineup' | 'announcements' | 'standings' | 'gallery' | 'coach' | 'stats' | 'competitions' | 'users' | 'settings';

const TAB_CONFIG: { key: Tab; label: string; icon: typeof Users }[] = [
  { key: 'coach', label: 'Coach', icon: Settings },
  { key: 'players', label: 'Joueurs', icon: Users },
  { key: 'matches', label: 'Matchs', icon: Calendar },
  { key: 'lineup', label: '11 Départ', icon: Shirt },
  { key: 'announcements', label: 'Annonces', icon: Megaphone },
  { key: 'standings', label: 'Compétition', icon: Trophy },
  { key: 'stats', label: 'Stats', icon: Target },
  { key: 'gallery', label: 'Galerie', icon: ImageIcon },
  { key: 'competitions', label: 'Gestion Compétitions', icon: Trophy },
  { key: 'users', label: 'Gestion Utilisateurs', icon: Users },
  { key: 'settings', label: 'Paramètres', icon: Settings },
];

// Move Input and Select components outside to prevent re-render on every keystroke
const Input = ({ label, field, type = 'text', placeholder = '', value, onChange }: { label: string; field: string; type?: string; placeholder?: string; value: string; onChange: (value: string) => void }) => (
  <div className="relative z-10">
    <label className="text-xs font-medium text-gray-500 mb-1 block">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm input-shadow focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500" />
  </div>
);

const Select = ({ label, field, options, value, onChange }: { label: string; field: string; options: { value: string; label: string }[]; value: string; onChange: (value: string) => void }) => (
  <div className="relative z-10">
    <label className="text-xs font-medium text-gray-500 mb-1 block">{label}</label>
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm input-shadow focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 appearance-none bg-white">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  </div>
);

export default function AdminPage() {
  const router = useRouter();
  const { userRole, loading: userLoading } = useAuthUser();
  const { team, user, loading: contextLoading } = useTeam();
  const [tab, setTab] = useState<Tab>('players');
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([]);
  const [lineups, setLineups] = useState<MatchLineup[]>([]);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Lineup tab state
  const [lineupMatchId, setLineupMatchId] = useState<string>('');
  const [lineupFormation, setLineupFormation] = useState<string>('4-3-3');
  const [lineupStarters, setLineupStarters] = useState<string[]>([]);
  const [lineupSubs, setLineupSubs] = useState<string[]>([]);
  const [lineupPositions, setLineupPositions] = useState<Record<number, string>>({});
  const [standingsComp, setStandingsComp] = useState<string>('');
  const [statsComp, setStatsComp] = useState<string>('');


  // Formation positions mapping
  const FORMATION_POSITIONS: Record<string, string[]> = {
    '4-3-3': ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'CM', 'CM', 'LW', 'ST', 'RW'],
    '4-4-2': ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CM', 'CM', 'RM', 'ST', 'ST'],
    '3-5-2': ['GK', 'CB', 'CB', 'CB', 'LWB', 'CDM', 'CM', 'CM', 'RWB', 'ST', 'ST'],
  };

  // All hooks must be called before any early returns
  useEffect(() => {
    if (!contextLoading) {
      if (!team) {
        router.push('/login');
        return;
      }
      if (!user) {
        router.push('/user-login');
        return;
      }
      if (userRole !== 'admin') {
        router.push('/');
        return;
      }
    }
  }, [team, user, contextLoading, router, userRole]);

  const loadAll = useCallback(async () => {
    if (!team) return;
    setLoading(true);
    try {
      const [p, m, a, s, g, c, ps, l, comp, u] = await Promise.all([
        fetch(`/api/data/players?team_id=${team.id}`).then(r => r.json()),
        fetch(`/api/data/matches?team_id=${team.id}`).then(r => r.json()),
        fetch(`/api/data/announcements?team_id=${team.id}`).then(r => r.json()),
        fetch(`/api/data/standings?team_id=${team.id}`).then(r => r.json()),
        fetch(`/api/data/gallery?team_id=${team.id}`).then(r => r.json()),
        fetch(`/api/data/coach?team_id=${team.id}`).then(r => r.json()),
        fetch(`/api/data/player-stats?team_id=${team.id}`).then(r => r.json()),
        fetch(`/api/data/match-lineup?team_id=${team.id}`).then(r => r.json()),
        fetch(`/api/data/competitions?team_id=${team.id}`).then(r => r.json()),
        fetch(`/api/data/users?team_id=${team.id}`).then(r => r.json()).catch(() => []),
      ]);
      
      setPlayers(p);
      setMatches(m);
      setAnnouncements(a);
      setStandings(s);
      setGallery(g);
      setPlayerStats(ps);
      setLineups(l);
      setCompetitions(comp || []);
      setUsers(u || []);
      if (c) setCoach(c);
      if (s && s.length > 0) setStandingsComp(s[0].competition_name);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  }, [team]);

  useEffect(() => { loadAll(); }, [team]);

  // Early returns after all hooks
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

  const handleDelete = async (table: string, id: string) => {
    if (!team) return;

    try {
      const tableMap: Record<string, string> = {
        'players': 'players',
        'matches': 'matches',
        'announcements': 'announcements',
        'standings': 'standings',
        'player_stats': 'stats',
        'gallery': 'gallery',
        'competitions': 'competitions',
        'users': 'users',
      };

      const apiTable = tableMap[table];
      if (apiTable) {
        await fetch(`/api/admin/${apiTable}?id=${id}&team_id=${team.id}`, {
          method: 'DELETE',
        });
      }
      loadAll();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handlePlayerSubmit = async () => {
    if (!team) return;
    
    try {
      const payload = {
        name: form.name, photo_url: form.photo_url || null,
        position: form.position || 'DEF', jersey_number: form.jersey_number ? parseInt(form.jersey_number) : null,
        is_starter: form.is_starter === 'true',
        team_id: team.id,
      };
      if (editing) {
        await fetch('/api/admin/players', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: editing }),
        });
      } else {
        await fetch('/api/admin/players', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setShowForm(false); setEditing(null); setForm({}); loadAll();
    } catch (error) {
      console.error('Error saving player:', error);
    }
  };

  const handleMatchSubmit = async () => {
    if (!team) return;

    try {
      const isHomeBoolean = form.is_home !== 'false';

      const payload = {
        opponent: form.opponent, match_date: form.match_date, match_time: form.match_time || null,
        venue: form.venue || null, competition: form.competition || null, is_home: isHomeBoolean,
        status: form.status || 'upcoming', score_home: form.score_home !== '' ? parseInt(form.score_home) : null,
        score_away: form.score_away !== '' ? parseInt(form.score_away) : null,
        scorers: form.scorers || null,
        opponent_logo: form.opponent_logo || null,
        team_id: team.id,
      };
      if (editing) {
        const response = await fetch('/api/admin/matches', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: editing }),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update match');
        }
      } else {
        const response = await fetch('/api/admin/matches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create match');
        }
      }
      setShowForm(false); setEditing(null); setForm({}); loadAll();
    } catch (error) {
      console.error('Error saving match:', error);
      alert('Erreur lors de la sauvegarde du match: ' + (error as Error).message);
    }
  };

  const handleAnnouncementSubmit = async () => {
    if (!team) return;
    
    try {
      const payload = { title: form.title, content: form.content, type: form.type || 'other', event_date: form.event_date || null, team_id: team.id };
      if (editing) {
        await fetch('/api/admin/announcements', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: editing }),
        });
      } else {
        await fetch('/api/admin/announcements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setShowForm(false); setEditing(null); setForm({}); loadAll();
    } catch (error) {
      console.error('Error saving announcement:', error);
    }
  };

  const handleStandingSubmit = async () => {
    if (!team) return;

    if (!standingsComp) {
      alert('Veuillez sélectionner une compétition');
      return;
    }

    try {
      const payload = {
        competition_name: standingsComp,
        team_name: form.team_name, points: parseInt(form.points) || 0, played: parseInt(form.played) || 0,
        won: parseInt(form.won) || 0, drawn: parseInt(form.drawn) || 0, lost: parseInt(form.lost) || 0,
        goals_for: parseInt(form.goals_for) || 0, goals_against: parseInt(form.goals_against) || 0,
        position: parseInt(form.position) || 1,
        team_id: team.id,
      };
      if (editing) {
        const response = await fetch('/api/admin/standings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: editing }),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update standing');
        }
      } else {
        const response = await fetch('/api/admin/standings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create standing');
        }
      }
      setShowForm(false); setEditing(null); setForm({}); loadAll();
    } catch (error) {
      console.error('Error saving standing:', error);
      alert('Erreur lors de la sauvegarde du classement: ' + (error as Error).message);
    }
  };

  const handleGallerySubmit = async () => {
    if (!team) return;

    if (!form.url) {
      alert('Veuillez sélectionner une image ou une vidéo');
      return;
    }

    try {
      // Auto-detect type from URL if not set
      let type = form.type || 'image';
      if (form.url) {
        const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
        const isVideo = videoExtensions.some(ext => form.url!.toLowerCase().endsWith(ext));
        type = isVideo ? 'video' : 'image';
      }

      const payload = { type, url: form.url, caption: form.caption || null, event_type: form.event_type || 'other', team_id: team.id };

      const response = await fetch('/api/admin/gallery', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing ? { ...payload, id: editing } : payload),
      });

      const responseText = await response.text();

      if (!response.ok) {
        let error;
        try {
          error = JSON.parse(responseText);
        } catch {
          error = { error: responseText || 'Erreur inconnue' };
        }
        console.error('Gallery API error:', error);
        alert('Erreur: ' + (error.error || 'Erreur lors de la sauvegarde'));
        return;
      }

      setShowForm(false); setEditing(null); setForm({}); loadAll();

      // Clear gallery cache so home page updates
      if (typeof window !== 'undefined' && team) {
        localStorage.removeItem(`samaasc_cache_gallery_${team.id}`);
      }
    } catch (error) {
      console.error('Error saving gallery:', error);
      alert('Erreur lors de la sauvegarde: ' + (error as Error).message);
    }
  };

  const handleCoachSubmit = async () => {
    if (!team) return;
    
    try {
      const payload = { name: form.name, photo_url: form.photo_url || null, role: form.role || 'Entraineur', team_id: team.id };
      if (coach) {
        await fetch('/api/admin/coach', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: coach.id }),
        });
      } else {
        await fetch('/api/admin/coach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setShowForm(false); setEditing(null); setForm({}); loadAll();
    } catch (error) {
      console.error('Error saving coach:', error);
    }
  };

  const handleStatSubmit = async () => {
    if (!team) return;

    try {
      const payload = {
        player_id: form.player_id, competition_name: form.competition_name,
        goals: parseInt(form.goals) || 0, assists: parseInt(form.assists) || 0,
        matches_played: parseInt(form.matches_played) || 0,
        team_id: team.id,
      };
      if (editing) {
        const response = await fetch('/api/admin/stats', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: editing }),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update stat');
        }
      } else {
        const response = await fetch('/api/admin/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create stat');
        }
      }
      setShowForm(false); setEditing(null); setForm({}); loadAll();
    } catch (error) {
      console.error('Error saving stat:', error);
      alert('Erreur lors de la sauvegarde des stats: ' + (error as Error).message);
    }
  };

  const handleCompetitionSubmit = async () => {
    if (!team) return;

    try {
      const payload = {
        name: form.name,
        team_id: team.id,
      };
      if (editing) {
        const response = await fetch('/api/admin/competitions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: editing }),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update competition');
        }
      } else {
        const response = await fetch('/api/admin/competitions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create competition');
        }
      }
      setShowForm(false); setEditing(null); setForm({}); loadAll();
    } catch (error) {
      console.error('Error saving competition:', error);
      alert('Erreur lors de la sauvegarde de la compétition: ' + (error as Error).message);
    }
  };

  const handleUserSubmit = async () => {
    if (!team || !form.email || !form.password) return;

    try {
      // Create user via API endpoint (uses custom users table, not Supabase Auth)
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          username: form.email.split('@')[0],
          name: form.name || form.email.split('@')[0],
          team_id: team.id,
          role: 'member',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }

      // Show success notification
      setSuccessMessage(`Utilisateur ${form.email} créé avec succès !`);
      setTimeout(() => setSuccessMessage(null), 3000);

      // Reset form but stay on admin page
      setShowForm(false); 
      setEditing(null); 
      setForm({}); 
      loadAll();
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Erreur lors de la création du membre: ' + (error as Error).message);
    }
  };

  const handleSaveLineup = async () => {
    if (!lineupMatchId || !team) return;
    
    try {
      // Save formation to match - DISABLED (Supabase removed)
      // if (supabase) {
      //   await supabase.from('matches').update({ formation: lineupFormation }).eq('id', lineupMatchId);
      // }
      // Save lineup via API with position assignments
      const positions = FORMATION_POSITIONS[lineupFormation] || [];
      const lineup = {
        match_id: lineupMatchId,
        players: [
          ...positions.map((pos, idx) => {
            const playerId = lineupPositions[idx + 1];
            if (!playerId) return null;
            return { player_id: playerId, position_slot: idx, is_substitute: false };
          }).filter(Boolean),
          ...lineupSubs.map((pid, idx) => ({ player_id: pid, position_slot: idx + 12, is_substitute: true }))
        ]
      };
      await fetch('/api/admin/lineup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineup, team_id: team.id }),
      });
      loadAll();
    } catch (error) {
      console.error('Error saving lineup:', error);
    }
  };

  // Load lineup when match selected
  useEffect(() => {
    if (!lineupMatchId) { setLineupStarters([]); setLineupSubs([]); return; }
    const match = matches.find(m => m.id === lineupMatchId);
    if (match) setLineupFormation(match.formation || '4-3-3');
    const existing = lineups.filter(l => l.match_id === lineupMatchId);
    if (existing.length > 0) {
      setLineupStarters(existing.filter(l => !l.is_substitute).sort((a, b) => a.position_slot - b.position_slot).map(l => l.player_id));
      setLineupSubs(existing.filter(l => l.is_substitute).map(l => l.player_id));
    } else {
      // Default to is_starter players
      setLineupStarters(players.filter(p => p.is_starter).map(p => p.id).slice(0, 11));
      setLineupSubs(players.filter(p => !p.is_starter).map(p => p.id));
    }
  }, [lineupMatchId, matches, lineups, players]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startEdit = (item: any, fields: string[]) => {
    const f: Record<string, string> = {};
    fields.forEach(field => {
      if (field === 'is_home') {
        f[field] = item[field] === true ? 'true' : 'false';
      } else {
        f[field] = String(item[field] ?? '');
      }
    });
    setForm(f);
    setEditing(String(item.id));
    setShowForm(true);
  };

  if (loading || contextLoading) {
    return (<AppShell><div className="space-y-4 pt-4"><div className="h-12 rounded-xl bg-gray-100 animate-pulse" /><div className="h-64 rounded-2xl bg-gray-100 animate-pulse" /></div></AppShell>);
  }

  const upcomingMatches = matches.filter(m => m.status === 'upcoming');
  const standingsCompetitions = Array.from(new Set(standings.map(s => s.competition_name)));
  const filteredStandings = standingsComp ? standings.filter(s => s.competition_name === standingsComp) : standings;

  const toggleStarter = (pid: string) => {
    if (lineupStarters.includes(pid)) {
      setLineupStarters(prev => prev.filter(id => id !== pid));
      setLineupSubs(prev => [...prev, pid]);
      // Remove from positions
      setLineupPositions(prev => {
        const newPositions = { ...prev };
        Object.keys(newPositions).forEach(key => {
          if (newPositions[parseInt(key)] === pid) {
            delete newPositions[parseInt(key)];
          }
        });
        return newPositions;
      });
    } else if (lineupStarters.length < 11) {
      setLineupStarters(prev => [...prev, pid]);
      setLineupSubs(prev => prev.filter(id => id !== pid));
      // Auto-assign to first available position
      const positions = FORMATION_POSITIONS[lineupFormation] || [];
      const usedPositions = Object.keys(lineupPositions).map(Number);
      const availablePosition = positions.findIndex((_, idx) => !usedPositions.includes(idx + 1));
      if (availablePosition !== -1) {
        setLineupPositions(prev => ({ ...prev, [availablePosition + 1]: pid }));
      }
    }
  };

  const toggleSub = (pid: string) => {
    if (lineupSubs.includes(pid)) {
      setLineupSubs(prev => prev.filter(id => id !== pid));
    } else {
      setLineupSubs(prev => [...prev, pid]);
      setLineupStarters(prev => prev.filter(id => id !== pid));
    }
  };

  return (
    <AppShell>
      <div className="space-y-4 pt-4">
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
              <Settings size={24} className="text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-black drop-shadow-md">Administration</h1>
            <p className="text-sm drop-shadow-sm" style={{ color: team?.primary_color || '#020617' }}>Gestion de l'équipe</p>
          </div>
        </div>

        {/* Success Notification */}
        {successMessage && (
          <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
            <Check size={20} className="text-green-600" />
            <span className="text-green-700 font-medium">{successMessage}</span>
          </div>
        )}

        {/* Card Grid for Admin Sections */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {TAB_CONFIG.map(t => {
            const Icon = t.icon;
            const isActive = tab === t.key;
            return (
              <button key={t.key} onClick={() => { setTab(t.key); setShowForm(false); setEditing(null); setForm({}); }}
                className="rounded-2xl p-4 cursor-pointer hover-lift relative overflow-hidden transition-all duration-300"
                style={{
                  height: '120px',
                  background: isActive 
                    ? `linear-gradient(135deg, ${team?.secondary_color || '#e0f2fe'} 0%, ${team?.primary_color || '#020617'} 100%)`
                    : `linear-gradient(135deg, ${team?.secondary_color || '#e0f2fe'} 0%, ${team?.primary_color || '#020617'} 100%)`,
                  borderColor: '#0ea5e9',
                  boxShadow: isActive ? '0 4px 30px -4px rgba(14, 165, 233, 0.3)' : '0 4px 20px -4px rgba(14, 165, 233, 0.2)',
                  opacity: isActive ? 1 : 0.7
                }}>
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#0ea5e9]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-[#0284c7]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center justify-center h-full gap-2">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Icon size={20} className="text-white" />
                  </div>
                  <span className="text-xs font-medium text-white text-center">{t.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* COACH TAB */}
        {tab === 'coach' && (
          <div className="rounded-2xl bg-white p-4 shadow-lg space-y-3">
            <h3 className="text-sm font-bold text-gray-700">Informations Coach</h3>
            {!showForm && coach && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  {coach.photo_url ? <img src={coach.photo_url} alt="" className="w-full h-full rounded-full object-cover" /> : <Users size={18} className="text-green-600" />}
                </div>
                <div><div className="font-semibold text-sm">{coach.name}</div><div className="text-xs text-gray-400">{coach.role}</div></div>
                <button onClick={() => { setShowForm(true); setEditing(coach.id); setForm({ name: coach.name, role: coach.role || '', photo_url: coach.photo_url || '' }); }} className="ml-auto p-1.5 text-gray-400 hover:text-blue-500 transition-colors"><Edit2 size={14} /></button>
              </div>
            )}
            {!showForm && !coach && (
              <button onClick={() => { setShowForm(true); setEditing(null); setForm({}); }} className="relative overflow-hidden w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg" style={{
                background: `linear-gradient(135deg, ${team?.secondary_color || '#e0f2fe'} 0%, ${team?.primary_color || '#020617'} 50%, ${team?.secondary_color || '#e0f2fe'} 100%)`,
                borderColor: '#0ea5e9',
                boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
              }}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#0ea5e9]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#0284c7]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                <div className="relative z-10 flex items-center justify-center gap-2">
                  <Plus size={16} /> Ajouter un coach
                </div>
              </button>
            )}
            {showForm && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold">{editing ? 'Modifier' : 'Ajouter'} un coach</h3>
                  <button onClick={() => { setShowForm(false); setEditing(null); setForm({}); }} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <Input label="Nom" field="name" placeholder="Nom du coach" value={form.name || ''} onChange={(value) => setForm(prev => ({ ...prev, name: value }))} />
                <FileUpload
                  value={form.photo_url || null}
                  onChange={(url) => setForm(prev => ({ ...prev, photo_url: url }))}
                  label="Photo"
                  teamId={team?.id}
                />
                <Input label="Rôle" field="role" placeholder="Entraineur" value={form.role || ''} onChange={(value) => setForm(prev => ({ ...prev, role: value }))} />
                <button onClick={handleCoachSubmit} className="relative overflow-hidden w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg" style={{
                  background: `linear-gradient(135deg, ${team?.secondary_color || '#e0f2fe'} 0%, ${team?.primary_color || '#020617'} 50%, ${team?.secondary_color || '#e0f2fe'} 100%)`,
                  borderColor: '#0ea5e9',
                  boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
                }}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#0ea5e9]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#0284c7]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    <Save size={16} />{coach ? 'Mettre à jour' : 'Ajouter'}
                  </div>
                </button>
              </>
            )}
          </div>
        )}

        {/* PLAYERS TAB */}
        {tab === 'players' && (
          <>
            {!showForm && (
              <button onClick={() => { setShowForm(true); setEditing(null); setForm({ position: 'DEF' }); }}
                className="relative overflow-hidden w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg" style={{
                  background: `linear-gradient(135deg, ${team?.secondary_color || '#e0f2fe'} 0%, ${team?.primary_color || '#020617'} 50%, ${team?.secondary_color || '#e0f2fe'} 100%)`,
                  borderColor: '#0ea5e9',
                  boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
                }}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#0ea5e9]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#0284c7]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                <div className="relative z-10 flex items-center justify-center gap-2">
                  <Plus size={16} /> Ajouter un joueur
                </div>
              </button>
            )}
            {showForm && tab === 'players' && (
              <div className="rounded-2xl bg-white p-4 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold">{editing ? 'Modifier' : 'Ajouter'} un joueur</h3>
                  <button onClick={() => { setShowForm(false); setEditing(null); setForm({}); }} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <Input label="Nom" field="name" placeholder="Nom du joueur" value={form.name || ''} onChange={(value) => setForm(prev => ({ ...prev, name: value }))} />
                <FileUpload
                  value={form.photo_url || null}
                  onChange={(url) => setForm(prev => ({ ...prev, photo_url: url }))}
                  label="Photo"
                  teamId={team?.id}
                />
                <Select label="Poste" field="position" options={[
                  { value: 'GK', label: 'Gardien' }, { value: 'DEF', label: 'Défenseur' },
                  { value: 'MIL', label: 'Milieu' }, { value: 'ATT', label: 'Attaquant' },
                ]} value={form.position || ''} onChange={(value) => setForm(prev => ({ ...prev, position: value }))} />
                <Input label="Numéro" field="jersey_number" type="number" placeholder="10" value={form.jersey_number || ''} onChange={(value) => setForm(prev => ({ ...prev, jersey_number: value }))} />
                <button onClick={handlePlayerSubmit} className="relative overflow-hidden w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg" style={{
                  background: `linear-gradient(135deg, ${team?.secondary_color || '#e0f2fe'} 0%, ${team?.primary_color || '#020617'} 50%, ${team?.secondary_color || '#e0f2fe'} 100%)`,
                  borderColor: '#0ea5e9',
                  boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
                }}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#0ea5e9]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#0284c7]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    <Save size={16} /> {editing ? 'Mettre à jour' : 'Ajouter'}
                  </div>
                </button>
              </div>
            )}
            <div className="space-y-2">
              {players.map(p => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-md">
                  <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center overflow-hidden border border-green-200">
                    {p.photo_url ? <img src={p.photo_url} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-green-600">{p.jersey_number}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900 truncate">{p.name}</div>
                    <div className="text-xs text-gray-400">{POSITION_LABELS[p.position]} - #{p.jersey_number}</div>
                  </div>
                  <button onClick={() => startEdit(p, ['name','photo_url','position','jersey_number'])} className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete('players', p.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* MATCHES TAB */}
        {tab === 'matches' && (
          <>
            {!showForm && (
              <button onClick={() => { setShowForm(true); setEditing(null); setForm({ is_home: 'true', status: 'upcoming', formation: '4-3-3' }); }}
                className="relative overflow-hidden w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg" style={{
                  background: `linear-gradient(135deg, ${team?.secondary_color || '#e0f2fe'} 0%, ${team?.primary_color || '#020617'} 50%, ${team?.secondary_color || '#e0f2fe'} 100%)`,
                  borderColor: '#0ea5e9',
                  boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
                }}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#0ea5e9]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#0284c7]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                <div className="relative z-10 flex items-center justify-center gap-2">
                  <Plus size={16} /> Ajouter un match
                </div>
              </button>
            )}
            {showForm && tab === 'matches' && (
              <div className="rounded-2xl bg-white p-4 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold">{editing ? 'Modifier' : 'Ajouter'} un match</h3>
                  <button onClick={() => { setShowForm(false); setEditing(null); setForm({}); }} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <Input label="Adversaire" field="opponent" placeholder="ASC..." value={form.opponent || ''} onChange={(value) => setForm(prev => ({ ...prev, opponent: value }))} />
                <div>
                  <FileUpload value={form.opponent_logo || null} onChange={(url) => setForm(prev => ({ ...prev, opponent_logo: url }))} label="Logo adverse" teamId={team?.id} />
                </div>
                <Input label="Date" field="match_date" type="date" value={form.match_date || ''} onChange={(value) => setForm(prev => ({ ...prev, match_date: value }))} />
                <Input label="Heure" field="match_time" type="time" value={form.match_time || ''} onChange={(value) => setForm(prev => ({ ...prev, match_time: value }))} />
                <Input label="Lieu" field="venue" placeholder="Terrain..." value={form.venue || ''} onChange={(value) => setForm(prev => ({ ...prev, venue: value }))} />
                <Select label="Compétition" field="competition" options={competitions.map(c => ({ value: c.name, label: c.name }))} value={form.competition || ''} onChange={(value) => setForm(prev => ({ ...prev, competition: value }))} />
                <Select label="Domicile" field="is_home" options={[{ value: 'true', label: 'Oui' }, { value: 'false', label: 'Non' }]} value={form.is_home || 'false'} onChange={(value) => setForm(prev => ({ ...prev, is_home: value }))} />
                <Select label="Statut" field="status" options={[
                  { value: 'upcoming', label: 'À venir' }, { value: 'live', label: 'En direct' },
                  { value: 'completed', label: 'Terminé' }, { value: 'postponed', label: 'Reporté' },
                ]} value={form.status || ''} onChange={(value) => setForm(prev => ({ ...prev, status: value }))} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Score domicile" field="score_home" type="number" value={form.score_home || ''} onChange={(value) => setForm(prev => ({ ...prev, score_home: value }))} />
                  <Input label="Score extérieur" field="score_away" type="number" value={form.score_away || ''} onChange={(value) => setForm(prev => ({ ...prev, score_away: value }))} />
                </div>
                <Input label="Buteurs" field="scorers" placeholder="Noms des buteurs (séparés par virgule)" value={form.scorers || ''} onChange={(value) => setForm(prev => ({ ...prev, scorers: value }))} />
                <button onClick={handleMatchSubmit} className="relative overflow-hidden w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg" style={{
                  background: `linear-gradient(135deg, ${team?.secondary_color || '#e0f2fe'} 0%, ${team?.primary_color || '#020617'} 50%, ${team?.secondary_color || '#e0f2fe'} 100%)`,
                  borderColor: '#0ea5e9',
                  boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
                }}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#0ea5e9]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#0284c7]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    <Save size={16} /> {editing ? 'Mettre à jour' : 'Ajouter'}
                  </div>
                </button>
              </div>
            )}
            <div className="space-y-2">
              {matches.map(m => (
                <div key={m.id} className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-md" style={{
                  boxShadow: team?.primary_color ? `0 4px 30px -4px ${team.primary_color}60` : undefined
                }}>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900">vs {m.opponent}</div>
                    <div className="text-xs text-gray-400">{m.match_date} {m.match_time || ''} - {m.status === 'completed' ? `${m.score_home}-${m.score_away}` : m.status} - {m.formation}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-[10px] font-bold">{m.formation}</span>
                  <button onClick={() => startEdit(m, ['opponent','match_date','match_time','venue','competition','is_home','status','score_home','score_away','formation','scorers','opponent_logo'])} className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete('matches', m.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* LINEUP TAB - Starting 11 per match */}
        {tab === 'lineup' && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-4 shadow-lg space-y-3">
              <h3 className="text-sm font-bold text-gray-700">Composer le 11 de départ</h3>
              <div className="relative z-10">
                <select value={lineupMatchId} onChange={e => setLineupMatchId(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm input-shadow focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 appearance-none bg-white font-medium">
                  <option value="">Choisir un match...</option>
                  {matches.filter(m => m.status === 'upcoming').map(m => (
                    <option key={m.id} value={m.id}>vs {m.opponent} - {m.match_date}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {lineupMatchId && (
                <>
                  {/* Formation selector */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Formation</label>
                    <div className="flex gap-2">
                      {['4-3-3', '4-4-2', '3-5-2'].map(f => (
                        <button key={f} onClick={() => setLineupFormation(f)}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold tracking-wider transition-all duration-300 ${
                            lineupFormation === f ? 'text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          style={{ backgroundColor: lineupFormation === f ? (team?.secondary_color || '#22c55e') : undefined }}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Starters - Position-based selection */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-green-700">Titulaires ({Object.keys(lineupPositions).length}/11)</span>
                      {Object.keys(lineupPositions).length !== 11 && <span className="text-[10px] text-amber-500 font-medium">Il faut 11 joueurs</span>}
                    </div>
                    <div className="space-y-2">
                      {(FORMATION_POSITIONS[lineupFormation] || []).map((position, idx) => {
                        const selectedPlayerId = lineupPositions[idx + 1];
                        const selectedPlayer = players.find(p => p.id === selectedPlayerId);
                        return (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-xs font-bold text-green-600 w-8 text-center">{position}</span>
                            <select
                              value={selectedPlayerId || ''}
                              onChange={(e) => {
                                const newPlayerId = e.target.value;
                                setLineupPositions(prev => {
                                  const newPositions = { ...prev };
                                  if (newPlayerId) {
                                    newPositions[idx + 1] = newPlayerId;
                                    // Remove from other positions if selected elsewhere
                                    Object.keys(newPositions).forEach(key => {
                                      if (parseInt(key) !== idx + 1 && newPositions[parseInt(key)] === newPlayerId) {
                                        delete newPositions[parseInt(key)];
                                      }
                                    });
                                  } else {
                                    delete newPositions[idx + 1];
                                  }
                                  return newPositions;
                                });
                                // Update starters list
                                setLineupStarters(prev => {
                                  const allSelected = Object.values({ ...lineupPositions, [idx + 1]: newPlayerId || null }).filter((v): v is string => v !== null);
                                  return allSelected.filter((v, i, a) => a.indexOf(v) === i);
                                });
                              }}
                              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs input-shadow focus:outline-none focus:ring-2 appearance-none bg-white"
                              style={{
                                '--tw-ring-color': team?.primary_color || '#22c55e',
                                borderColor: team?.primary_color || '#e5e7eb',
                              } as React.CSSProperties}
                            >
                              <option value="">Choisir un joueur...</option>
                              {players.filter(p => !lineupSubs.includes(p.id)).map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({POSITION_LABELS[p.position]})</option>
                              ))}
                            </select>
                            {selectedPlayer && (
                              <button onClick={() => {
                                setLineupPositions(prev => {
                                  const newPositions = { ...prev };
                                  delete newPositions[idx + 1];
                                  return newPositions;
                                });
                                setLineupStarters(prev => prev.filter(id => id !== selectedPlayerId));
                              }} className="text-red-400 hover:text-red-600 transition-colors">
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Substitutes */}
                  <div>
                    <span className="text-xs font-bold text-gray-500 mb-1 block">Remplaçants ({lineupSubs.length})</span>
                    <div className="space-y-1">
                      {lineupSubs.map(pid => {
                        const p = players.find(pl => pl.id === pid);
                        if (!p) return null;
                        return (
                          <div key={pid} className="flex items-center gap-2 rounded-lg bg-gray-50 p-2 border border-gray-200">
                            <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center overflow-hidden border border-gray-200">
                              {p.photo_url ? <img src={p.photo_url} alt="" className="w-full h-full object-cover" /> : <span className="text-[9px] font-bold text-gray-400">{p.jersey_number}</span>}
                            </div>
                            <div className="flex-1 min-w-0"><div className="text-xs font-medium text-gray-600 truncate">{p.name}</div><div className="text-[10px] text-gray-400">{POSITION_LABELS[p.position]}</div></div>
                            <button onClick={() => toggleSub(pid)} className="text-red-400 hover:text-red-600 transition-colors"><X size={14} /></button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add more subs */}
                  <div>
                    <span className="text-xs font-bold text-gray-400 mb-1 block">Ajouter remplaçant</span>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {players.filter(p => !Object.values(lineupPositions).includes(p.id) && !lineupSubs.includes(p.id)).map(p => (
                        <button key={p.id} onClick={() => toggleSub(p.id)}
                          className="w-full flex items-center gap-2 rounded-lg p-2 text-left hover:bg-gray-50 transition-colors">
                          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                            {p.photo_url ? <img src={p.photo_url} alt="" className="w-full h-full object-cover" /> : <span className="text-[9px] font-bold text-gray-500">{p.jersey_number}</span>}
                          </div>
                          <div className="flex-1"><div className="text-xs font-medium text-gray-600">{p.name}</div><div className="text-[10px] text-gray-400">{POSITION_LABELS[p.position]}</div></div>
                          <Plus size={14} className="text-gray-400" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <button onClick={handleSaveLineup} className="relative overflow-hidden w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg" style={{
                    background: `linear-gradient(135deg, ${team?.secondary_color || '#e0f2fe'} 0%, ${team?.primary_color || '#020617'} 50%, ${team?.secondary_color || '#e0f2fe'} 100%)`,
                    borderColor: '#0ea5e9',
                    boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
                  }}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#0ea5e9]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#0284c7]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                    <div className="relative z-10 flex items-center justify-center gap-2">
                      <Save size={16} /> Sauvegarder la composition
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ANNOUNCEMENTS TAB */}
        {tab === 'announcements' && (
          <>
            {!showForm && (
              <button onClick={() => { setShowForm(true); setEditing(null); setForm({ type: 'other' }); }}
                className="relative overflow-hidden w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg" style={{
                  background: `linear-gradient(135deg, ${team?.secondary_color || '#e0f2fe'} 0%, ${team?.primary_color || '#020617'} 50%, ${team?.secondary_color || '#e0f2fe'} 100%)`,
                  borderColor: '#0ea5e9',
                  boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
                }}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#0ea5e9]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#0284c7]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                <div className="relative z-10 flex items-center justify-center gap-2">
                  <Plus size={16} /> Ajouter une annonce
                </div>
              </button>
            )}
            {showForm && tab === 'announcements' && (
              <div className="rounded-2xl bg-white p-4 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold">{editing ? 'Modifier' : 'Ajouter'} une annonce</h3>
                  <button onClick={() => { setShowForm(false); setEditing(null); setForm({}); }} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <Input label="Titre" field="title" placeholder="Titre de l'annonce" value={form.title || ''} onChange={(value) => setForm(prev => ({ ...prev, title: value }))} />
                <div className="relative z-10">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Contenu</label>
                  <textarea value={form.content || ''} onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Détails de l'annonce..." rows={3}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm input-shadow focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 resize-none" />
                </div>
                <Select label="Type" field="type" options={[
                  { value: 'match', label: 'Match' }, { value: 'training', label: 'Entraînement' },
                  { value: 'meeting', label: 'Réunion' }, { value: 'other', label: 'Autre' },
                ]} value={form.type || ''} onChange={(value) => setForm(prev => ({ ...prev, type: value }))} />
                <Input label="Date événement" field="event_date" type="date" value={form.event_date || ''} onChange={(value) => setForm(prev => ({ ...prev, event_date: value }))} />
                <button onClick={handleAnnouncementSubmit} className="relative overflow-hidden w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg" style={{
                  background: `linear-gradient(135deg, ${team?.secondary_color || '#e0f2fe'} 0%, ${team?.primary_color || '#020617'} 50%, ${team?.secondary_color || '#e0f2fe'} 100%)`,
                  borderColor: '#0ea5e9',
                  boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
                }}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#0ea5e9]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#0284c7]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    <Save size={16} /> {editing ? 'Mettre à jour' : 'Ajouter'}
                  </div>
                </button>
              </div>
            )}
            <div className="space-y-2">
              {announcements.map(a => (
                <div key={a.id} className="flex items-start gap-3 rounded-xl bg-white p-3 shadow-md">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900">{a.title}</div>
                    <div className="text-xs text-gray-400 truncate">{a.content}</div>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500">{a.type}</span>
                  </div>
                  <button onClick={() => startEdit(a, ['title','content','type','event_date'])} className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors mt-1"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete('announcements', a.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors mt-1"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* STANDINGS TAB - with competition filter */}
        {tab === 'standings' && (
          <>
            {/* Competition filter - dropdown */}
            <div className="relative">
              <select
                value={standingsComp}
                onChange={(e) => setStandingsComp(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 appearance-none shadow-md"
              >
                <option value="">Sélectionner une compétition</option>
                {competitions.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            {!showForm && (
              <button onClick={() => { setShowForm(true); setEditing(null); setForm({}); }}
                className="relative overflow-hidden w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg" style={{
                  background: `linear-gradient(135deg, ${team?.secondary_color || '#e0f2fe'} 0%, ${team?.primary_color || '#020617'} 50%, ${team?.secondary_color || '#e0f2fe'} 100%)`,
                  borderColor: '#0ea5e9',
                  boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
                }}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#0ea5e9]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#0284c7]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                <div className="relative z-10 flex items-center justify-center gap-2">
                  <Plus size={16} /> Ajouter au classement
                </div>
              </button>
            )}
            {showForm && tab === 'standings' && (
              <div className="rounded-2xl bg-white p-4 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold">{editing ? 'Modifier' : 'Ajouter'} classement</h3>
                  <button onClick={() => { setShowForm(false); setEditing(null); setForm({}); }} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <Input label="Équipe" field="team_name" placeholder="Nom équipe" value={form.team_name || ''} onChange={(value) => setForm(prev => ({ ...prev, team_name: value }))} />
                <Input label="Position" field="position" type="number" value={form.position || ''} onChange={(value) => setForm(prev => ({ ...prev, position: value }))} />
                <div className="grid grid-cols-3 gap-3">
                  <Input label="Points" field="points" type="number" value={form.points || ''} onChange={(value) => setForm(prev => ({ ...prev, points: value }))} />
                  <Input label="Joués" field="played" type="number" value={form.played || ''} onChange={(value) => setForm(prev => ({ ...prev, played: value }))} />
                  <Input label="Victoires" field="won" type="number" value={form.won || ''} onChange={(value) => setForm(prev => ({ ...prev, won: value }))} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Input label="Nuls" field="drawn" type="number" value={form.drawn || ''} onChange={(value) => setForm(prev => ({ ...prev, drawn: value }))} />
                  <Input label="Défaites" field="lost" type="number" value={form.lost || ''} onChange={(value) => setForm(prev => ({ ...prev, lost: value }))} />
                  <Input label="Buts pour" field="goals_for" type="number" value={form.goals_for || ''} onChange={(value) => setForm(prev => ({ ...prev, goals_for: value }))} />
                </div>
                <Input label="Buts contre" field="goals_against" type="number" value={form.goals_against || ''} onChange={(value) => setForm(prev => ({ ...prev, goals_against: value }))} />
                <button onClick={handleStandingSubmit} className="relative overflow-hidden w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg" style={{
                  background: `linear-gradient(135deg, ${team?.secondary_color || '#e0f2fe'} 0%, ${team?.primary_color || '#020617'} 50%, ${team?.secondary_color || '#e0f2fe'} 100%)`,
                  borderColor: '#0ea5e9',
                  boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
                }}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#0ea5e9]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#0284c7]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    <Save size={16} /> {editing ? 'Mettre à jour' : 'Ajouter'}
                  </div>
                </button>
              </div>
            )}
            {/* Table header */}
            {!showForm && filteredStandings.length > 0 && (
              <div className="rounded-xl bg-white shadow-md overflow-hidden">
                <div className="grid grid-cols-7 gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100">
                  <div className="text-xs font-bold text-gray-600">#</div>
                  <div className="text-xs font-bold text-gray-600 col-span-2">Équipe</div>
                  <div className="text-xs font-bold text-gray-600 text-center">Pts</div>
                  <div className="text-xs font-bold text-gray-600 text-center">BP</div>
                  <div className="text-xs font-bold text-gray-600 text-center">BC</div>
                  <div className="text-xs font-bold text-gray-600 text-center">Diff</div>
                </div>
                {filteredStandings
                  .sort((a, b) => {
                    if (b.points !== a.points) return b.points - a.points;
                    const gdA = a.goals_for - a.goals_against;
                    const gdB = b.goals_for - b.goals_against;
                    return gdB - gdA;
                  })
                  .map((s, idx) => (
                  <div key={s.id} className="grid grid-cols-7 gap-2 px-3 py-2 border-b border-gray-50 hover:bg-gray-50 transition-colors items-center">
                    <div className="text-xs font-bold text-gray-600">{s.position || idx + 1}</div>
                    <div className="text-xs font-semibold text-gray-900 truncate col-span-2">{s.team_name}</div>
                    <div className="text-xs text-gray-600 text-center">{s.points}</div>
                    <div className="text-xs text-gray-600 text-center">{s.goals_for}</div>
                    <div className="text-xs text-gray-600 text-center">{s.goals_against}</div>
                    <div className="text-xs font-bold text-gray-600 text-center">{s.goals_for - s.goals_against}</div>
                    <div className="col-span-7 flex gap-1 mt-1">
                      <button onClick={() => startEdit(s, ['team_name','position','points','played','won','drawn','lost','goals_for','goals_against'])} className="p-1 text-gray-400 hover:text-blue-500 transition-colors"><Edit2 size={12} /></button>
                      <button onClick={() => handleDelete('standings', s.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!showForm && filteredStandings.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">Aucune équipe dans cette compétition</div>
            )}
          </>
        )}

        {/* STATS TAB */}
        {tab === 'stats' && (
          <>
            {/* Competition filter - dropdown */}
            <div className="relative">
              <select
                value={statsComp}
                onChange={(e) => setStatsComp(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 appearance-none shadow-md"
              >
                <option value="">Sélectionner une compétition</option>
                {competitions.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            {!showForm && (
              <button onClick={() => { setShowForm(true); setEditing(null); setForm({ goals: '0', assists: '0', matches_played: '0', competition_name: statsComp }); }}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold btn-shadow flex items-center justify-center gap-2" style={{ backgroundColor: team?.secondary_color || '#22c55e' }}>
                <Plus size={16} /> Ajouter des stats
              </button>
            )}
            {showForm && tab === 'stats' && (
              <div className="rounded-2xl bg-white p-4 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold">{editing ? 'Modifier' : 'Ajouter'} des statistiques</h3>
                  <button onClick={() => { setShowForm(false); setEditing(null); setForm({}); }} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <Select label="Joueur" field="player_id" options={players.map(p => ({ value: p.id, label: `${p.name} (${POSITION_LABELS[p.position]})` }))} value={form.player_id || ''} onChange={(value) => setForm(prev => ({ ...prev, player_id: value }))} />
                <Select label="Compétition" field="competition_name" options={competitions.map(c => ({ value: c.name, label: c.name }))} value={form.competition_name || statsComp || ''} onChange={(value) => setForm(prev => ({ ...prev, competition_name: value }))} />
                <div className="grid grid-cols-3 gap-3">
                  <Input label="Buts" field="goals" type="number" value={form.goals || ''} onChange={(value) => setForm(prev => ({ ...prev, goals: value }))} />
                  <Input label="Passes D." field="assists" type="number" value={form.assists || ''} onChange={(value) => setForm(prev => ({ ...prev, assists: value }))} />
                  <Input label="Matchs J." field="matches_played" type="number" value={form.matches_played || ''} onChange={(value) => setForm(prev => ({ ...prev, matches_played: value }))} />
                </div>
                <button onClick={handleStatSubmit} className="w-full py-2.5 rounded-xl text-white text-sm font-semibold btn-shadow flex items-center justify-center gap-2" style={{ backgroundColor: team?.secondary_color || '#22c55e' }}>
                  <Save size={16} /> {editing ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            )}
            <div className="space-y-2">
              {playerStats.filter(s => !statsComp || s.competition_name === statsComp).map(s => {
                const player = players.find(p => p.id === s.player_id);
                return (
                  <div key={s.id} className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-md">
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center overflow-hidden border border-green-200">
                      {player?.photo_url ? <img src={player.photo_url} alt="" className="w-full h-full object-cover" /> : <span className="text-[10px] font-bold text-green-600">{player?.jersey_number || ''}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-900 truncate">{player?.name || 'Inconnu'}</div>
                      <div className="text-xs text-gray-400">{s.competition_name}</div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="flex items-center gap-0.5 font-bold text-green-600">{s.goals} <Target size={10} /></span>
                      <span className="text-gray-200">|</span>
                      <span className="font-bold text-blue-600">{s.assists} P</span>
                    </div>
                    <button onClick={() => startEdit(s, ['player_id','competition_name','goals','assists','matches_played'])} className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete('player_stats', s.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* GALLERY TAB */}
        {tab === 'gallery' && (
          <>
            {!showForm && (
              <button onClick={() => { setShowForm(true); setEditing(null); setForm({ type: 'image', event_type: 'other' }); }}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold btn-shadow flex items-center justify-center gap-2" style={{ backgroundColor: team?.secondary_color || '#22c55e' }}>
                <Plus size={16} /> Ajouter un média
              </button>
            )}
            {showForm && tab === 'gallery' && (
              <div className="rounded-2xl bg-white p-4 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold">{editing ? 'Modifier' : 'Ajouter'} un média</h3>
                  <button onClick={() => { setShowForm(false); setEditing(null); setForm({}); }} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <Select label="Type" field="type" options={[{ value: 'image', label: 'Image' }, { value: 'video', label: 'Vidéo' }]} value={form.type || ''} onChange={(value) => setForm(prev => ({ ...prev, type: value }))} />
                <FileUpload
                  value={form.url || null}
                  onChange={(url) => setForm(prev => ({ ...prev, url }))}
                  onTypeChange={(type) => setForm(prev => ({ ...prev, type }))}
                  label="Fichier"
                  accept="image/*,video/*"
                  teamId={team?.id}
                />
                <Input label="Légende" field="caption" placeholder="Description..." value={form.caption || ''} onChange={(value) => setForm(prev => ({ ...prev, caption: value }))} />
                <Select label="Type événement" field="event_type" options={[
                  { value: 'match', label: 'Match' }, { value: 'training', label: 'Entraînement' }, { value: 'other', label: 'Autre' },
                ]} value={form.event_type || ''} onChange={(value) => setForm(prev => ({ ...prev, event_type: value }))} />
                <button onClick={handleGallerySubmit} className="w-full py-2.5 rounded-xl text-white text-sm font-semibold btn-shadow flex items-center justify-center gap-2" style={{ backgroundColor: team?.secondary_color || '#22c55e' }}>
                  <Save size={16} /> {editing ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              {gallery.map(g => (
                <div key={g.id} className="relative group">
                  <div className="aspect-square rounded-xl overflow-hidden shadow-md">
                    {g.type === 'video' ? (
                      <video src={g.url} className="w-full h-full object-cover" muted />
                    ) : (
                      <Image
                        src={g.url}
                        alt={g.caption || ''}
                        width={200}
                        height={200}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>
                  {g.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-lg">
                        <Play size={14} className="text-green-600 ml-0.5" />
                      </div>
                    </div>
                  )}
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(g, ['type','url','caption','event_type'])} className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center shadow"><Edit2 size={10} className="text-blue-500" /></button>
                    <button onClick={() => handleDelete('gallery', g.id)} className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center shadow"><Trash2 size={10} className="text-red-500" /></button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* COMPETITIONS TAB */}
        {tab === 'competitions' && (
          <>
            {!showForm && (
              <button onClick={() => { setShowForm(true); setEditing(null); setForm({}); }}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold btn-shadow flex items-center justify-center gap-2" style={{ backgroundColor: team?.secondary_color || '#22c55e' }}>
                <Plus size={16} /> Ajouter une compétition
              </button>
            )}
            {showForm && tab === 'competitions' && (
              <div className="rounded-2xl bg-white p-4 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold">{editing ? 'Modifier' : 'Ajouter'} une compétition</h3>
                  <button onClick={() => { setShowForm(false); setEditing(null); setForm({}); }} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <Input label="Nom de la compétition" field="name" placeholder="Ex: Coupe Maire" value={form.name || ''} onChange={(value) => setForm(prev => ({ ...prev, name: value }))} />
                <button onClick={handleCompetitionSubmit} className="w-full py-2.5 rounded-xl text-white text-sm font-semibold btn-shadow flex items-center justify-center gap-2" style={{ backgroundColor: team?.secondary_color || '#22c55e' }}>
                  <Save size={16} /> {editing ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            )}
            <div className="space-y-2">
              {competitions.map(c => (
                <div key={c.id} className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-md">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900 truncate">{c.name}</div>
                  </div>
                  <button onClick={() => startEdit(c, ['name'])} className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete('competitions', c.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* USERS TAB */}
        {tab === 'users' && (
          <>
            {!showForm && (
              <button onClick={() => { setShowForm(true); setEditing(null); setForm({}); }}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold btn-shadow flex items-center justify-center gap-2" style={{ backgroundColor: team?.secondary_color || '#22c55e' }}>
                <Plus size={16} /> Ajouter un utilisateur
              </button>
            )}
            {showForm && tab === 'users' && (
              <div className="rounded-2xl bg-white p-4 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold">{editing ? 'Modifier' : 'Ajouter'} un membre</h3>
                  <button onClick={() => { setShowForm(false); setEditing(null); setForm({}); }} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <Input label="Email" field="email" type="email" placeholder={`Ex: membre@${team?.slug || 'team.com'}`} value={form.email || ''} onChange={(value) => setForm(prev => ({ ...prev, email: value }))} />
                <Input label="Mot de passe" field="password" type="password" placeholder="Mot de passe" value={form.password || ''} onChange={(value) => setForm(prev => ({ ...prev, password: value }))} />
                <p className="text-xs text-gray-500">L'email doit appartenir au domaine de l'équipe: {team?.slug || team?.slug}</p>
                <button onClick={handleUserSubmit} className="w-full py-2.5 rounded-xl text-white text-sm font-semibold btn-shadow flex items-center justify-center gap-2" style={{ backgroundColor: team?.secondary_color || '#22c55e' }}>
                  <Save size={16} /> {editing ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            )}
            <div className="space-y-2">
              {users.map(u => (
                <div key={u.id} className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-md">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900 truncate">{u.email}</div>
                    <div className="text-xs text-gray-400">{u.role === 'admin' ? 'Admin' : 'Membre'}</div>
                  </div>
                  {u.role !== 'admin' && (
                    <button onClick={() => handleDelete('users', u.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                  )}
                </div>
              ))}
              {users.length === 0 && !showForm && (
                <div className="text-center py-8 text-gray-400 text-sm">Aucun membre dans l'équipe</div>
              )}
            </div>
          </>
        )}

        {/* SETTINGS TAB */}
        {tab === 'settings' && <SettingsCard team={team} user={user} loadAll={loadAll} />}
      </div>
    </AppShell>
  );
}

// Settings Card Component
function SettingsCard({ team, user, loadAll }: { team: any; user: any; loadAll: () => void }) {
  const { refreshTeam } = useTeam();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#020617');
  const [secondaryColor, setSecondaryColor] = useState('#e0f2fe');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [teamPhotoFile, setTeamPhotoFile] = useState<File | null>(null);
  const [teamPhotoPreview, setTeamPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (team) {
      setName(team.name);
      setSlug(team.slug);
      setDescription(team.description || '');
      setPrimaryColor(team.primary_color || '#020617');
      setSecondaryColor(team.secondary_color || '#e0f2fe');
      setLogoPreview(team.logo_url);
      setTeamPhotoPreview(team.team_photo_url);
    }
  }, [team]);

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

  const handleSave = async () => {
    if (!team) return;

    setSaving(true);
    setSuccess(false);

    try {
      let logoUrl = team.logo_url;
      let teamPhotoUrl = team.team_photo_url;

      // Upload logo if changed
      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);
        formData.append('team_id', team.id);
        formData.append('type', 'team');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Logo upload failed');
        }

        const data = await response.json();
        logoUrl = data.url;
      }

      // Upload team photo if changed
      if (teamPhotoFile) {
        const formData = new FormData();
        formData.append('file', teamPhotoFile);
        formData.append('team_id', team.id);
        formData.append('type', 'team');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Team photo upload failed');
        }

        const data = await response.json();
        teamPhotoUrl = data.url;
      }

      // Update team via API route
      const payload = {
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
      };

      const response = await fetch('/api/admin/team', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update team');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      await refreshTeam(true); // Refresh team context to update colors
      loadAll();
    } catch (error) {
      console.error('Error saving team settings:', error);
      alert('Erreur lors de la sauvegarde: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
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
            <Settings size={20} className="text-white" />
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
            <Settings size={20} className="text-white" />
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
            <Settings size={20} className="text-white" />
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
            <Settings size={20} className="text-white" />
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

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center justify-center gap-2 px-4 py-3 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden w-full"
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
  );
}
