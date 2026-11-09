import { Platform } from 'react-native';

export const colors = {
  bg: '#F1F4F8',
  accent: '#0E7490',
  accentDark: '#164E63',
  onAccent: '#FFFFFF',
  onAccentMuted: '#CFFAFE',
  ink: '#0F172A',
  muted: '#475569',
  border: '#000000',
  white: '#FFFFFF',
  on: '#86EFAC',
  off: '#FCA5A5',
  possible: '#FDE68A',
  danger: '#FEE2E2',
  dangerText: '#B91C1C',
  neutral: '#E2E8F0',
  scrim: '#00000099',
};

export const mono = Platform.select({ ios: 'Courier New', default: 'monospace' });

export const text = {
  base: { color: colors.ink, fontSize: 15 },
  section: { color: colors.ink, fontSize: 17, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 13 },
  num: { color: colors.ink, fontSize: 15, fontFamily: mono, fontWeight: '700' },
};

export const BORDER = 3;
