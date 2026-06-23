'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Match, Player, MatchVote, Competition } from '@/lib/types';
import AppShell from '@/components/app-shell';
import { useTeam } from '@/contexts/team-context';
import { Trophy, Calendar, MapPin, ThumbsUp, Check, ScrollText, X } from 'lucide-react';

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function ResultatsPage() {
  const router = useRouter();
  const { team, user, loading: contextLoading } = useTeam();
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [votes, setVotes] = useState<MatchVote[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [voterName, setVoterName] = useState('');
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [votedFor, setVotedFor] = useState<string | null>(null);
  const [selectedCompetition, setSelectedCompetition] = useState<string>('');
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [voteError, setVoteError] = useState<string>('');

  useEffect(() => {
    // Check authentication
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

  useEffect(() => {
    async function load() {
      if (!team) return;
      
      const [m, p, v, c] = await Promise.all([
        fetch(`/api/data/matches?team_id=${team.id}`).then(r => r.json()),
        fetch(`/api/data/players?team_id=${team.id}`).then(r => r.json()),
        fetch(`/api/data/match-votes?team_id=${team.id}`).then(r => r.json()).catch(() => []),
        fetch(`/api/data/competitions?team_id=${team.id}`).then(r => r.json()).catch(() => []),
      ]);
      setMatches(m);
      setPlayers(p);
      setVotes(v);
      setCompetitions(c || []);
      setLoading(false);
    }
    load();

    // Setup realtime subscriptions - DISABLED (Supabase removed)
    // if (team && supabase) {
    //   const channels: any[] = [];
    //   const tables = ['matches', 'players', 'match_votes'];

    //   tables.forEach(table => {
    //     const channel = supabase!
    //       .channel(`${table}-changes`)
    //       .on(
    //         'postgres_changes',
    //         {
    //           event: '*',
    //           schema: 'public',
    //           table: table,
    //           filter: `team_id=eq.${team.id}`,
    //         },
    //         () => {
    //           load();
    //         }
    //       )
    //       .subscribe();
    //     channels.push(channel);
    //   });

    //   return () => {
    //     channels.forEach(channel => supabase!.removeChannel(channel));
    //   };
    // }
  }, [team]);

  const handleVote = async (matchId: string, playerId: string) => {
    if (!voterName.trim() || !team) return;
    
    // Check if user has already voted for this match
    const existingVote = votes.find(v => v.match_id === matchId && v.voter_name === voterName.trim());
    if (existingVote) {
      setVoteError('Vous avez déjà voté pour ce match');
      return;
    }
    
    setVoteError('');
    try {
      const response = await fetch('/api/match-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          match_id: matchId, 
          player_id: playerId, 
          voter_name: voterName.trim(), 
          team_id: team.id 
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setVoteError(data.error || 'Erreur lors du vote');
        return;
      }
      
      setVotes(prev => [...prev, data]);
      setVotedFor(playerId);
    } catch (error) {
      setVoteError('Erreur lors du vote: ' + (error as Error).message);
    }
  };

  const getVotesForPlayer = (matchId: string, playerId: string) => {
    return votes.filter(v => v.match_id === matchId && v.player_id === playerId).length;
  };

  const getManOfMatch = (matchId: string) => {
    const matchVotes = votes.filter(v => v.match_id === matchId);
    if (matchVotes.length === 0) return null;
    const counts: Record<string, number> = {};
    matchVotes.forEach(v => {
      counts[v.player_id] = (counts[v.player_id] || 0) + 1;
    });
    const topId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    return players.find(p => p.id === topId) || null;
  };

  const getTopPlayers = (matchId: string) => {
    const matchVotes = votes.filter(v => v.match_id === matchId);
    if (matchVotes.length === 0) return [];
    const counts: Record<string, number> = {};
    matchVotes.forEach(v => {
      counts[v.player_id] = (counts[v.player_id] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([playerId, count]) => ({
        player: players.find(p => p.id === playerId),
        count
      }))
      .filter(item => item.player);
  };

  const filteredMatches = matches.filter(m => m.status === 'completed' && (!selectedCompetition || m.competition === selectedCompetition));

  if (loading || contextLoading) {
    return (
      <AppShell>
        <div className="space-y-4 pt-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-40 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </AppShell>
    );
  }

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
              <ScrollText size={24} className="text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-black drop-shadow-md">Résultats</h1>
            <p className="text-sm drop-shadow-sm" style={{ color: team?.primary_color || '#020617' }}>Matchs terminés et votes</p>
          </div>
        </div>

        {/* Competition Filter */}
        <div className="relative">
          <select
            value={selectedCompetition}
            onChange={(e) => setSelectedCompetition(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 appearance-none shadow-md relative z-10"
            style={{
              background: 'linear-gradient(135deg, #e0f2fe 0%, #020617 100%)',
              borderColor: '#0ea5e9',
              color: '#0c4a6e',
              '--tw-ring-color': '#0ea5e9',
              boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
            } as React.CSSProperties}
          >
            <option value="">Toutes les compétitions</option>
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

        {/* Vote Error Announcement */}
        {voteError && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
            <X size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">{voteError}</p>
            </div>
            <button onClick={() => setVoteError('')} className="text-red-400 hover:text-red-600">
              <X size={18} />
            </button>
          </div>
        )}

        {filteredMatches.map((match) => {
          const motm = getManOfMatch(match.id);
          const topPlayers = getTopPlayers(match.id);
          const userHasVoted = votes.some(v => v.match_id === match.id && v.voter_name === user?.email);

          return (
            <div key={match.id} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Left Column: Result + Top 3 Votes */}
              <div className="flex flex-col gap-3">
                {/* Card 1: Result */}
                <div
                  onClick={() => {
                    if (userHasVoted) {
                      setVoteError('Vous avez déjà voté pour ce match');
                      return;
                    }
                    setSelectedMatch(match.id);
                    setShowVoteModal(true);
                    setSelectedPlayer('');
                  }}
                  className="rounded-2xl shadow-lg p-4 cursor-pointer hover-lift relative overflow-hidden flex-1"
                  style={{
                    background: `linear-gradient(135deg, ${team?.secondary_color || '#e0f2fe'} 0%, ${team?.primary_color || '#020617'} 100%)`,
                    borderColor: '#0ea5e9',
                    boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
                  }}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#0ea5e9]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-[#0284c7]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-medium text-white/80">{match.competition}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/20 text-white">
                        Terminé
                      </span>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <div className="text-center flex-1">
                        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-1.5 shadow-inner overflow-hidden border border-white/30 mx-auto">
                          {match.is_home ? (
                            team?.logo_url ? (
                              <img src={team.logo_url} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-bold text-sm text-white">{team?.name?.substring(0, 2).toUpperCase() || 'SA'}</span>
                            )
                          ) : (
                            match.opponent_logo ? (
                              <img src={match.opponent_logo} alt="Logo adverse" className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-bold text-sm text-white">{match.opponent.replace('ASC ', '')}</span>
                            )
                          )}
                        </div>
                        <div className="font-bold text-white text-sm">{match.is_home ? 'Sama ASC' : match.opponent}</div>
                      </div>
                      <div className="flex items-center gap-2 px-2">
                        <span className={`text-2xl font-bold text-white ${
                          match.is_home 
                            ? (match.score_home !== null && match.score_home > (match.score_away || 0) ? 'text-green-400' : '')
                            : (match.score_away !== null && match.score_away > (match.score_home || 0) ? 'text-green-400' : '')
                        }`}>
                          {match.is_home ? (match.score_home ?? '-') : (match.score_away ?? '-')}
                        </span>
                        <span className="text-white/60 text-xl">-</span>
                        <span className={`text-2xl font-bold text-white ${
                          match.is_home
                            ? (match.score_home !== null && match.score_home < (match.score_away || 0) ? 'text-green-400' : '')
                            : (match.score_away !== null && match.score_away < (match.score_home || 0) ? 'text-green-400' : '')
                        }`}>
                          {match.is_home ? (match.score_away ?? '-') : (match.score_home ?? '-')}
                        </span>
                      </div>
                      <div className="text-center flex-1">
                        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-1.5 shadow-inner overflow-hidden border border-white/30 mx-auto">
                          {match.is_home ? (
                            match.opponent_logo ? (
                              <img src={match.opponent_logo} alt="Logo adverse" className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-bold text-sm text-white">{match.opponent.replace('ASC ', '')}</span>
                            )
                          ) : (
                            team?.logo_url ? (
                              <img src={team.logo_url} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-bold text-sm text-white">{team?.name?.substring(0, 2).toUpperCase() || 'SA'}</span>
                            )
                          )}
                        </div>
                        <div className="font-bold text-white text-sm">{match.is_home ? match.opponent : 'Sama ASC'}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs text-white/70 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar size={10} className="text-white/70" />
                        <span>{formatDate(match.match_date)}</span>
                      </div>
                      {match.venue && (
                        <div className="flex items-center gap-1">
                          <MapPin size={10} className="text-white/70" />
                          <span>{match.venue}</span>
                        </div>
                      )}
                    </div>

                    {match.scorers && (
                      <div className="p-3 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30">
                        <div className="flex items-center gap-1 mb-2">
                          <span className="text-white text-sm">⚽</span>
                          <span className="text-xs text-white font-bold uppercase">Buteurs</span>
                        </div>
                        <div className="text-sm text-white font-medium">{match.scorers}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card 2: Top 3 Votes */}
                {topPlayers.length > 0 && (
                  <div className="rounded-2xl shadow-lg p-4 relative overflow-hidden flex-1" style={{
                    background: `linear-gradient(135deg, ${team?.secondary_color || '#e0f2fe'} 0%, ${team?.primary_color || '#020617'} 100%)`,
                    borderColor: '#0ea5e9',
                    boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
                  }}>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#0ea5e9]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-[#0284c7]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <Trophy size={14} className="text-white" />
                        <span className="text-[10px] text-white font-bold uppercase">Top 3 des votes</span>
                      </div>
                      <div className="space-y-2">
                        {topPlayers.map((item, index) => (
                          <div key={item.player?.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-sm flex-shrink-0">
                              <span className="text-white font-bold text-xs">{index + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-white truncate">{item.player?.name}</div>
                              <div className="text-[10px] text-white/70">#{item.player?.jersey_number || '?'}</div>
                            </div>
                            <div className="text-xs font-bold text-white">{item.count}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Player Photo with Encouragement */}
              {motm && (
                <div className="rounded-2xl shadow-lg overflow-hidden relative h-full flex items-center justify-center" style={{
                  boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
                }}>
                  <div className="relative z-10 h-full w-full flex flex-col">
                    {motm.photo_url ? (
                      <img src={motm.photo_url} alt={motm.name} className="w-full h-full object-cover object-center" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <span className="text-4xl font-bold text-white">{motm.jersey_number || '?'}</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <Trophy size={12} className="text-amber-400" />
                        <span className="text-[10px] text-amber-400 font-bold uppercase">Homme du match</span>
                      </div>
                      <div className="text-sm font-bold text-white">{motm.name}</div>
                      <div className="text-xs text-white/80">Bonne continuation {motm.name}!</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredMatches.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Trophy size={48} className="mb-3 opacity-50" />
            <p className="text-sm">Aucun résultat disponible</p>
          </div>
        )}

        {/* Voting Modal */}
        {showVoteModal && selectedMatch && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Votez pour l'homme du match</h3>
                <button onClick={() => setShowVoteModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <input
                  type="text"
                  placeholder="Votre nom"
                  value={voterName}
                  onChange={(e) => {
                    setVoterName(e.target.value);
                    setVoteError('');
                  }}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm input-shadow focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
                />
                {voteError && (
                  <div className="text-red-600 text-sm font-medium">{voteError}</div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Sélectionnez un joueur</label>
                  <select
                    value={selectedPlayer}
                    onChange={(e) => {
                      setSelectedPlayer(e.target.value);
                      setVoteError('');
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 appearance-none shadow-md"
                  >
                    <option value="">Choisir un joueur...</option>
                    {players.map(player => (
                      <option key={player.id} value={player.id}>{player.name} #{player.jersey_number || '?'}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => {
                    if (selectedPlayer && voterName.trim()) {
                      handleVote(selectedMatch, selectedPlayer);
                      if (!voteError) {
                        setShowVoteModal(false);
                      }
                    }
                  }}
                  disabled={!selectedPlayer || !voterName.trim()}
                  className="w-full py-2.5 rounded-xl text-white text-sm font-semibold btn-shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ backgroundColor: team?.secondary_color || '#22c55e' }}
                >
                  <ThumbsUp size={16} />
                  Voter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
