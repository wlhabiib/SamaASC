'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Player, Coach, PlayerStat, MatchLineup, Match, Competition, POSITION_LABELS } from '@/lib/types';
import AppShell from '@/components/app-shell';
import { useTeam } from '@/contexts/team-context';
import { fetchWithCache } from '@/utils/cache';
import { Shirt, User, Target, Footprints, Trophy, Medal, ChevronDown, Users } from 'lucide-react';

const FORMATIONS: Record<string, { slot: number; x: number; y: number; label: string }[]> = {
  '4-3-3': [
    { slot: 0, x: 50, y: 90, label: 'GK' },
    { slot: 1, x: 20, y: 70, label: 'DEF' },
    { slot: 2, x: 40, y: 72, label: 'DEF' },
    { slot: 3, x: 60, y: 72, label: 'DEF' },
    { slot: 4, x: 80, y: 70, label: 'DEF' },
    { slot: 5, x: 25, y: 48, label: 'MIL' },
    { slot: 6, x: 50, y: 45, label: 'MIL' },
    { slot: 7, x: 75, y: 48, label: 'MIL' },
    { slot: 8, x: 30, y: 22, label: 'ATT' },
    { slot: 9, x: 50, y: 18, label: 'ATT' },
    { slot: 10, x: 70, y: 22, label: 'ATT' },
  ],
  '4-4-2': [
    { slot: 0, x: 50, y: 90, label: 'GK' },
    { slot: 1, x: 15, y: 70, label: 'DEF' },
    { slot: 2, x: 38, y: 72, label: 'DEF' },
    { slot: 3, x: 62, y: 72, label: 'DEF' },
    { slot: 4, x: 85, y: 70, label: 'DEF' },
    { slot: 5, x: 15, y: 48, label: 'MIL' },
    { slot: 6, x: 38, y: 48, label: 'MIL' },
    { slot: 7, x: 62, y: 48, label: 'MIL' },
    { slot: 8, x: 85, y: 48, label: 'MIL' },
    { slot: 9, x: 35, y: 22, label: 'ATT' },
    { slot: 10, x: 65, y: 22, label: 'ATT' },
  ],
  '3-5-2': [
    { slot: 0, x: 50, y: 90, label: 'GK' },
    { slot: 1, x: 25, y: 72, label: 'DEF' },
    { slot: 2, x: 50, y: 74, label: 'DEF' },
    { slot: 3, x: 75, y: 72, label: 'DEF' },
    { slot: 4, x: 10, y: 50, label: 'MIL' },
    { slot: 5, x: 30, y: 46, label: 'MIL' },
    { slot: 6, x: 50, y: 42, label: 'MIL' },
    { slot: 7, x: 70, y: 46, label: 'MIL' },
    { slot: 8, x: 90, y: 50, label: 'MIL' },
    { slot: 9, x: 35, y: 20, label: 'ATT' },
    { slot: 10, x: 65, y: 20, label: 'ATT' },
  ],
};

