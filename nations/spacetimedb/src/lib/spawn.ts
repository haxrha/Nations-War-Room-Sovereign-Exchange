/** Starting treasury — aligned with bot nations (~$350k–$780k). */
export const HUMAN_START_BALANCE = 480_000;

/** Modest starter stockpile so new players can list and trade immediately. */
export const HUMAN_STARTER_RESOURCES = [
  { symbol: 'GRN', qty: 2_500, productionRate: 2 },
  { symbol: 'STL', qty: 1_200, productionRate: 1 },
  { symbol: 'OIL', qty: 600, productionRate: 1 },
] as const;

/** Spawn slots so multiple human players don't stack on the same map point. */
export const PLAYER_SPAWN_SLOTS = [
  { lat: 38.9, lng: -77.0, region: 'North America', flag: '🇺🇸' },
  { lat: 51.5, lng: -0.12, region: 'Europe', flag: '🇬🇧' },
  { lat: 35.7, lng: 139.7, region: 'East Asia', flag: '🇯🇵' },
  { lat: -33.9, lng: 18.4, region: 'Africa', flag: '🇿🇦' },
  { lat: -15.8, lng: -47.9, region: 'South America', flag: '🇧🇷' },
  { lat: 28.6, lng: 77.2, region: 'South Asia', flag: '🇮🇳' },
  { lat: -35.3, lng: 149.1, region: 'Oceania', flag: '🇦🇺' },
  { lat: 55.8, lng: 37.6, region: 'Eurasia', flag: '🇷🇺' },
  { lat: 48.9, lng: 2.35, region: 'Europe', flag: '🇫🇷' },
  { lat: 19.4, lng: -99.1, region: 'North America', flag: '🇲🇽' },
  { lat: 1.35, lng: 103.8, region: 'Southeast Asia', flag: '🇸🇬' },
  { lat: 41.0, lng: 29.0, region: 'Middle East', flag: '🇹🇷' },
] as const

export function pickPlayerSpawn(humanIndex: number) {
  const slot = PLAYER_SPAWN_SLOTS[humanIndex % PLAYER_SPAWN_SLOTS.length]!
  const ring = Math.floor(humanIndex / PLAYER_SPAWN_SLOTS.length)
  const jitter = ring * 0.35
  const angle = (humanIndex * 2.399) % (Math.PI * 2)
  return {
    lat: slot.lat + Math.sin(angle) * jitter,
    lng: slot.lng + Math.cos(angle) * jitter,
    region: slot.region,
    flag: slot.flag,
  }
}
