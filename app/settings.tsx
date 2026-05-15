import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { brandTheme } from '../src/theme/brand';

export default function SettingsScreen() {
  const [openInApp, setOpenInApp] = useState(true);
  const [eventReminders, setEventReminders] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Core controls for app behavior.</Text>

      <View style={styles.row}>
        <View>
          <Text style={styles.label}>Open links in app</Text>
          <Text style={styles.helper}>Use in-app views for video/store links</Text>
        </View>
        <Switch
          value={openInApp}
          onValueChange={setOpenInApp}
          thumbColor={brandTheme.colors.banner}
          trackColor={{ false: brandTheme.colors.accent, true: brandTheme.colors.dark }}
        />
      </View>

      <View style={styles.row}>
        <View>
          <Text style={styles.label}>Event reminders</Text>
          <Text style={styles.helper}>Enable future push reminder support</Text>
        </View>
        <Switch
          value={eventReminders}
          onValueChange={setEventReminders}
          thumbColor={brandTheme.colors.banner}
          trackColor={{ false: brandTheme.colors.accent, true: brandTheme.colors.dark }}
        />
      </View>

      <View style={styles.row}>
        <View>
          <Text style={styles.label}>Auto refresh content</Text>
          <Text style={styles.helper}>Refresh videos, store, and events in background</Text>
        </View>
        <Switch
          value={autoRefresh}
          onValueChange={setAutoRefresh}
          thumbColor={brandTheme.colors.banner}
          trackColor={{ false: brandTheme.colors.accent, true: brandTheme.colors.dark }}
        />
      </View>

      <View style={styles.aboutWrap}>
        <Text style={styles.aboutTitle}>About</Text>
        <Text style={styles.aboutText}>Idea Dimension v1.0.0</Text>
        <Text style={styles.aboutText}>Support: filmdimension.enquiries@gmail.com</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: brandTheme.colors.background },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 32, gap: 12 },
  title: { fontSize: 24, fontWeight: brandTheme.weights.bold, color: brandTheme.colors.dark, fontFamily: brandTheme.fonts.regular },
  subtitle: { color: brandTheme.colors.mutedText, marginBottom: 8, fontFamily: brandTheme.fonts.light, fontWeight: brandTheme.weights.light },
  row: {
    backgroundColor: brandTheme.colors.card,
    borderRadius: brandTheme.radius.md,
    borderWidth: 1,
    borderColor: brandTheme.colors.border,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    ...brandTheme.shadows.card,
  },
  label: { fontWeight: brandTheme.weights.semibold, color: brandTheme.colors.dark, fontFamily: brandTheme.fonts.regular },
  helper: { color: brandTheme.colors.mutedText, marginTop: 3, fontFamily: brandTheme.fonts.light, fontWeight: brandTheme.weights.light },
  aboutWrap: {
    marginTop: 10,
    backgroundColor: brandTheme.colors.card,
    borderRadius: brandTheme.radius.md,
    borderWidth: 1,
    borderColor: brandTheme.colors.border,
    padding: 13,
    gap: 4,
    ...brandTheme.shadows.card,
  },
  aboutTitle: { fontWeight: brandTheme.weights.semibold, color: brandTheme.colors.dark, fontFamily: brandTheme.fonts.regular },
  aboutText: { color: brandTheme.colors.mutedText, fontFamily: brandTheme.fonts.light, fontWeight: brandTheme.weights.light },
});
