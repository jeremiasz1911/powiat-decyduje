import { StyleSheet } from 'react-native';

export const futuristicTheme = {
  colors: {
    bgTop: '#031020',
    bgBottom: '#072844',
    panel: 'rgba(8, 36, 62, 0.88)',
    panelSoft: 'rgba(13, 47, 79, 0.7)',
    border: 'rgba(73, 184, 255, 0.38)',
    accent: '#22d3ee',
    accentStrong: '#06b6d4',
    textPrimary: '#e2f3ff',
    textMuted: '#8ab3cf',
    textDark: '#0a2238',
    success: '#34d399',
    warning: '#f59e0b',
    danger: '#fb7185',
  },
};

export const futuristicShadows = StyleSheet.create({
  glow: {
    shadowColor: '#22d3ee',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  soft: {
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 8,
  },
});
