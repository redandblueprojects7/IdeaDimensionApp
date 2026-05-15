import { getSupabaseClient } from './supabase';
import { ArtistItem } from '../types/artist';

function logArtistsDebug(message: string, payload?: unknown) {
  if (!__DEV__) return;
  if (payload !== undefined) {
    console.log('[artists-service]', message, payload);
    return;
  }
  console.log('[artists-service]', message);
}

function normalizeMembers(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

const fallbackArtists: ArtistItem[] = [
  {
    id: 'artist-1',
    name: 'Idea Dimension',
    members: ['Blue Rivers', 'Ray Castor', 'Nova Grey'],
    logoUrl: 'https://images.unsplash.com/photo-1524683735036-1b9a74a8f2c5?auto=format&fit=crop&w=1200&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    description:
      'Idea Dimension blends cinematic electronic textures with live instrumentation. Their sets move between atmospheric storytelling and high-energy moments designed for festival crowds.',
    externalUrl: 'https://www.instagram.com/i_dimensionpodcast',
    externalLabel: 'Instagram',
  },
  {
    id: 'artist-2',
    name: 'Neon Atlas',
    members: ['Mia Kline', 'Theo Vance', 'Ari Sol'],
    logoUrl: 'https://images.unsplash.com/photo-1616469829471-8f6f84306d68?auto=format&fit=crop&w=1200&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80',
    description:
      'Neon Atlas creates punchy alt-pop with analog synth layers and expressive vocal hooks. Their material focuses on resilience, community, and identity through modern club-ready production.',
    externalUrl: 'https://www.tiktok.com/@theideadimension',
    externalLabel: 'TikTok',
  },
  {
    id: 'artist-3',
    name: 'The Violet Transit',
    members: ['Lena Hart', 'Kai Dalton', 'Rho Mercer', 'Jules Park'],
    logoUrl: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&w=1200&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80',
    description:
      'The Violet Transit combines post-rock guitars and rhythmic spoken-word passages. Their live performances are built as one continuous arc, with visual transitions tied to each chapter of the set.',
    externalUrl: 'https://www.youtube.com/@idimensionpodcast',
    externalLabel: 'YouTube',
  },
];

function mapArtistRow(row: any): ArtistItem {
  return {
    id: String(row.id),
    name: row.name ?? 'Unnamed Artist',
    members: normalizeMembers(row.members),
    logoUrl: row.logo_url ?? undefined,
    imageUrl: row.image_url ?? undefined,
    description: row.description ?? '',
    externalUrl: row.external_url ?? undefined,
    externalLabel: row.external_label ?? undefined,
  };
}

export async function fetchArtists(limit = 12): Promise<ArtistItem[]> {
  logArtistsDebug('fetchArtists called', { limit });
  const supabase = getSupabaseClient();

  if (!supabase) {
    logArtistsDebug('No Supabase client, using fallback artists');
    return fallbackArtists.slice(0, limit);
  }

  try {
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true })
      .limit(limit);

    if (error) {
      logArtistsDebug('Supabase returned error', {
        message: error.message,
        code: (error as { code?: string }).code,
      });
      throw error;
    }

    const mapped = (data ?? []).map(mapArtistRow);
    if (mapped.length === 0) {
      logArtistsDebug('Supabase returned no rows, using fallback artists');
      return fallbackArtists.slice(0, limit);
    }

    return mapped;
  } catch (error) {
    logArtistsDebug('Falling back due to Supabase failure', {
      error: error instanceof Error ? error.message : String(error),
    });
    return fallbackArtists.slice(0, limit);
  }
}
