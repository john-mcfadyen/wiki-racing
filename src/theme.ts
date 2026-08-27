export const C = {
  bg: '#07070A',
  surface: '#0E0E16',
  elevated: '#141421',
  border: '#1A1A2C',
  borderBright: '#242438',

  accent: '#6DFF6D',
  accentGlow: 'rgba(109, 255, 109, 0.14)',
  accentDim: 'rgba(109, 255, 109, 0.06)',

  cyan: '#38D9FF',
  cyanGlow: 'rgba(56, 217, 255, 0.14)',

  text: '#EDEDFA',
  muted: '#62629A',
  dim: '#2A2A46',

  danger: '#FF3B5C',
  dangerGlow: 'rgba(255, 59, 92, 0.14)',
  dangerDim: 'rgba(255, 59, 92, 0.07)',

  warning: '#FFB400',
  warningGlow: 'rgba(255, 180, 0, 0.14)',

  easy: '#6DFF6D',
  medium: '#FFB400',
  hard: '#FF3B5C',
} as const;

export const F = {
  display: 'BarlowCondensed_800ExtraBold',
  displayBold: 'BarlowCondensed_700Bold',
  mono: 'JetBrainsMono_400Regular',
  monoBold: 'JetBrainsMono_700Bold',
} as const;

export function difficultyColor(d: string): string {
  if (d === 'easy') return C.easy;
  if (d === 'medium') return C.medium;
  return C.hard;
}
