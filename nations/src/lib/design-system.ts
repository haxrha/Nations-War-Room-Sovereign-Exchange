/** Linear / Modern design tokens — single source of truth */
export const tokens = {
  color: {
    backgroundDeep: '#020203',
    backgroundBase: '#050506',
    backgroundElevated: '#0a0a0c',
    surface: 'rgba(255,255,255,0.05)',
    surfaceHover: 'rgba(255,255,255,0.08)',
    foreground: '#EDEDEF',
    foregroundMuted: '#8A8F98',
    foregroundSubtle: 'rgba(255,255,255,0.60)',
    accent: '#5E6AD2',
    accentBright: '#6872D9',
    accentGlow: 'rgba(94,106,210,0.3)',
    borderDefault: 'rgba(255,255,255,0.06)',
    borderHover: 'rgba(255,255,255,0.10)',
    borderAccent: 'rgba(94,106,210,0.30)',
    success: '#34d399',
    danger: '#f87171',
    inputBg: '#0F0F12',
  },
  shadow: {
    card: '0 0 0 1px rgba(255,255,255,0.06), 0 2px 20px rgba(0,0,0,0.4), 0 0 40px rgba(0,0,0,0.2)',
    cardHover:
      '0 0 0 1px rgba(255,255,255,0.1), 0 8px 40px rgba(0,0,0,0.5), 0 0 80px rgba(94,106,210,0.1)',
    accent:
      '0 0 0 1px rgba(94,106,210,0.5), 0 4px 12px rgba(94,106,210,0.3), inset 0 1px 0 0 rgba(255,255,255,0.2)',
    innerHighlight: 'inset 0 1px 0 0 rgba(255,255,255,0.1)',
  },
  easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
  duration: {
    fast: '200ms',
    normal: '300ms',
    slow: '600ms',
  },
} as const

export const COMMODITY_COLORS: Record<string, string> = {
  OIL: '#5E6AD2',
  STL: '#8A8F98',
  GRN: '#6872D9',
  ELC: '#9AA0FF',
  REE: '#6366f1',
}

export function commodityColor(symbol: string): string {
  return COMMODITY_COLORS[symbol] ?? tokens.color.accent
}
