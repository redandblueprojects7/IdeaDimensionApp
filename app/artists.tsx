import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { fetchArtists } from '../src/services/artists';
import { brandTheme } from '../src/theme/brand';

export default function ArtistsScreen() {
  const { data: artists, isLoading, isError } = useQuery({
    queryKey: ['artists'],
    queryFn: () => fetchArtists(40),
  });

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.container}>
      <Text style={styles.title}>About the Artists</Text>
      <Text style={styles.subtitle}>Meet the bands featured by Idea Dimension</Text>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 20 }} size="large" />
      ) : isError ? (
        <Text style={styles.error}>Could not load artists. Check your Supabase table and policies.</Text>
      ) : (
        <View style={styles.list}>
          {(artists ?? []).map((artist) => (
            <View key={artist.id} style={styles.card}>
              <Image source={artist.imageUrl ?? artist.logoUrl} style={styles.heroImage} contentFit="cover" />
              <View style={styles.body}>
                <View style={styles.headingRow}>
                  <Image source={artist.logoUrl ?? artist.imageUrl} style={styles.logo} contentFit="contain" />
                  <Text style={styles.name}>{artist.name}</Text>
                </View>

                {artist.members.length > 0 ? (
                  <Text style={styles.members}>Members: {artist.members.join(', ')}</Text>
                ) : null}

                <Text style={styles.description}>{artist.description}</Text>

                {artist.externalUrl ? (
                  <Pressable
                    style={({ pressed }) => [styles.linkButton, pressed && { opacity: 0.75 }]}
                    onPress={() => Linking.openURL(artist.externalUrl!)}
                  >
                    <Text style={styles.linkButtonText}>{artist.externalLabel ?? 'Visit artist page'}</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: brandTheme.colors.background },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28 },
  title: {
    fontSize: 24,
    fontWeight: brandTheme.weights.bold,
    color: brandTheme.colors.dark,
    fontFamily: brandTheme.fonts.regular,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 16,
    color: brandTheme.colors.mutedText,
    fontFamily: brandTheme.fonts.light,
    fontWeight: brandTheme.weights.light,
  },
  error: {
    marginTop: 20,
    color: brandTheme.colors.error,
    lineHeight: 24,
    fontFamily: brandTheme.fonts.light,
    fontWeight: brandTheme.weights.light,
  },
  list: { gap: 16 },
  card: {
    backgroundColor: brandTheme.colors.card,
    borderRadius: brandTheme.radius.lg,
    borderWidth: 1,
    borderColor: brandTheme.colors.border,
    overflow: 'hidden',
    ...brandTheme.shadows.card,
  },
  heroImage: { width: '100%', height: 188, backgroundColor: '#f1e3ee' },
  body: { padding: 12 },
  headingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f6edf4',
    marginRight: 10,
  },
  name: {
    flex: 1,
    fontSize: 18,
    color: brandTheme.colors.dark,
    fontFamily: brandTheme.fonts.regular,
    fontWeight: brandTheme.weights.bold,
  },
  members: {
    marginBottom: 8,
    color: brandTheme.colors.accent,
    fontFamily: brandTheme.fonts.regular,
    fontWeight: brandTheme.weights.semibold,
  },
  description: {
    color: brandTheme.colors.dark,
    lineHeight: 22,
    fontFamily: brandTheme.fonts.light,
    fontWeight: brandTheme.weights.light,
  },
  linkButton: {
    marginTop: 14,
    alignSelf: 'flex-start',
    backgroundColor: brandTheme.colors.banner,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  linkButtonText: {
    color: '#fff',
    fontFamily: brandTheme.fonts.regular,
    fontWeight: brandTheme.weights.semibold,
  },
});
