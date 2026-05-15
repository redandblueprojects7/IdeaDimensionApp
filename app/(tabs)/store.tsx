import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Linking from 'expo-linking';
import { Image } from 'expo-image';

import { fetchProducts, getStoreHomeUrl } from '../../src/services/shopify';
import { brandTheme } from '../../src/theme/brand';

export default function StoreScreen() {
  const { data: products, isLoading, isError } = useQuery({
    queryKey: ['products'],
    queryFn: () => fetchProducts(20),
  });

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.container}>
      <Text style={styles.title}>Store</Text>
      <Text style={styles.subtitle}>Shout My Band — tap any item to open in store</Text>

      <View style={styles.webviewWrap}>
        <WebView source={{ uri: getStoreHomeUrl() }} style={styles.webview} />
      </View>

      <View style={styles.productsWrap}>
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 16 }} />
        ) : isError ? (
          <Text style={styles.error}>Could not load products. Add your Shopify Storefront token to .env</Text>
        ) : (
          (products ?? []).map((product) => (
            <TouchableOpacity key={product.id} style={styles.card} onPress={() => Linking.openURL(product.url)}>
              <Image source={product.imageUrl} style={styles.image} contentFit="cover" />
              <View style={styles.textWrap}>
                <Text style={styles.cardTitle}>{product.title}</Text>
                <Text style={styles.price}>{product.price}</Text>
                <Text style={styles.action}>Open in store</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: brandTheme.colors.background },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: brandTheme.weights.bold, color: brandTheme.colors.dark, fontFamily: brandTheme.fonts.regular },
  subtitle: { marginTop: 4, marginBottom: 16, color: brandTheme.colors.mutedText, fontFamily: brandTheme.fonts.light, fontWeight: brandTheme.weights.light },
  webviewWrap: {
    borderRadius: brandTheme.radius.lg,
    overflow: 'hidden',
    height: 320,
    borderWidth: 1,
    borderColor: brandTheme.colors.border,
    backgroundColor: brandTheme.colors.card,
    ...brandTheme.shadows.card,
  },
  webview: { flex: 1 },
  productsWrap: { marginTop: 18, gap: 13 },
  error: { marginTop: 16, color: brandTheme.colors.error, lineHeight: 24, fontFamily: brandTheme.fonts.light, fontWeight: brandTheme.weights.light },
  card: {
    flexDirection: 'row',
    backgroundColor: brandTheme.colors.card,
    borderRadius: brandTheme.radius.md,
    borderWidth: 1,
    borderColor: brandTheme.colors.border,
    overflow: 'hidden',
    ...brandTheme.shadows.card,
  },
  image: { width: 108, height: 108 },
  textWrap: { flex: 1, padding: 11 },
  cardTitle: { fontWeight: brandTheme.weights.semibold, color: brandTheme.colors.dark, fontFamily: brandTheme.fonts.regular },
  price: { color: brandTheme.colors.accent, marginTop: 4, fontWeight: brandTheme.weights.semibold, fontFamily: brandTheme.fonts.regular },
  action: { marginTop: 6, color: brandTheme.colors.dark, fontFamily: brandTheme.fonts.light, fontWeight: brandTheme.weights.light },
});
