import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';

import { fetchChannelVideos } from '../../src/services/youtube';
import { brandTheme } from '../../src/theme/brand';

export default function VideosScreen() {
  const { data: videos, isLoading, isError } = useQuery({
    queryKey: ['videos'],
    queryFn: () => fetchChannelVideos(20),
  });

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.container}>
      <Text style={styles.title}>Videos</Text>
      <Text style={styles.subtitle}>Latest from Idea Dimension</Text>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 24 }} size="large" />
      ) : isError ? (
        <Text style={styles.error}>Could not load videos. Add your YouTube API key to .env</Text>
      ) : (
        <View style={styles.grid}>
          {(videos ?? []).map((video) => (
            <TouchableOpacity key={video.id} style={styles.card} onPress={() => router.push(`/video/${video.id}`)}>
              <Image source={video.thumbnailUrl} style={styles.image} contentFit="cover" />
              <Text style={styles.cardTitle} numberOfLines={2}>{video.title}</Text>
              <Text style={styles.meta}>{video.publishedAt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: brandTheme.colors.background },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 32 },
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
    marginTop: 24,
    color: brandTheme.colors.error,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: brandTheme.fonts.light,
    fontWeight: brandTheme.weights.light,
  },
  grid: { gap: 16 },
  card: {
    backgroundColor: brandTheme.colors.card,
    borderRadius: brandTheme.radius.lg,
    borderWidth: 1,
    borderColor: brandTheme.colors.border,
    overflow: 'hidden',
    ...brandTheme.shadows.card,
  },
  image: { width: '100%', height: 208 },
  cardTitle: {
    paddingHorizontal: 13,
    paddingTop: 11,
    fontWeight: brandTheme.weights.semibold,
    color: brandTheme.colors.dark,
    fontFamily: brandTheme.fonts.regular,
    lineHeight: 21,
  },
  meta: {
    paddingHorizontal: 13,
    paddingBottom: 13,
    paddingTop: 6,
    color: brandTheme.colors.accent,
    fontFamily: brandTheme.fonts.light,
    fontWeight: brandTheme.weights.light,
  },
});
