export const brandTheme = {
  colors: {
    banner: '#a47f94',
    dark: '#261f2f',
    accent: '#a78799',
    background: '#f9ebdc',
    card: '#fff7ef',
    border: '#d7c2cf',
    mutedText: '#6b5a67',
    error: '#8f2f57',
  },
  fonts: {
    regular: 'System',
    light: 'System',
  },
  weights: {
    regular: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    light: '300' as const,
  },
  radius: {
    md: 12,
    lg: 16,
  },
  shadows: {
    card: {
      shadowColor: '#261f2f',
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
  },
};
