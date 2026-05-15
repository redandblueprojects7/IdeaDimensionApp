import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import dayjs from 'dayjs';

import { EventItem } from '../../src/types/event';
import { getUpcomingEvents } from '../../src/services/events';
import { brandTheme } from '../../src/theme/brand';

function logEventsScreenDebug(message: string, payload?: unknown) {
  if (!__DEV__) return;
  if (payload !== undefined) {
    console.log('[events-screen]', message, payload);
    return;
  }
  console.log('[events-screen]', message);
}

export default function EventsScreen() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    logEventsScreenDebug('Initial load started');

    getUpcomingEvents()
      .then((results) => {
        logEventsScreenDebug('Events loaded', {
          count: results.length,
          firstEvent: results[0]?.name ?? null,
        });
        setEvents(results);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unable to load events right now.';
        logEventsScreenDebug('Events load failed', { message });
        setError(message);
      })
      .finally(() => {
        logEventsScreenDebug('Initial load finished');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    logEventsScreenDebug('Render state changed', {
      loading,
      error,
      eventCount: events.length,
    });
  }, [loading, error, events.length]);

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.container}>
      <Text style={styles.title}>Upcoming Events</Text>

      {loading ? <Text style={styles.meta}>Loading events...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && !error && events.length === 0 ? (
        <Text style={styles.meta}>No upcoming gigs yet.</Text>
      ) : null}

      <View style={styles.list}>
        {events.map((event) => (
          <View key={event.id} style={styles.card}>
            {event.imageUrl ? (
              <Image
                source={event.imageUrl}
                style={[StyleSheet.absoluteFillObject, styles.cardBgImage]}
                contentFit="cover"
              />
            ) : null}
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTextBlock}>
                  <Text style={styles.eventName}>{event.name}</Text>
                  <Text style={styles.band}>{event.band}</Text>
                </View>
                {event.ticketUrl ? (
                  <Pressable
                    style={({ pressed }) => [styles.linkBtn, pressed && { opacity: 0.5 }]}
                    onPress={() => Linking.openURL(event.ticketUrl!)}
                    accessibilityLabel="Open event link"
                  >
                    <FontAwesome name="external-link" size={15} color={brandTheme.colors.dark} />
                  </Pressable>
                ) : null}
              </View>
              <Text style={styles.detail}>{event.location}</Text>
              <Text style={styles.detail}>{dayjs(event.startsAt).format('ddd, MMM D YYYY - h:mm A')}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: brandTheme.colors.background },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: brandTheme.weights.bold, color: brandTheme.colors.dark, fontFamily: brandTheme.fonts.regular },
  subtitle: { marginTop: 4, marginBottom: 16, color: brandTheme.colors.mutedText, fontFamily: brandTheme.fonts.light, fontWeight: brandTheme.weights.light },
  meta: { color: brandTheme.colors.mutedText, marginTop: 8, fontFamily: brandTheme.fonts.light, fontWeight: brandTheme.weights.light },
  error: { color: brandTheme.colors.error, marginTop: 8, fontFamily: brandTheme.fonts.light, fontWeight: brandTheme.weights.light },
  list: { marginTop: 14, gap: 15 },
  card: {
    borderRadius: brandTheme.radius.lg,
    borderWidth: 1,
    borderColor: brandTheme.colors.border,
    backgroundColor: brandTheme.colors.card,
    overflow: 'hidden',
    ...brandTheme.shadows.card,
  },
  cardBgImage: {
    opacity: 0.18,
  },
  cardContent: { padding: 14 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  cardTextBlock: { flex: 1 },
  linkBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: brandTheme.colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  eventName: { fontSize: 18, fontWeight: brandTheme.weights.bold, color: brandTheme.colors.dark, fontFamily: brandTheme.fonts.regular },
  band: { marginTop: 4, fontWeight: brandTheme.weights.semibold, color: brandTheme.colors.dark, fontFamily: brandTheme.fonts.regular },
  detail: { marginTop: 3, color: brandTheme.colors.mutedText, fontFamily: brandTheme.fonts.light, fontWeight: brandTheme.weights.light },
});
