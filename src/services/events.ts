import dayjs from 'dayjs';

import { getSupabaseClient } from './supabase';
import { EventItem } from '../types/event';

function logEventsDebug(message: string, payload?: unknown) {
  if (!__DEV__) return;
  if (payload !== undefined) {
    console.log('[events-service]', message, payload);
    return;
  }
  console.log('[events-service]', message);
}

function sanitizeUpcomingEvents(events: EventItem[]): EventItem[] {
  const now = dayjs();

  return events
    .filter((event) => {
      const startsAt = dayjs(event.startsAt);
      return startsAt.isValid() && startsAt.isAfter(now);
    })
    .sort((a, b) => dayjs(a.startsAt).valueOf() - dayjs(b.startsAt).valueOf());
}

function buildFallbackEvents(): EventItem[] {
  const results = sanitizeUpcomingEvents(fallbackEvents);

  logEventsDebug('Using fallback events', { count: results.length });
  return results;
}

const fallbackEvents: EventItem[] = [
  {
    id: 'event-1',
    name: 'Summer Lights Festival',
    band: 'Idea Dimension',
    location: 'The Harbor Stage, Brighton',
    startsAt: '2026-07-18T19:30:00Z',
    imageUrl:
      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
    ticketUrl: 'https://www.idimensionpodcast.com',
  },
  {
    id: 'event-2',
    name: 'City Sessions',
    band: 'Idea Dimension + Guests',
    location: 'North Hall, Manchester',
    startsAt: '2026-08-09T20:00:00Z',
    imageUrl:
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80',
    ticketUrl: 'https://www.idimensionpodcast.com',
  },
];

export async function getUpcomingEvents(): Promise<EventItem[]> {
  logEventsDebug('getUpcomingEvents called');
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const now = dayjs().toISOString();
      logEventsDebug('Querying Supabase events', { now });

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('starts_at', now)
        .eq('is_published', true)
        .order('starts_at', { ascending: true });

      if (error) {
        logEventsDebug('Supabase returned error', {
          message: error.message,
          code: (error as { code?: string }).code,
          details: (error as { details?: string }).details,
          hint: (error as { hint?: string }).hint,
        });
        throw error;
      }

      const mapped = (data ?? []).map((item) => ({
        id: item.id,
        name: item.name,
        band: item.band,
        location: item.location,
        startsAt: item.starts_at,
        imageUrl: item.image_url ?? undefined,
        description: item.description ?? undefined,
        ticketUrl: item.ticket_url ?? undefined,
      }));

      const upcomingSorted = sanitizeUpcomingEvents(mapped);

      logEventsDebug('Supabase query success', {
        rowCount: upcomingSorted.length,
        firstEvent: upcomingSorted[0]?.name ?? null,
      });

      return upcomingSorted;
    } catch (error) {
      logEventsDebug('Falling back due to Supabase failure', {
        error: error instanceof Error ? error.message : String(error),
      });
      // Keep the app usable when Supabase credentials/table/policies are not ready yet.
      return buildFallbackEvents();
    }
  }

  logEventsDebug('No Supabase client, using fallback events');
  return buildFallbackEvents();
}
