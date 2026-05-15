import { createClient, SupabaseClient } from '@supabase/supabase-js';

import env from '../config/env';

let client: SupabaseClient | null = null;

function normalizeSupabaseUrl(input: string): string {
  const parsed = new URL(input);
  return `${parsed.protocol}//${parsed.host}`;
}

function logSupabaseDebug(message: string, payload?: unknown) {
  if (!__DEV__) return;
  if (payload !== undefined) {
    console.log('[supabase]', message, payload);
    return;
  }
  console.log('[supabase]', message);
}

if (env.supabaseUrl && env.supabaseAnonKey) {
  const normalizedUrl = normalizeSupabaseUrl(env.supabaseUrl);

  if (__DEV__ && normalizedUrl !== env.supabaseUrl) {
    logSupabaseDebug('Supabase URL normalized to project root', {
      original: env.supabaseUrl,
      normalized: normalizedUrl,
    });
  }

  logSupabaseDebug('Creating Supabase client', {
    urlHost: normalizedUrl.replace(/^https?:\/\//, '').split('/')[0],
    anonKeyLength: env.supabaseAnonKey.length,
  });
  client = createClient(normalizedUrl, env.supabaseAnonKey);
} else {
  logSupabaseDebug('Supabase env vars missing', {
    hasSupabaseUrl: Boolean(env.supabaseUrl),
    hasSupabaseAnonKey: Boolean(env.supabaseAnonKey),
  });
}

export function getSupabaseClient(): SupabaseClient | null {
  logSupabaseDebug('getSupabaseClient called', { hasClient: Boolean(client) });
  return client;
}
