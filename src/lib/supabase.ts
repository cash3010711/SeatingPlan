import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { loadStoredConfig } from '../utils/storage';

let supabaseInstance: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

export function isSupabaseConfigured(): boolean {
  const { supabaseUrl, supabaseAnonKey } = loadStoredConfig();
  return Boolean(
    supabaseUrl &&
    supabaseUrl.startsWith('http') &&
    supabaseAnonKey &&
    supabaseAnonKey.length > 10
  );
}

export function getSupabase(): SupabaseClient | null {
  const { supabaseUrl, supabaseAnonKey } = loadStoredConfig();

  if (!supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith('http')) {
    supabaseInstance = null;
    return null;
  }

  if (supabaseInstance && cachedUrl === supabaseUrl && cachedKey === supabaseAnonKey) {
    return supabaseInstance;
  }

  try {
    cachedUrl = supabaseUrl;
    cachedKey = supabaseAnonKey;
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    return supabaseInstance;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    supabaseInstance = null;
    return null;
  }
}
