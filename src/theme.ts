import { Platform } from 'react-native';

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

// Platform-safe text glow. Web uses the CSS textShadow shorthand;
// native uses the individual textShadow* props (RNW deprecated them).
export function textGlow(color: string, radius: number): object {
  return (
    Platform.select({
      web: { textShadow: `0 0 ${radius}px ${color}` },
      default: {
        textShadowColor: color,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: radius,
      },
    }) ?? {}
  );
}

// Platform-safe box / drop glow.
export function boxGlow(color: string, radius: number, opacity = 0.8): object {
  return (
    Platform.select({
      web: { boxShadow: `0 0 ${radius}px ${color}` },
      default: {
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: radius,
        shadowOpacity: opacity,
        elevation: Math.ceil(radius / 2),
      },
    }) ?? {}
  );
}
