/** War room / Bloomberg terminal design tokens */
export const tokens = {
  color: {
    backgroundDeep: '#060b14',
    backgroundBase: '#0a0e1a',
    backgroundElevated: '#0f1729',
    surface: 'rgba(15, 23, 41, 0.85)',
    surfaceHover: 'rgba(26, 158, 117, 0.08)',
    foreground: '#f1f5f9',
    foregroundMuted: '#94a3b8',
    foregroundSubtle: '#64748b',
    accent: '#1a9e75',
    accentBright: '#2dd4bf',
    accentGlow: 'rgba(45, 212, 191, 0.25)',
    borderDefault: 'rgba(26, 158, 117, 0.12)',
    borderHover: 'rgba(45, 212, 191, 0.28)',
    borderAccent: 'rgba(45, 212, 191, 0.35)',
    success: '#2dd4bf',
    danger: '#f87171',
    warning: '#fbbf24',
    inputBg: '#0a0e1a',
  },
  shadow: {
    card: '0 0 0 1px rgba(26,158,117,0.08), 0 4px 24px rgba(0,0,0,0.5)',
    cardHover:
      '0 0 0 1px rgba(45,212,191,0.22), 0 0 32px rgba(45,212,191,0.12), 0 8px 40px rgba(0,0,0,0.55)',
    accent:
      '0 0 0 1px rgba(45,212,191,0.4), 0 4px 16px rgba(26,158,117,0.25), inset 0 1px 0 0 rgba(255,255,255,0.08)',
    innerHighlight: 'inset 0 1px 0 0 rgba(255,255,255,0.06)',
  },
  easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
  duration: {
    fast: '200ms',
    normal: '300ms',
    slow: '600ms',
  },
} as const

export const COMMODITY_COLORS: Record<string, string> = {
  OIL: '#fbbf24',
  STL: '#94a3b8',
  GRN: '#2dd4bf',
  ELC: '#60a5fa',
  REE: '#a78bfa',
}

export function commodityColor(symbol: string): string {
  return COMMODITY_COLORS[symbol] ?? tokens.color.accentBright
}
