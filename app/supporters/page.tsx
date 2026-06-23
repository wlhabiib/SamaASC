'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Supporter } from '@/lib/types';
import AppShell from '@/components/app-shell';
import { useTeam } from '@/contexts/team-context';
import { fetcher } from '@/utils/fetcher';
import { Heart, Send, Flame, MessageCircle, Mic, ImagePlus, X, Play, Smile, Paperclip } from 'lucide-react';

export default function SupportersPage() {
  const router = useRouter();
  const { team, user, loading: contextLoading } = useTeam();

  // SWR hook for data fetching with caching
  const { data: supporters = [], mutate } = useSWR<Supporter[]>(
    team ? `/api/data/supporters?team_id=${team.id}` : null,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudio(audioUrl);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Impossible d\'accéder au microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !team) return;
    if (!selectedSticker && !message.trim() && !recordedAudio) return;
    setSubmitting(true);

    let voiceUrl = null;
    let message_type = 'text';

    // Handle voice message
    if (recordedAudio) {
      message_type = 'voice';
      // Convert audio blob to base64
      const response = await fetch(recordedAudio);
      const blob = await response.blob();
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      voiceUrl = await base64Promise;
    }

    try {
      const response = await fetch('/api/admin/supporters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
          message: (selectedSticker ? selectedSticker + ' ' : '') + message.trim(),
          team_id: team.id,
          profile_photo_url: (user as any).profile_photo_url || null,
          message_type,
          voice_url: voiceUrl,
          sticker_url: null
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

      // Optimistic update with SWR mutate
      mutate([...supporters, data], false);

      // Reset form
      setMessage('');
      setSelectedSticker(null);
      setRecordedAudio(null);

      // Revalidate to get fresh data from server
      mutate();
    } catch (error) {
      console.error('Error submitting message:', error);
      alert('Erreur lors de l\'envoi du message');
    } finally {
      setSubmitting(false);
    }
  };

  if (contextLoading) {
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
            <p className="text-sm drop-shadow-sm" style={{ color: team?.primary_color || '#020617' }}>Messages de soutien</p>
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

        {/* Post Form - WhatsApp Style */}
        <div className="rounded-2xl p-4 shadow-lg relative overflow-hidden" style={{
          background: 'linear-gradient(135deg, #e0f2fe 0%, #0ea5e9 50%, #0284c7 100%)',
          borderColor: '#0ea5e9',
          boxShadow: '0 4px 30px -4px rgba(14, 165, 233, 0.3)'
        }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#0ea5e9]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#0284c7]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle size={16} className="text-white" />
              <span className="text-sm font-bold text-white">Votre message</span>
            </div>

            {/* Voice Recording Preview */}
            {recordedAudio && (
              <div className="mb-3 p-3 bg-white/20 rounded-xl flex items-center gap-2">
                <audio src={recordedAudio} controls className="flex-1 h-8" />
                <button
                  type="button"
                  onClick={() => setRecordedAudio(null)}
                  className="p-2 bg-red-500 rounded-lg text-white hover:bg-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Simple Input Bar */}
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              {/* Text Input */}
              <div className="flex-1">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Écrivez votre message... (emojis autorisés)"
                  className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
                  rows={1}
                  disabled={!!recordedAudio}
                  style={{ minHeight: '48px' }}
                />
              </div>

              {/* Voice/Send Button */}
              {!message.trim() && !recordedAudio ? (
                isRecording ? (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="p-3 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="p-3 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors"
                  >
                    <Mic size={20} />
                  </button>
                )
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="p-3 bg-gradient-to-r from-sky-400 to-sky-600 rounded-full text-white hover:from-sky-500 hover:to-sky-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              )}
            </form>
          </div>
        </div>

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
                  {s.message_type === 'voice' && s.voice_url && (
                    <audio src={s.voice_url} controls className="w-full mb-2 h-8" />
                  )}
                  {s.message_type === 'sticker' && s.sticker_url && (
                    <img src={s.sticker_url} alt="Sticker" className="w-24 h-24 object-cover rounded-lg mb-2" />
                  )}
                  {s.message && <p className="text-sm text-white leading-relaxed">{s.message}</p>}
                  <p className="text-xs text-sky-200 mt-1">- {s.name}</p>
                </div>
              </div>
            </div>
          ))}

          {supporters.length === 0 && (
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
