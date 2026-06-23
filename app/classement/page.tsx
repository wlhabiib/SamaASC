'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Standing, Competition } from '@/lib/types';
import AppShell from '@/components/app-shell';
import { useTeam } from '@/contexts/team-context';
import { Trophy } from 'lucide-react';

export default function ClassementPage() {
  const router = useRouter();
  const { team, user, loading: contextLoading } = useTeam();
  const [standings, setStandings] = useState<Standing[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompetition, setSelectedCompetition] = useState<string>('');

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

      const [s, c] = await Promise.all([
        fetch(`/api/data/standings?team_id=${team.id}`).then(r => r.json()),
        fetch(`/api/data/competitions?team_id=${team.id}`).then(r => r.json()),
      ]);
      setStandings(s);
      setCompetitions(c || []);
      if (s && s.length > 0) {
        setSelectedCompetition(s[0].competition_name);
      }
      setLoading(false);
    }
    load();

    // Setup realtime subscription - DISABLED (Supabase removed)
    // let channel: any;
    // if (team && supabase) {
    //   channel = supabase
    //     .channel('standings-changes')
    //     .on(
    //       'postgres_changes',
    //       {
    //         event: '*',
    //         schema: 'public',
    //         table: 'standings',
    //         filter: `team_id=eq.${team.id}`,
    //       },
    //       () => {
    //         load();
    //       }
    //     )
    //     .subscribe();
    // }

    return () => {
      // if (channel && supabase) {
      //   supabase.removeChannel(channel);
      // }
    };
  }, [team]);

  if (loading || contextLoading) {
    return (
      <AppShell>
        <div className="space-y-4 pt-4">
          <div className="h-64 rounded-2xl bg-gray-100 animate-pulse" />
        </div>
      </AppShell>
    );
  }

  const filtered = standings.filter(s => s.competition_name === selectedCompetition);
  const ourTeam = filtered.find(s => s.team_name === team?.name);

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
              <Trophy size={24} className="text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-black drop-shadow-md">Classement</h1>
            <p className="text-sm drop-shadow-sm" style={{ color: team?.primary_color || '#020617' }}>Position en compétition</p>
          </div>
        </div>

        {/* Competition Selector - dropdown */}
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
            <option value="">Sélectionner une compétition</option>
            {competitions.map(comp => (
              <option key={comp.id} value={comp.name}>{comp.name}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Trophy size={48} className="mb-3 opacity-50" />
            <p className="text-sm">Aucun classement disponible</p>
          </div>
        )}

        {/* Our Position Card */}
        {ourTeam && (
          <div className="rounded-2xl bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 p-5 text-white shadow-xl" style={{
            boxShadow: team?.primary_color ? `0 4px 30px -4px ${team.primary_color}60` : undefined
          }}>
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={18} />
              <span className="text-sm font-medium text-green-200">{selectedCompetition}</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-5xl font-bold">{ourTeam.position}<span className="text-2xl text-green-200">e</span></div>
                <div className="text-green-200 text-sm mt-1">{ourTeam.team_name}</div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-2xl font-bold">{ourTeam.points}</div>
                  <div className="text-[10px] text-green-200 uppercase tracking-wider">Pts</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{ourTeam.goals_for}-{ourTeam.goals_against}</div>
                  <div className="text-[10px] text-green-200 uppercase tracking-wider">Buts</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{ourTeam.won + ourTeam.drawn + ourTeam.lost}</div>
                  <div className="text-[10px] text-green-200 uppercase tracking-wider">Joués</div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-white/20">
              <div className="flex items-center gap-1 text-sm">
                <span className="text-green-200">V:</span>
                <span className="font-bold">{ourTeam.won}</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-green-200">N:</span>
                <span className="font-bold">{ourTeam.drawn}</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-green-200">D:</span>
                <span className="font-bold">{ourTeam.lost}</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-green-200">Diff:</span>
                <span className="font-bold">{ourTeam.goals_for - ourTeam.goals_against > 0 ? '+' : ''}{ourTeam.goals_for - ourTeam.goals_against}</span>
              </div>
            </div>
          </div>
        )}

        {/* Full Standings Table */}
        {filtered.length > 0 && (
          <div className="rounded-2xl shadow-lg overflow-hidden relative" style={{
            background: 'linear-gradient(135deg, #e0f2fe 0%, #0ea5e9 50%, #0284c7 100%)',
            borderColor: '#0ea5e9',
            boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
          }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#0ea5e9]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#0284c7]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
            <div className="relative z-10 overflow-x-auto">
              <div className="grid grid-cols-[32px_1fr_32px_32px_32px_32px_32px_40px] gap-1 px-3 py-2.5 bg-white/20 backdrop-blur-sm text-[10px] font-bold text-white uppercase tracking-wider min-w-[500px]">
                <div>#</div>
                <div>Équipe</div>
                <div>J</div>
                <div>V</div>
                <div>N</div>
                <div>D</div>
                <div>Pts</div>
                <div>Diff</div>
              </div>
              {filtered.map((standing, idx) => {
                const isUs = standing.team_name === team?.name;
                const diff = standing.goals_for - standing.goals_against;
                return (
                  <div
                    key={standing.id}
                    className={`grid grid-cols-[32px_1fr_32px_32px_32px_32px_32px_40px] gap-1 px-3 py-2.5 text-xs items-center transition-colors duration-200 min-w-[500px] ${
                      isUs
                      ? 'bg-white/30 backdrop-blur-sm border-l-2 border-white'
                      : idx % 2 === 0
                      ? 'bg-white/10'
                      : 'bg-white/5'
                  } ${idx < filtered.length - 1 ? 'border-b border-white/20' : ''}`}
                  >
                    <div className={`font-bold ${isUs ? 'text-white' : 'text-white/80'}`}>
                      {standing.position}
                    </div>
                    <div className={`font-semibold truncate ${isUs ? 'text-white' : 'text-white/90'}`}>
                      {standing.team_name}
                    </div>
                    <div className="text-white/70 text-center">{standing.played}</div>
                    <div className="text-white/70 text-center">{standing.won}</div>
                    <div className="text-white/70 text-center">{standing.drawn}</div>
                    <div className="text-white/70 text-center">{standing.lost}</div>
                    <div className={`font-bold text-center ${isUs ? 'text-white' : 'text-white/90'}`}>
                      {standing.points}
                    </div>
                    <div className={`text-center ${diff > 0 ? 'text-green-300' : diff < 0 ? 'text-red-300' : 'text-white/60'}`}>
                      {diff > 0 ? '+' : ''}{diff}
                    </div>
                  </div>
                );
            })}
          </div>
        </div>
        )}
      </div>
    </AppShell>
  );
}

