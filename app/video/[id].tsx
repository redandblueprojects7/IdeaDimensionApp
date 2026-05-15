import { useLocalSearchParams, useRouter } from 'expo-router';
import { Linking, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect, useState } from 'react';

import { brandTheme } from '../../src/theme/brand';

export default function VideoPlayerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const videoId = id ?? '';
  const [blocked, setBlocked] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const inAppWatchUrl = `https://m.youtube.com/watch?v=${videoId}`;
  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  useEffect(() => {
    ScreenOrientation.unlockAsync().catch(() => {});
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, []);

  function openInYouTube() {
    Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`);
  }

  function renderPlayerBar() {
    return (
      <View style={[styles.playerBar, { height: 36 + topInset, paddingTop: topInset }] }>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.playerBarTitle}>Idea Dimension</Text>
        <Text style={styles.playerBarLabel}>In-app player</Text>
      </View>
    );
  }

  if (blocked) {
    return (
      <View style={styles.container}>
        {renderPlayerBar()}

        <View style={styles.fallback}>
          <Text style={styles.fallbackTitle}>Embedding not available</Text>
          <Text style={styles.fallbackBody}>
            {errorCode ? `This video cannot be played in-app (code: ${errorCode}).` : "This video cannot be played in-app."}
          </Text>
          <Pressable style={styles.btn} onPress={openInYouTube}>
            <Text style={styles.btnText}>Watch on YouTube</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderPlayerBar()}

      <WebView
        source={{ uri: inAppWatchUrl }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo
        thirdPartyCookiesEnabled
        sharedCookiesEnabled
        userAgent="Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
        onHttpError={(e) => {
          if (e.nativeEvent.statusCode >= 400) {
            setErrorCode(String(e.nativeEvent.statusCode));
            setBlocked(true);
          }
        }}
        onError={() => {
          setErrorCode('webview-error');
          setBlocked(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  webview: { flex: 1 },
  playerBar: {
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: brandTheme.colors.banner,
    borderBottomWidth: 1,
    borderBottomColor: brandTheme.colors.dark,
  },
  backButton: {
    minWidth: 52,
    paddingVertical: 4,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  playerBarTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    flex: 1,
    textAlign: 'center',
  },
  playerBarLabel: {
    color: '#f3eaf0',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    minWidth: 88,
    textAlign: 'right',
  },
  fallback: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  fallbackTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  fallbackBody: {
    color: '#aaa',
    marginBottom: 24,
    textAlign: 'center',
  },
  btn: {
    backgroundColor: '#ff0000',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 8,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});