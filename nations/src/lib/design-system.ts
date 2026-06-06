export const designSystem = {
  colors: {
    background: '#0D0D1A',
    foreground: '#FFFFFF',
    muted: '#2D1B4E',
    accent: '#FF3AF2',
    secondary: '#00F5D4',
    tertiary: '#FFE600',
    quaternary: '#FF6B35',
    quinary: '#7B2FFF',
  },
} as const

export const ACCENTS = [
  '#FF3AF2',
  '#00F5D4',
  '#FFE600',
  '#FF6B35',
  '#7B2FFF',
] as const

export function accentAt(index: number): string {
  return ACCENTS[index % ACCENTS.length]
}

export function clashBorder(bgIndex: number): string {
  return ACCENTS[(bgIndex + 2) % ACCENTS.length]
}

export function borderStyleAt(index: number): string {
  return ['border-solid', 'border-dashed', 'border-dotted'][index % 3]
}

export function cardRotation(index: number): string {
  return ['rotate-0', 'rotate-1', '-rotate-1', 'rotate-2', '-rotate-2'][index % 5]
}
