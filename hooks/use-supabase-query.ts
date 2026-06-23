import useSWR from 'swr';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export function useSupabaseQuery<T>(
  key: string | null,
  query: () => Promise<{ data: T | null; error: any }>,
  options?: {
    revalidateOnFocus?: boolean;
    revalidateOnReconnect?: boolean;
    dedupingInterval?: number;
  }
) {
  const fetcher = async () => {
    const result = await query();
    if (result.error) throw result.error;
    return result.data;
  };

  return useSWR<T>(key, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 30000, // 30 seconds
    ...options,
  });
}