export default function EquipePage() {
  const router = useRouter();
  const { team, user, loading: contextLoading } = useTeam();
  const [players, setPlayers] = useState<Player[]>([]);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [stats, setStats] = useState<PlayerStat[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [lineups, setLineups] = useState<MatchLineup[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'field' | 'list' | 'stats'>('field');
  const [statsComp, setStatsComp] = useState<string>('all');
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [selectedFormation, setSelectedFormation] = useState<string>('4-3-3');

  // Authentication check - must be before early return
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
    }
  }, [team, user, contextLoading, router]);

  // Data loading
  useEffect(() => {
    async function load() {
      if (!team) return;

      try {
        const [p, c, s, m, l, comp] = await Promise.all([
          fetchWithCache<Player[]>(`/api/data/players?team_id=${team.id}`, `players_${team.id}`),
          fetchWithCache<Coach>(`/api/data/coach?team_id=${team.id}`, `coach_${team.id}`),
          fetchWithCache<PlayerStat[]>(`/api/data/player-stats?team_id=${team.id}`, `stats_${team.id}`),
          fetchWithCache<Match[]>(`/api/data/matches?team_id=${team.id}`, `matches_${team.id}`),
          fetchWithCache<MatchLineup[]>(`/api/data/match-lineup?team_id=${team.id}`, `lineups_${team.id}`),
          fetchWithCache<Competition[]>(`/api/data/competitions?team_id=${team.id}`, `competitions_${team.id}`),
        ]);

        setPlayers(p);
        if (c) setCoach(c);
        setStats(s);
        setMatches(m);
        setLineups(l);
        setCompetitions(comp || []);

        // Auto-select next upcoming match
        const upcoming = m.find(m => m.status === 'upcoming');
        if (upcoming) {
          setSelectedMatchId(upcoming.id);
          setSelectedFormation(upcoming.formation || '4-3-3');
        }
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

  const upcomingMatches = useMemo(() => matches.filter(m => m.status === 'upcoming'), [matches]);
  const selectedMatch = useMemo(() => matches.find(m => m.id === selectedMatchId), [matches, selectedMatchId]);

  // Get starting 11 from lineup for selected match
  const matchLineup = useMemo(() => lineups.filter(l => l.match_id === selectedMatchId && !l.is_substitute), [lineups, selectedMatchId]);
  const matchSubstitutes = useMemo(() => lineups.filter(l => l.match_id === selectedMatchId && l.is_substitute), [lineups, selectedMatchId]);

  // If no lineup set, fall back to players with is_starter=true
  const starters = matchLineup.length > 0
    ? matchLineup.sort((a, b) => a.position_slot - b.position_slot).map(l => players.find(p => p.id === l.player_id)).filter(Boolean) as Player[]
    : players.filter(p => p.is_starter);
  const substitutes = matchSubstitutes.length > 0
    ? matchSubstitutes.map(l => players.find(p => p.id === l.player_id)).filter(Boolean) as Player[]
    : players.filter(p => !starters.includes(p));

  const formationPositions = FORMATIONS[selectedFormation] || FORMATIONS['4-3-3'];
  const competitionNames = competitions.map(c => c.name);
  const filteredStats = statsComp === 'all' ? stats : stats.filter(s => (s as any).season === statsComp);

  // Aggregate stats per player
  const aggregated: { player: Player; goals: number; assists: number; matches: number }[] = [];
  if (statsComp === 'all') {
    const map = new Map<string, { goals: number; assists: number; matches: number }>();
    filteredStats.forEach(s => {
      const cur = map.get(s.player_id) || { goals: 0, assists: 0, matches: 0 };
      cur.goals += s.goals;
      cur.assists += s.assists;
      cur.matches += s.matches_played;
      map.set(s.player_id, cur);
    });
    map.forEach((v, pid) => {
      const player = players.find(p => p.id === pid);
      if (player) aggregated.push({ player, ...v });
    });
    aggregated.sort((a, b) => b.goals - a.goals || b.assists - a.assists);
  }

  const topScorers = statsComp === 'all' ? aggregated : filteredStats
    .map(s => ({ player: s.player || players.find(p => p.id === s.player_id)!, goals: s.goals, assists: s.assists, matches: s.matches_played }))
    .filter(s => s.player)
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists);

  const topAssisters = [...topScorers].sort((a, b) => b.assists - a.assists || b.goals - a.goals);

  const getPlayerGoals = (pid: string) => {
    if (statsComp === 'all') return aggregated.find(a => a.player.id === pid)?.goals || 0;
    return filteredStats.find(s => s.player_id === pid)?.goals || 0;
  };

  const getPlayerAssists = (pid: string) => {
    if (statsComp === 'all') return aggregated.find(a => a.player.id === pid)?.assists || 0;
    return filteredStats.find(s => s.player_id === pid)?.assists || 0;
  };

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
              <Users size={24} className="text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold drop-shadow-md" style={{ color: team?.primary_color || '#020617' }}>Mon Équipe</h1>
            <p className="text-sm drop-shadow-sm" style={{ color: team?.primary_color || '#020617' }}>Joueurs et composition</p>
          </div>
        </div>

        {/* Coach */}
        {coach && (
          <div className="rounded-xl p-4 shadow-lg flex items-center gap-3 relative overflow-hidden" style={{
            background: `linear-gradient(135deg, ${team?.secondary_color || '#e0f2fe'} 0%, ${team?.primary_color || '#020617'} 100%)`,
            borderColor: '#0ea5e9',
            boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
          }}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#0ea5e9]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-[#0284c7]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border-2 border-white/30">
                {coach.photo_url ? (
                  <Image
                    src={coach.photo_url}
                    alt={coach.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={24} className="text-white" />
                )}
              </div>
              <div>
                <div className="text-white/70 text-xs font-medium">{coach.role}</div>
                <div className="text-white font-bold">{coach.name}</div>
              </div>
            </div>
          </div>
        )}

        {/* View Toggle */}
        <div className="flex gap-2">
          {[
            { key: 'field' as const, label: 'Terrain' },
            { key: 'list' as const, label: 'Liste' },
            { key: 'stats' as const, label: 'Stats' },
          ].map(v => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300 relative overflow-hidden ${
                view === v.key
                  ? 'text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              style={{
                background: view === v.key ? `linear-gradient(135deg, ${team?.secondary_color || '#e0f2fe'} 0%, ${team?.primary_color || '#020617'} 50%, ${team?.secondary_color || '#e0f2fe'} 100%)` : undefined,
                borderColor: view === v.key ? '#0ea5e9' : undefined,
                boxShadow: view === v.key ? '0 4px 30px -4px rgba(14, 165, 233, 0.3)' : undefined
              }}
            >
              {view === v.key && (
                <>
                  <div className="absolute top-0 right-0 w-20 h-20 bg-[#0ea5e9]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-16 h-16 bg-[#0284c7]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                </>
              )}
              <span className="relative z-10">{v.label}</span>
            </button>
          ))}
        </div>

        {/* Field View */}
        {view === 'field' && (
          <>
            {/* Match selector */}
            {matches.length > 0 && (
              <div className="space-y-2">
                <div className="relative">
                  <select
                    value={selectedMatchId}
                    onChange={(e) => {
                      const m = matches.find(m => m.id === e.target.value);
                      setSelectedMatchId(e.target.value);
                      if (m) setSelectedFormation(m.formation || '4-3-3');
                    }}
                    className="w-full rounded-xl border px-3 py-2.5 text-sm input-shadow focus:outline-none focus:ring-2 appearance-none bg-white font-medium"
                    style={{
                      borderColor: team?.secondary_color || '#e5e7eb',
                    }}
                  >
                    <option value="">Selectionner un match</option>
                    {matches.length > 0 && (
                      <optgroup label="Matchs à venir">
                        {matches.filter(m => m.status === 'upcoming').map(m => (
                          <option key={m.id} value={m.id}>
                            vs {m.opponent} - {m.match_date}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {matches.length > 0 && (
                      <optgroup label="Historique (matchs passés)">
                        {matches.filter(m => m.status === 'completed').map(m => (
                          <option key={m.id} value={m.id}>
                            vs {m.opponent} - {m.match_date} ({m.score_home || 0}-{m.score_away || 0})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>

                {/* Formation filter */}
                <div className="flex gap-2">
                  {Object.keys(FORMATIONS).map(f => (
                    <button
                      key={f}
                      onClick={() => setSelectedFormation(f)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold tracking-wider transition-all duration-300 relative overflow-hidden ${
                        selectedFormation === f
                          ? 'text-white shadow-lg'
                          : 'bg-white text-gray-600 shadow-sm hover:shadow-md'
                      }`}
                      style={{
                        background: selectedFormation === f ? `linear-gradient(135deg, ${team?.secondary_color || '#e0f2fe'} 0%, ${team?.primary_color || '#020617'} 50%, ${team?.secondary_color || '#e0f2fe'} 100%)` : undefined,
                        borderColor: selectedFormation === f ? '#0ea5e9' : undefined,
                        boxShadow: selectedFormation === f ? '0 4px 30px -4px rgba(14, 165, 233, 0.3)' : undefined
                      }}
                    >
                      {selectedFormation === f && (
                        <>
                          <div className="absolute top-0 right-0 w-16 h-16 bg-[#0ea5e9]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                          <div className="absolute bottom-0 left-0 w-12 h-12 bg-[#0284c7]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                        </>
                      )}
                      <span className="relative z-10">{f}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Match info banner */}
            {selectedMatch && (
              <div className="relative overflow-hidden rounded-xl border p-3" style={{
                background: `linear-gradient(135deg, ${team?.secondary_color || '#e0f2fe'} 0%, ${team?.primary_color || '#020617'} 50%, ${team?.secondary_color || '#e0f2fe'} 100%)`,
                borderColor: '#0ea5e9',
                boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
              }}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#0ea5e9]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#0284c7]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                <div className="relative flex items-center justify-between">
                  <div>
                    <div className="text-xs text-sky-600 font-medium">Prochain match</div>
                    <div className="font-bold text-sm text-sky-900">vs {selectedMatch.opponent}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-sky-600">{selectedMatch.match_date}</div>
                    <div className="text-xs font-bold text-sky-700">Formation {selectedFormation}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Field */}
            <div className="field-pattern rounded-2xl h-[420px] relative shadow-xl overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-10 border-b-2 border-l-2 border-r-2 border-white/25" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-10 border-t-2 border-l-2 border-r-2 border-white/25" />

              {/* Formation label */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/30 backdrop-blur-sm rounded-full">
                <span className="text-white text-xs font-bold tracking-wider">{selectedFormation}</span>
              </div>

              {formationPositions.map((pos, idx) => {
                const player = starters[idx];
                if (!player) return null;
                return (
                  <div
                    key={pos.slot}
                    className="absolute flex flex-col items-center"
                    style={{
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <div className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center overflow-hidden border-2 border-white hover:scale-110 transition-transform duration-200 cursor-pointer relative">
                      {player.photo_url ? (
                        <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
                      ) : (
                        <Shirt size={20} style={{ color: team?.secondary_color || '#16a34a' }} />
                      )}
                      {player.jersey_number && (
                        <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white" style={{ backgroundColor: team?.accent_color || '#16a34a' }}>
                          <span className="text-white text-[9px] font-bold">{player.jersey_number}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-1 px-2 py-0.5 bg-black/40 backdrop-blur-sm rounded-full">
                      <span className="text-white text-[9px] font-bold whitespace-nowrap">
                        {player.name.split(' ').pop()}
                      </span>
                    </div>
                    <span className="text-white/60 text-[8px] font-medium">
                      {POSITION_LABELS[player.position]}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Substitutes */}
            {substitutes.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-2">Remplaçants</h3>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {substitutes.map(p => (
                    <div key={p.id} className="flex flex-col items-center gap-1 min-w-[64px]">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200">
                        {p.photo_url ? (
                          <Image
                            src={p.photo_url}
                            alt={p.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <Shirt size={18} className="text-gray-400" />
                        )}
                      </div>
                      <span className="text-[9px] font-medium text-gray-500 truncate w-16 text-center">{p.name.split(' ').pop()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* List View - all players, admin picks starting 11 from admin page */}
        {view === 'list' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-700">Tous les joueurs ({players.length})</h3>
            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center gap-3 rounded-xl p-3 shadow-md hover-lift relative overflow-hidden transition-all duration-300 hover:scale-[1.01]"
                  style={{
                    background: `linear-gradient(135deg, ${team?.secondary_color || '#e0f2fe'} 0%, ${team?.primary_color || '#020617'} 50%, ${team?.secondary_color || '#e0f2fe'} 100%)`,
                    borderColor: '#0ea5e9',
                    boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
                  }}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#0ea5e9]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-[#0284c7]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                  <div className="relative z-10 flex items-center gap-3 w-full">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-2 relative" style={{ backgroundColor: team?.secondary_color ? `${team.secondary_color}20` : '#dcfce7', borderColor: team?.secondary_color || '#bbf7d0' }}>
                      {player.photo_url ? (
                        <Image
                          src={player.photo_url}
                          alt={player.name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <Shirt size={20} style={{ color: team?.secondary_color || '#16a34a' }} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-white">{player.name}</div>
                      <div className="text-xs text-sky-200">{POSITION_LABELS[player.position]}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs">
                        <Target size={12} style={{ color: '#e0f2fe' }} />
                        <span className="font-bold text-white">{getPlayerGoals(player.id)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Footprints size={12} style={{ color: '#bae6fd' }} />
                        <span className="font-bold text-white">{getPlayerAssists(player.id)}</span>
                      </div>
                    </div>
                    {player.jersey_number && (
                      <div className="w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold shadow-sm relative overflow-hidden" style={{
                        background: `linear-gradient(135deg, ${team?.secondary_color || '#e0f2fe'} 0%, ${team?.primary_color || '#020617'} 50%, ${team?.secondary_color || '#e0f2fe'} 100%)`,
                        borderColor: '#0ea5e9',
                        boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
                      }}>
                        <div className="absolute top-0 right-0 w-8 h-8 bg-[#0ea5e9]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-6 h-6 bg-[#0284c7]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                        <span className="relative z-10">{player.jersey_number}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats View */}
        {view === 'stats' && (
          <div className="space-y-4">
            {/* Competition filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <button
                onClick={() => setStatsComp('all')}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 relative overflow-hidden ${
                  statsComp === 'all'
                    ? 'text-white shadow-lg'
                    : 'bg-white text-gray-600 shadow-sm hover:shadow-md'
                }`}
                style={{
                  background: statsComp === 'all' ? `linear-gradient(135deg, ${team?.secondary_color || '#e0f2fe'} 0%, ${team?.primary_color || '#020617'} 50%, ${team?.secondary_color || '#e0f2fe'} 100%)` : undefined,
                  borderColor: statsComp === 'all' ? '#0ea5e9' : undefined,
                  boxShadow: statsComp === 'all' ? '0 4px 30px -4px rgba(14, 165, 233, 0.3)' : undefined
                }}
              >
                {statsComp === 'all' && (
                  <>
                    <div className="absolute top-0 right-0 w-16 h-16 bg-[#0ea5e9]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-12 h-12 bg-[#0284c7]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                  </>
                )}
                <span className="relative z-10">Toutes</span>
              </button>
              {competitionNames.map(c => (
                <button
                  key={c}
                  onClick={() => setStatsComp(c)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 relative overflow-hidden ${
                    statsComp === c
                      ? 'text-white shadow-lg'
                      : 'bg-white text-gray-600 shadow-sm hover:shadow-md'
                  }`}
                  style={{
                    background: statsComp === c ? `linear-gradient(135deg, ${team?.secondary_color || '#e0f2fe'} 0%, ${team?.primary_color || '#020617'} 50%, ${team?.secondary_color || '#e0f2fe'} 100%)` : undefined,
                    borderColor: statsComp === c ? '#0ea5e9' : undefined,
                    boxShadow: statsComp === c ? '0 4px 30px -4px rgba(14, 165, 233, 0.3)' : undefined
                  }}
                >
                  {statsComp === c && (
                    <>
                      <div className="absolute top-0 right-0 w-16 h-16 bg-[#0ea5e9]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                      <div className="absolute bottom-0 left-0 w-12 h-12 bg-[#0284c7]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                    </>
                  )}
                  <span className="relative z-10">{c}</span>
                </button>
              ))}
            </div>

            {/* Top Scorer Card */}
            <div className="rounded-2xl bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 p-4 text-white shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={16} />
                <span className="text-sm font-bold">Meilleur Buteur</span>
              </div>
              {topScorers.length > 0 && topScorers[0] && (
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border-2 border-white/30 shadow-lg">
                      {topScorers[0].player?.photo_url ? (
                        <img src={topScorers[0].player.photo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Target size={24} className="text-white" />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center shadow-md">
                      <Medal size={14} className="text-amber-900" />
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-lg">{topScorers[0].player?.name}</div>
                    <div className="flex items-center gap-3 text-green-200 text-sm">
                      <span className="flex items-center gap-1"><Target size={12} /> {topScorers[0].goals} but{topScorers[0].goals !== 1 ? 's' : ''}</span>
                      <span className="flex items-center gap-1"><Footprints size={12} /> {topScorers[0].assists} passe{topScorers[0].assists !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Top Assister Card */}
            <div className="rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-4 text-white shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <Footprints size={16} />
                <span className="text-sm font-bold">Meilleur Passeur</span>
              </div>
              {topAssisters.length > 0 && topAssisters[0] && topAssisters[0].assists > 0 && (
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border-2 border-white/30 shadow-lg">
                      {topAssisters[0].player?.photo_url ? (
                        <img src={topAssisters[0].player.photo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Footprints size={24} className="text-white" />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-sky-400 flex items-center justify-center shadow-md">
                      <Medal size={14} className="text-sky-900" />
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-lg">{topAssisters[0].player?.name}</div>
                    <div className="flex items-center gap-3 text-blue-200 text-sm">
                      <span className="flex items-center gap-1"><Footprints size={12} /> {topAssisters[0].assists} passe{topAssisters[0].assists !== 1 ? 's' : ''}</span>
                      <span className="flex items-center gap-1"><Target size={12} /> {topAssisters[0].goals} but{topAssisters[0].goals !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Full Stats Table */}
            <div className="rounded-2xl bg-white shadow-lg overflow-hidden">
              <div className="px-3 py-2.5 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Statistiques {statsComp !== 'all' ? `- ${statsComp}` : '- Toutes compétitions'}
                </span>
              </div>
              <div className="grid grid-cols-[1fr_40px_40px_40px] gap-1 px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                <div>Joueur</div>
                <div className="text-center">Buts</div>
                <div className="text-center">Passes</div>
                <div className="text-center">MJ</div>
              </div>
              {topScorers.map((s, idx) => (
                <div
                  key={s.player.id + (statsComp === 'all' ? '-all' : `-${idx}`)}
                  className={`grid grid-cols-[1fr_40px_40px_40px] gap-1 px-3 py-2.5 text-xs items-center transition-colors duration-200 ${
                    idx === 0 ? 'bg-amber-50/50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  } ${idx < topScorers.length - 1 ? 'border-b border-gray-50' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {s.player?.photo_url ? (
                        <img src={s.player.photo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[9px] font-bold text-green-600">{s.player?.jersey_number || ''}</span>
                      )}
                    </div>
                    <span className="font-semibold text-gray-800 truncate">{s.player?.name}</span>
                  </div>
                  <div className="text-center">
                    <span className={`font-bold ${s.goals > 0 ? 'text-green-600' : 'text-gray-300'}`}>{s.goals}</span>
                  </div>
                  <div className="text-center">
                    <span className={`font-bold ${s.assists > 0 ? 'text-blue-600' : 'text-gray-300'}`}>{s.assists}</span>
                  </div>
                  <div className="text-center text-gray-400">{s.matches}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
