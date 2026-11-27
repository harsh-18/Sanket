export const SANKET_COLORS = {
  bg: '#F8F9FF',
  surface: '#FFFFFF',
  lavender: '#EAE8FF',
  primary: '#6655D9',
  primaryHover: '#5544C8',
  text: '#20233B',
  textSecondary: '#686B80',
  mint: '#DDF5EC',
  mintText: '#0F6B48',
  blue: '#E5F0FF',
  blueText: '#1D4ED8',
  amber: '#FFF1D8',
  amberText: '#92400E',
  border: '#E7E8F0',
  danger: '#DC2626',
  dangerBg: '#FEE2E2',
} as const;

export const SANKET_SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const SANKET_RADIUS = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 24,
  pill: 999,
} as const;

export const SUPPORTED_LANGUAGES = [
  { code: 'hi-IN', label: 'हिन्दी (Hindi)', short: 'Hindi' },
  { code: 'en-IN', label: 'English (India)', short: 'English' },
] as const;
