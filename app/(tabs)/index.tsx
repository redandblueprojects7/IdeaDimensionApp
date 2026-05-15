import { useState } from 'react';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

import { fetchProducts } from '../../src/services/shopify';
import { fetchChannelVideos } from '../../src/services/youtube';
import { subscribeEmail } from '../../src/services/newsletter';
import { fetchArtists } from '../../src/services/artists';
import { brandTheme } from '../../src/theme/brand';

const SOCIALS = [
  { icon: 'tiktok' as const, label: 'TikTok', url: 'https://www.tiktok.com/@theideadimension' },
  { icon: 'instagram' as const, label: 'Instagram', url: 'https://www.instagram.com/i_dimensionpodcast' },
  { icon: 'youtube' as const, label: 'YouTube', url: 'https://www.youtube.com/@idimensionpodcast' },
];

export default function HomeScreen() {
  const videos = useQuery({ queryKey: ['videos'], queryFn: () => fetchChannelVideos(6) });
  const products = useQuery({ queryKey: ['products'], queryFn: () => fetchProducts(6) });
  const artists = useQuery({ queryKey: ['artists-home'], queryFn: () => fetchArtists(8) });

  const ABOUT_VIDEO_ID = 'IloxTaHN0oo';
  const aboutThumbnail = `https://img.youtube.com/vi/${ABOUT_VIDEO_ID}/hqdefault.jpg`;

  const [email, setEmail] = useState('');
  const [signupState, setSignupState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [signupMessage, setSignupMessage] = useState('');

  async function handleSubscribe() {
    setSignupState('loading');
    setSignupMessage('');
    try {
      await subscribeEmail(email);
      setSignupState('success');
      setSignupMessage('You\'re subscribed! Thanks for joining.');
      setEmail('');
    } catch (err) {
      setSignupState('error');
      setSignupMessage(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About Us</Text>
        <TouchableOpacity style={styles.trailerCard} onPress={() => router.push(`/video/${ABOUT_VIDEO_ID}`)}>
          <Image source={aboutThumbnail} style={styles.trailerImage} contentFit="cover" />
          <View style={styles.cardOverlay}>
            <Text style={styles.cardSubtitle}>Tap to play</Text>
          </View>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stay in the Loop</Text>
          <Text style={styles.signupBody}>
            Sign up to hear about latest updates, new releases and competitions.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Your email address"
            placeholderTextColor={brandTheme.colors.mutedText}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            editable={signupState !== 'loading' && signupState !== 'success'}
          />
          {signupState !== 'success' ? (
            <TouchableOpacity
              style={[styles.signupBtn, signupState === 'loading' && { opacity: 0.6 }]}
              onPress={handleSubscribe}
              disabled={signupState === 'loading'}
            >
              {signupState === 'loading'
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.signupBtnText}>Subscribe</Text>}
            </TouchableOpacity>
          ) : null}
          {signupMessage ? (
            <Text style={signupState === 'error' ? styles.signupError : styles.signupSuccess}>
              {signupMessage}
            </Text>
          ) : null}
        </View>
      </KeyboardAvoidingView>

      <View style={styles.section}>
        <Pressable
          onPress={() => router.push('/(tabs)/videos')}
          style={({ pressed }) => [styles.artistsHeadingRow, pressed && { opacity: 0.72 }]}
        >
          <Text style={styles.artistsHeadingTitle}>Latest Videos</Text>
          <Text style={styles.artistsHeadingLink}>View all</Text>
        </Pressable>
        {videos.isLoading ? (
          <ActivityIndicator style={{ marginTop: 8 }} />
        ) : videos.isError ? (
          <Text style={styles.errorText}>Could not load videos. Check your YouTube API key.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(videos.data ?? []).map((video) => (
              <TouchableOpacity key={video.id} style={styles.horizontalCard} onPress={() => router.push(`/video/${video.id}`)}>
                <Image source={video.thumbnailUrl} style={styles.thumb} contentFit="cover" />
                <Text style={styles.itemTitle} numberOfLines={2}>{video.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.section}>
        <Pressable
          onPress={() => router.push('/(tabs)/store')}
          style={({ pressed }) => [styles.artistsHeadingRow, pressed && { opacity: 0.72 }]}
        >
          <Text style={styles.artistsHeadingTitle}>Featured Products</Text>
          <Text style={styles.artistsHeadingLink}>View all</Text>
        </Pressable>
        {products.isLoading ? (
          <ActivityIndicator style={{ marginTop: 8 }} />
        ) : products.isError ? (
          <Text style={styles.errorText}>Could not load store items. Check your Shopify token.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(products.data ?? []).map((product) => (
              <TouchableOpacity key={product.id} style={styles.horizontalCard} onPress={() => Linking.openURL(product.url)}>
                <Image source={product.imageUrl} style={styles.thumb} contentFit="cover" />
                <Text style={styles.itemTitle} numberOfLines={1}>{product.title}</Text>
                <Text style={styles.price}>{product.price}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.section}>
        <Pressable
          onPress={() => router.push('/artists' as never)}
          style={({ pressed }) => [styles.artistsHeadingRow, pressed && { opacity: 0.72 }]}
        >
          <Text style={styles.artistsHeadingTitle}>About the Artists</Text>
          <Text style={styles.artistsHeadingLink}>View all</Text>
        </Pressable>

        {artists.isLoading ? (
          <ActivityIndicator style={{ marginTop: 8 }} />
        ) : artists.isError ? (
          <Text style={styles.errorText}>Could not load artists. Check your Supabase setup.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(artists.data ?? []).map((artist) => (
              <View key={artist.id} style={styles.artistLogoCard}>
                <Image source={artist.logoUrl ?? artist.imageUrl} style={styles.artistLogo} contentFit="contain" />
                <Text style={styles.artistLogoName} numberOfLines={1}>{artist.name}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.socialsSection}>
        <Text style={styles.sectionTitle}>Follow Us</Text>
        <View style={styles.socialsRow}>
          {SOCIALS.map(({ icon, label, url }) => (
            <Pressable
              key={icon}
              style={({ pressed }) => [styles.socialBtn, pressed && { opacity: 0.65 }]}
              onPress={() => Linking.openURL(url)}
            >
              <FontAwesome5 name={icon} size={28} color={brandTheme.colors.banner} solid={false} />
              <Text style={styles.socialLabel}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: brandTheme.colors.background },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16 },
  section: { marginBottom: 22 },
  sectionTitle: {
    fontSize: 19,
    marginBottom: 12,
    color: brandTheme.colors.dark,
    fontFamily: brandTheme.fonts.regular,
    fontWeight: brandTheme.weights.bold,
  },
  loadingBox: {
    height: 190,
    borderRadius: 14,
    backgroundColor: brandTheme.colors.card,
    borderWidth: 1,
    borderColor: brandTheme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: { color: brandTheme.colors.error, marginTop: 4, fontFamily: brandTheme.fonts.light },
  trailerCard: { borderRadius: 14, overflow: 'hidden', backgroundColor: brandTheme.colors.dark },
  trailerImage: { width: '100%', height: 214 },
  cardOverlay: { padding: 14 },
  cardTitle: {
    color: brandTheme.colors.banner,
    fontSize: 17,
    fontWeight: brandTheme.weights.semibold,
    fontFamily: brandTheme.fonts.regular,
    lineHeight: 22,
  },
  cardSubtitle: {
    color: brandTheme.colors.accent,
    marginTop: 4,
    fontFamily: brandTheme.fonts.light,
    fontWeight: brandTheme.weights.light,
  },
  horizontalCard: {
    width: 204,
    backgroundColor: brandTheme.colors.card,
    borderRadius: brandTheme.radius.md,
    marginRight: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: brandTheme.colors.border,
    ...brandTheme.shadows.card,
  },
  thumb: { width: '100%', height: 124 },
  itemTitle: {
    paddingHorizontal: 10,
    paddingTop: 11,
    color: brandTheme.colors.dark,
    fontWeight: brandTheme.weights.semibold,
    fontFamily: brandTheme.fonts.regular,
    lineHeight: 19,
  },
  price: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    color: brandTheme.colors.accent,
    fontWeight: brandTheme.weights.semibold,
    fontFamily: brandTheme.fonts.regular,
  },
  signupBody: {
    marginBottom: 12,
    color: brandTheme.colors.mutedText,
    fontFamily: brandTheme.fonts.light,
    fontWeight: brandTheme.weights.light,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: brandTheme.colors.border,
    borderRadius: brandTheme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: brandTheme.colors.dark,
    backgroundColor: brandTheme.colors.card,
    fontFamily: brandTheme.fonts.light,
    marginBottom: 10,
  },
  signupBtn: {
    backgroundColor: brandTheme.colors.banner,
    borderRadius: brandTheme.radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  signupBtnText: {
    color: '#fff',
    fontWeight: brandTheme.weights.semibold,
    fontFamily: brandTheme.fonts.regular,
    fontSize: 15,
  },
  signupError: {
    marginTop: 8,
    color: brandTheme.colors.error,
    fontFamily: brandTheme.fonts.light,
  },
  signupSuccess: {
    marginTop: 8,
    color: '#4caf50',
    fontFamily: brandTheme.fonts.light,
  },
  socialsSection: {
    marginBottom: 8,
  },
  socialsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
  },
  socialBtn: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  socialLabel: {
    color: brandTheme.colors.banner,
    fontSize: 12,
    fontWeight: brandTheme.weights.semibold,
    fontFamily: brandTheme.fonts.regular,
  },
  artistsHeadingRow: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  artistsHeadingTitle: {
    fontSize: 19,
    color: brandTheme.colors.dark,
    fontFamily: brandTheme.fonts.regular,
    fontWeight: brandTheme.weights.bold,
  },
  artistsHeadingLink: {
    color: brandTheme.colors.banner,
    fontFamily: brandTheme.fonts.regular,
    fontWeight: brandTheme.weights.semibold,
  },
  artistLogoCard: {
    width: 132,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brandTheme.colors.border,
    backgroundColor: brandTheme.colors.card,
    padding: 10,
    alignItems: 'center',
    ...brandTheme.shadows.card,
  },
  artistLogo: {
    width: 104,
    height: 86,
    backgroundColor: '#f6edf4',
  },
  artistLogoName: {
    marginTop: 8,
    color: brandTheme.colors.dark,
    fontFamily: brandTheme.fonts.regular,
    fontWeight: brandTheme.weights.semibold,
    fontSize: 12,
  },
});
