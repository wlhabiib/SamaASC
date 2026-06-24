'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Match, Player, MatchVote, Competition } from '@/lib/types';
import AppShell from '@/components/app-shell';
import { useTeam } from '@/contexts/team-context';
import { fetchWithCache } from '@/utils/cache';
import { Trophy, Calendar, MapPin, ThumbsUp, Check, ScrollText, X, Clock, Medal, Star, Award } from 'lucide-react';

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
  const [localVotes, setLocalVotes] = useState<MatchVote[]>([]);
  const [voteNotification, setVoteNotification] = useState<{ matchId: string; message: string } | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<Record<string, number>>({});

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
        const [m, p, v, c] = await Promise.all([
          fetchWithCache<Match[]>(`/api/data/matches?team_id=${team.id}`, `matches_${team.id}`),
          fetchWithCache<Player[]>(`/api/data/players?team_id=${team.id}`, `players_${team.id}`),
          fetchWithCache<MatchVote[]>(`/api/data/match-votes?team_id=${team.id}`, `votes_${team.id}`),
          fetchWithCache<Competition[]>(`/api/data/competitions?team_id=${team.id}`, `competitions_${team.id}`),
        ]);

        setMatches(m);
        setPlayers(p);
        setVotes(v);
        setCompetitions(c || []);
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

  const handleVote = async (matchId: string, playerId: string) => {
    if (!user || !team) return;

    // Check if user has already voted for this match
    const allVotes = [...votes, ...localVotes];
    const existingVote = allVotes.find(v => v.match_id === matchId && v.voter_name === user.email);
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
          voter_name: user.email,
          team_id: team.id
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setVoteError(data.error || 'Erreur lors du vote');
        return;
      }

      setLocalVotes(prev => [...prev, data]);
      setVotedFor(playerId);
    } catch (error) {
      setVoteError('Erreur lors du vote: ' + (error as Error).message);
    }
  };

  const getVotesForPlayer = (matchId: string, playerId: string) => {
    const allVotes = [...votes, ...localVotes];
    return allVotes.filter(v => v.match_id === matchId && v.player_id === playerId).length;
  };

  const getManOfMatch = (matchId: string) => {
    const allVotes = [...votes, ...localVotes];
    const matchVotes = allVotes.filter(v => v.match_id === matchId);
    if (matchVotes.length === 0) return null;
    const counts: Record<string, number> = {};
    matchVotes.forEach(v => {
      counts[v.player_id] = (counts[v.player_id] || 0) + 1;
    });
    const topId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    return players.find(p => p.id === topId) || null;
  };

  const getTopPlayers = (matchId: string) => {
    const allVotes = [...votes, ...localVotes];
    const matchVotes = allVotes.filter(v => v.match_id === matchId);
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

  const filteredMatches = useMemo(() => 
    matches.filter(m => m.status === 'completed' && (!selectedCompetition || m.competition === selectedCompetition)),
    [matches, selectedCompetition]
  );

  // Update countdown timers using vote_end_time from database
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimes: Record<string, number> = {};
      filteredMatches.forEach(match => {
        if (match.vote_end_time) {
          const endTime = new Date(match.vote_end_time);
          const now = new Date();
          const remaining = Math.max(0, endTime.getTime() - now.getTime());
          newTimes[match.id] = remaining;
        }
      });
      setTimeRemaining(newTimes);
    }, 1000);

    return () => clearInterval(interval);
  }, [filteredMatches]);

  // Format countdown
  const formatCountdown = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Check if voting is still open
  const isVotingOpen = (matchId: string) => {
    const match = filteredMatches.find(m => m.id === matchId);
    if (!match || !match.vote_end_time) return false;
    return new Date() < new Date(match.vote_end_time);
  };

  if (contextLoading) {
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
              background: `linear-gradient(135deg, ${team?.secondary_color || '#e0f2fe'} 0%, ${team?.primary_color || '#0ea5e9'} 50%, ${team?.secondary_color || '#e0f2fe'} 100%)`,
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
            <h1 className="text-2xl font-bold drop-shadow-md" style={{ color: team?.primary_color || '#020617' }}>Résultats</h1>
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
          const allVotes = [...votes, ...localVotes];
          const userHasVoted = allVotes.some(v => v.match_id === match.id && v.voter_name === user?.email);
          const votingOpen = isVotingOpen(match.id);
          const remaining = timeRemaining[match.id] || 0;

          return (
            <div key={match.id}>
              {/* Vote Notification */}
              {voteNotification?.matchId === match.id && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 mb-3 flex items-center gap-2">
                  <Clock size={16} className="text-amber-500" />
                  <p className="text-sm text-amber-800">{voteNotification.message}</p>
                  <button onClick={() => setVoteNotification(null)} className="ml-auto text-amber-400 hover:text-amber-600">
                    <X size={16} />
                  </button>
                </div>
              )}

              <div className="rounded-2xl shadow-lg p-4 relative overflow-hidden cursor-pointer hover-lift"
                style={{
                  background: `linear-gradient(135deg, ${team?.secondary_color || '#e0f2fe'} 0%, ${team?.primary_color || '#020617'} 100%)`,
                  borderColor: '#0ea5e9',
                  boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
                }}
                onClick={() => {
                  if (userHasVoted) {
                    setVoteError('Vous avez déjà voté pour ce match');
                    return;
                  }
                  if (!votingOpen) {
                    setVoteError('Le vote est terminé pour ce match');
                    return;
                  }
                  setSelectedMatch(match.id);
                  setShowVoteModal(true);
                  setSelectedPlayer('');
                }}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#0ea5e9]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-[#0284c7]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-white/80">{match.competition}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/20 text-white">
                        Terminé
                      </span>
                    </div>
                    {votingOpen && remaining > 0 && (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/20 backdrop-blur-sm border border-red-400/30">
                        <Clock size={12} className="text-red-400" />
                        <span className="text-xs font-bold text-red-400">{formatCountdown(remaining)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="text-center flex-1">
                      <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-1.5 shadow-inner overflow-hidden border border-white/30 mx-auto">
                        {team?.logo_url ? (
                          <img src={team.logo_url} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-bold text-sm text-white">{team?.name?.substring(0, 2).toUpperCase() || 'SA'}</span>
                        )}
                      </div>
                      <div className="font-bold text-white text-sm">{team?.name || 'Sama ASC'}</div>
                    </div>
                    <div className="flex items-center gap-2 px-2">
                      <span className={`text-2xl font-bold text-white ${
                        match.score_home !== null && match.score_home > (match.score_away || 0) ? 'text-green-400' : ''
                      }`}>
                        {match.score_home ?? '-'}
                      </span>
                      <span className="text-white/60 text-xl">-</span>
                      <span className={`text-2xl font-bold text-white ${
                        match.score_home !== null && match.score_home < (match.score_away || 0) ? 'text-green-400' : ''
                      }`}>
                        {match.score_away ?? '-'}
                      </span>
                    </div>
                    <div className="text-center flex-1">
                      <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-1.5 shadow-inner overflow-hidden border border-white/30 mx-auto">
                        {match.opponent_logo ? (
                          <img src={match.opponent_logo} alt="Logo adverse" className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-bold text-sm text-white">{match.opponent.replace('ASC ', '')}</span>
                        )}
                      </div>
                      <div className="font-bold text-white text-sm">{match.opponent}</div>
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

              {/* Winner Display (after vote ends) */}
              {match.vote_end_time && !votingOpen && motm && (
                <div className="mt-3 rounded-2xl shadow-lg overflow-hidden relative" style={{
                  boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
                }}>
                  <div className="relative z-10">
                    {motm.photo_url ? (
                      <img src={motm.photo_url} alt={motm.name} className="w-full h-48 object-cover object-center" />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <span className="text-6xl font-bold text-white">{motm.jersey_number || '?'}</span>
                      </div>
                    )}
                    <div className="absolute top-4 right-4 flex gap-2">
                      <div className="w-10 h-10 rounded-full bg-yellow-400/90 backdrop-blur-sm flex items-center justify-center shadow-lg animate-bounce">
                        <Trophy size={20} className="text-yellow-900" />
                      </div>
                      <div className="w-10 h-10 rounded-full bg-amber-400/90 backdrop-blur-sm flex items-center justify-center shadow-lg animate-bounce" style={{ animationDelay: '0.2s' }}>
                        <Medal size={20} className="text-amber-900" />
                      </div>
                      <div className="w-10 h-10 rounded-full bg-orange-400/90 backdrop-blur-sm flex items-center justify-center shadow-lg animate-bounce" style={{ animationDelay: '0.4s' }}>
                        <Star size={20} className="text-orange-900 fill-orange-900" />
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy size={16} className="text-amber-400" />
                        <span className="text-sm text-amber-400 font-bold uppercase">Joueur du match</span>
                      </div>
                      <div className="text-xl font-bold text-white mb-1">{motm.name}</div>
                      <div className="text-sm text-white/90">Excellent match {motm.name}! Bravo! 🎉</div>
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
                <h3 className="text-lg font-bold text-gray-900">Votez pour le joueur du match</h3>
                <button onClick={() => setShowVoteModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 space-y-4">
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
                    if (selectedPlayer) {
                      handleVote(selectedMatch, selectedPlayer);
                      if (!voteError) {
                        setShowVoteModal(false);
                      }
                    }
                  }}
                  disabled={!selectedPlayer}
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
