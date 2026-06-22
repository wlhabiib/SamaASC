'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GalleryItem } from '@/lib/types';
import AppShell from '@/components/app-shell';
import { useTeam } from '@/contexts/team-context';
import { Image as ImageIcon, Play, X, ZoomIn } from 'lucide-react';

export default function GaleriePage() {
  const router = useRouter();
  const { team, user, loading: contextLoading } = useTeam();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [filter, setFilter] = useState<string>('all');

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
      
      const data = await fetch(`/api/data/gallery?team_id=${team.id}`).then(r => r.json());
      setItems(data);
      setLoading(false);
    }
    load();

    // Setup realtime subscription - DISABLED (Supabase removed)
    // if (team && supabase) {
    //   const channel = supabase
    //     .channel('gallery-changes')
    //     .on(
    //       'postgres_changes',
    //       {
    //         event: '*',
    //         schema: 'public',
    //         table: 'gallery',
    //         filter: `team_id=eq.${team.id}`,
    //       },
    //       () => {
    //         load();
    //       }
    //     )
    //     .subscribe();

    //   return () => {
    //     supabase!.removeChannel(channel);
    //   };
    // }
  }, [team]);

  if (loading || contextLoading) {
    return (
      <AppShell>
        <div className="grid grid-cols-2 gap-3 pt-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="aspect-square rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </AppShell>
    );
  }

  const eventTypes = ['all', ...Array.from(new Set(items.map(i => i.event_type)))];
  const filtered = filter === 'all' ? items : items.filter(i => i.event_type === filter);

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
              <ImageIcon size={24} className="text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-black drop-shadow-md">Galerie</h1>
            <p className="text-sm text-gray-800 drop-shadow-sm">Photos et vidéos</p>
          </div>
        </div>

        {/* Filter */}
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {eventTypes.map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 capitalize relative overflow-hidden ${
                filter === type
                  ? 'text-white shadow-lg'
                  : 'bg-white text-gray-600 shadow-sm hover:shadow-md'
              }`}
              style={{
                background: filter === type ? `linear-gradient(135deg, ${team?.secondary_color || '#e0f2fe'} 0%, ${team?.primary_color || '#020617'} 50%, ${team?.secondary_color || '#e0f2fe'} 100%)` : undefined,
                borderColor: filter === type ? '#0ea5e9' : undefined,
                boxShadow: filter === type ? '0 4px 30px -4px rgba(14, 165, 233, 0.3)' : undefined
              }}
            >
              {type === 'all' ? 'Tout' : type}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="relative aspect-square rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group"
              style={{
                boxShadow: team?.primary_color ? `0 4px 30px -4px ${team.primary_color}60` : undefined
              }}
            >
              {item.type === 'video' ? (
                <video src={item.url} className="w-full h-full object-cover" muted />
              ) : (
                <img
                  src={item.url}
                  alt={item.caption || ''}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {item.type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-lg">
                    <Play size={18} className="text-green-600 ml-0.5" />
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-white text-xs font-medium truncate">{item.caption}</p>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ZoomIn size={16} className="text-white drop-shadow" />
              </div>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <ImageIcon size={48} className="mb-3 opacity-50" />
            <p className="text-sm">Aucun média disponible</p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedItem(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            onClick={() => setSelectedItem(null)}
          >
            <X size={20} />
          </button>
          <div className="max-w-sm w-full" onClick={e => e.stopPropagation()}>
            {selectedItem.type === 'video' ? (
              <video
                src={selectedItem.url}
                controls
                autoPlay
                className="w-full rounded-xl shadow-2xl"
              />
            ) : (
              <img
                src={selectedItem.url}
                alt={selectedItem.caption || ''}
                className="w-full rounded-xl shadow-2xl"
              />
            )}
            {selectedItem.caption && (
              <p className="text-white text-sm mt-3 text-center">{selectedItem.caption}</p>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
