'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Supporter } from '@/lib/types';
import AppShell from '@/components/app-shell';
import { useTeam } from '@/contexts/team-context';
import { Heart, Send, Flame, MessageCircle } from 'lucide-react';

export default function SupportersPage() {
  const router = useRouter();
  const { team, user, loading: contextLoading } = useTeam();
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);

  const STICKERS = ['⚽', '🔥', '💪', '🎉', '👏', '❤️', '⭐', '🏆', '🚀', '💯'];

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

      console.log('Loading supporters from API...');
      const response = await fetch(`/api/data/supporters?team_id=${team.id}`);
      const data = await response.json();
      console.log('Initial load supporters:', data);
      setSupporters(data || []);
      setLoading(false);
    }
    load();

    // Setup realtime subscription - DISABLED (Supabase removed)
    // if (team && supabase) {
    //   const channel = supabase
    //     .channel('supporters-changes')
    //     .on(
    //       'postgres_changes',
    //       {
    //         event: '*',
    //         schema: 'public',
    //         table: 'supporters',
    //         filter: `team_id=eq.${team.id}`,
    //       },
    //       (payload) => {
    //         console.log('Realtime event:', payload.eventType, payload);
    //         console.log('Current supporters count before event:', supporters.length);
    //         if (payload.eventType === 'INSERT') {
    //           setSupporters(prev => {
    //             // Avoid duplicates
    //             if (prev.some(s => s.id === payload.new.id)) {
    //               console.log('Duplicate detected, skipping');
    //               return prev;
    //             }
    //             console.log('Adding new supporter to state');
    //             return [payload.new as Supporter, ...prev];
    //           });
    //         } else if (payload.eventType === 'UPDATE') {
    //           setSupporters(prev => prev.map(s => s.id === payload.new.id ? payload.new as Supporter : s));
    //         } else if (payload.eventType === 'DELETE') {
    //           console.log('Deleting supporter from state:', payload.old.id);
    //           setSupporters(prev => prev.filter(s => s.id !== payload.old.id));
    //         }
    //       }
    //     )
    //     .subscribe();

    //   console.log('Realtime subscription created');

    //   return () => {
    //     supabase!.removeChannel(channel);
    //   };
    // }
  }, [team]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !team) return;
    if (!selectedSticker && !message.trim()) return;
    setSubmitting(true);

    console.log('Submitting supporter message:', { user: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email, message: (selectedSticker ? selectedSticker + ' ' : '') + message.trim(), team_id: team.id, profile_photo_url: null });

    try {
      const response = await fetch('/api/admin/supporters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
          message: (selectedSticker ? selectedSticker + ' ' : '') + message.trim(),
          team_id: team.id,
          profile_photo_url: null
        }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('Error response:', error);
        throw new Error(error.error || 'Failed to submit message');
      }

      const data = await response.json();
      console.log('Success response:', data);
      // Reload data from database as fallback using API endpoint
      console.log('Reloading supporters from database via API...');
      const supportersResponse = await fetch(`/api/data/supporters?team_id=${team.id}`);
      const supportersData = await supportersResponse.json();
      console.log('Reloaded supporters:', supportersData);
      setSupporters(supportersData || []);
      setMessage('');
      setSelectedSticker(null);
    } catch (error) {
      console.error('Error submitting message:', error);
      alert('Erreur lors de l\'envoi du message');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || contextLoading) {
    return (
      <AppShell>
        <div className="space-y-4 pt-4">
          <div className="h-64 rounded-2xl bg-gray-100 animate-pulse" />
        </div>
      </AppShell>
    );
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "À l'instant";
    if (mins < 60) return `Il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Il y a ${days}j`;
  }

  const COLORS = ['from-green-400 to-green-600', 'from-blue-400 to-blue-600', 'from-amber-400 to-amber-600', 'from-red-400 to-red-600', 'from-teal-400 to-teal-600'];

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
              <Heart size={24} className="text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-black drop-shadow-md">Supporters</h1>
            <p className="text-sm text-gray-800 drop-shadow-sm">Messages de soutien</p>
          </div>
        </div>

        {/* Header Card */}
        <div className="rounded-2xl bg-gradient-to-br from-rose-500 via-red-500 to-orange-600 p-5 text-white shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={20} />
            <span className="text-sm font-bold">Ambiance du Quartier</span>
          </div>
          <p className="text-sm text-white/80 leading-relaxed">
            {team?.name || 'L\'équipe'} représente tout le quartier! Exprimez votre soutien et garantissez l&apos;ambiance!
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Heart size={16} className="animate-pulse" />
            <span className="text-sm font-medium">{supporters.length} messages de soutien</span>
          </div>
        </div>

        {/* Post Form */}
        <form onSubmit={handleSubmit} className="rounded-2xl p-4 shadow-lg space-y-3 relative overflow-hidden" style={{
          background: 'linear-gradient(135deg, #e0f2fe 0%, #0ea5e9 50%, #0284c7 100%)',
          borderColor: '#0ea5e9',
          boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
        }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#0ea5e9]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#0284c7]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle size={16} className="text-white" />
              <span className="text-sm font-bold text-white">Votre message</span>
            </div>

            {/* Sticker Picker */}
            <div className="flex gap-2 flex-wrap">
              {STICKERS.map((sticker) => (
                <button
                  key={sticker}
                  type="button"
                  onClick={() => setSelectedSticker(selectedSticker === sticker ? null : sticker)}
                  className={`text-2xl p-2 rounded-lg transition-all ${
                    selectedSticker === sticker
                      ? 'ring-2 scale-110'
                      : 'bg-white/20 hover:bg-white/30'
                  }`}
                  style={{
                    backgroundColor: selectedSticker === sticker ? 'rgba(255, 255, 255, 0.3)' : undefined,
                  } as React.CSSProperties}
                >
                  {sticker}
                </button>
              ))}
            </div>

            <div className="relative overflow-hidden rounded-xl border">
              <textarea
                placeholder="Votre message de soutien..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none relative z-10 bg-white/90"
                style={{
                  color: '#0c4a6e',
              }}
            />
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#0ea5e9]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#0284c7]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
          </div>
          <button
            type="submit"
            disabled={(!message.trim() && !selectedSticker) || submitting}
            className="relative overflow-hidden w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              background: `linear-gradient(135deg, ${team?.secondary_color || '#e0f2fe'} 0%, ${team?.primary_color || '#020617'} 50%, ${team?.secondary_color || '#e0f2fe'} 100%)`,
              borderColor: '#0ea5e9',
              boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
            }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#0ea5e9]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#0284c7]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
            <div className="relative z-10 flex items-center justify-center gap-2">
              <Send size={16} />
              {submitting ? 'Envoi...' : 'Envoyer'}
            </div>
          </button>
          </div>
        </form>

        {/* Messages */}
        <div className="space-y-3">
          {supporters.map((s, idx) => (
            <div
              key={s.id}
              className="rounded-xl p-4 shadow-md hover-lift relative overflow-hidden transition-all duration-300 hover:scale-[1.01]"
              style={{
                background: `linear-gradient(135deg, ${team?.secondary_color || '#e0f2fe'} 0%, ${team?.primary_color || '#020617'} 50%, ${team?.secondary_color || '#e0f2fe'} 100%)`,
                borderColor: '#0ea5e9',
                boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
              }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#0ea5e9]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-[#0284c7]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
              <div className="relative z-10 flex items-start gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden ${!s.profile_photo_url ? `bg-gradient-to-br ${COLORS[idx % COLORS.length]}` : ''}`}>
                  {s.profile_photo_url ? (
                    <img src={s.profile_photo_url} alt={s.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-xs font-bold">
                      {s.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-sky-200">{timeAgo(s.created_at)}</span>
                  </div>
                  <p className="text-sm text-white leading-relaxed">{s.message}</p>
                  <p className="text-xs text-sky-200 mt-1">- {s.name}</p>
                </div>
              </div>
            </div>
          ))}

          {supporters.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Heart size={40} className="mb-3 opacity-50" />
              <p className="text-sm">Soyez le premier à soutenir l&apos;équipe!</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
