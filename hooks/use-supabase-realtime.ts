import { useEffect, useState, useRef } from 'react';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export function useSupabaseRealtime<T extends { [key: string]: any }>(
  table: string,
  filter?: { column: string; value: any },
  initialData: T[] = []
) {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    let mounted = true;

    async function setupRealtime() {
      try {
        setLoading(true);
        setError(null);

        // Initial fetch
        let query = supabase.from(table).select('*');
        
        if (filter) {
          query = query.eq(filter.column, filter.value);
        }

        const { data: initialFetch, error: fetchError } = await query;
        
        if (fetchError) throw fetchError;
        
        if (mounted) {
          setData(initialFetch || []);
          setLoading(false);
        }

        // Setup realtime subscription
        const channelName = `${table}_realtime_${filter?.column}_${filter?.value || 'all'}`;
        
        const channel = supabase
          .channel(channelName)
          .on(
            'postgres_changes' as any,
            {
              event: '*',
              schema: 'public',
              table: table,
              filter: filter ? `${filter.column}=eq.${filter.value}` : undefined,
            },
            (payload: any) => {
              if (!mounted) return;

              console.log(`Realtime update on ${table}:`, payload);

              switch (payload.eventType) {
                case 'INSERT':
                  setData((prev) => [...prev, payload.new as T]);
                  break;
                case 'UPDATE':
                  setData((prev) =>
                    prev.map((item) =>
                      (item as any).id === (payload.new as any).id ? payload.new as T : item
                    )
                  );
                  break;
                case 'DELETE':
                  setData((prev) =>
                    prev.filter((item) => (item as any).id !== (payload.old as any).id)
                  );
                  break;
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log(`Subscribed to ${table} realtime`);
            } else if (status === 'CHANNEL_ERROR') {
              console.error(`Error subscribing to ${table} realtime`);
              if (mounted) setError('Erreur de connexion temps réel');
            }
          });

        channelRef.current = channel;
      } catch (err) {
        console.error('Error setting up realtime:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Erreur inconnue');
          setLoading(false);
        }
      }
    }

    setupRealtime();

    return () => {
      mounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, filter?.column, filter?.value]);

  return { data, loading, error, setData };
}
