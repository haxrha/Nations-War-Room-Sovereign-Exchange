import type { ModuleCtx } from '../schema';

interface EventEffect {
  symbol: string;
  multiplier: number;
}

interface EventTemplate {
  type: string;
  headline: string;
  description: string;
  effects: EventEffect[];
}

export const EVENT_TEMPLATES: EventTemplate[] = [
  {
    type: 'pandemic',
    headline: '🦠 Global Pandemic Declared',
    description: 'WHO declares global pandemic. Grain hoarding surges, factory output collapses, energy demand drops.',
    effects: [
      { symbol: 'GRN', multiplier: 1.22 },
      { symbol: 'ELC', multiplier: 0.84 },
      { symbol: 'OIL', multiplier: 0.88 },
    ],
  },
  {
    type: 'canal_blockage',
    headline: '⛵ Suez Canal Blocked',
    description: 'A mega container ship has run aground, blocking the canal for weeks. Energy and steel shipments critically delayed.',
    effects: [
      { symbol: 'OIL', multiplier: 1.28 },
      { symbol: 'STL', multiplier: 1.15 },
    ],
  },
  {
    type: 'solar_flare',
    headline: '☀️ X-Class Solar Storm',
    description: 'Massive solar flare damages satellite and grid infrastructure worldwide. Electronics supply chains severely disrupted.',
    effects: [
      { symbol: 'ELC', multiplier: 0.70 },
      { symbol: 'REE', multiplier: 1.20 },
    ],
  },
  {
    type: 'opec_meeting',
    headline: '🛢️ OPEC Emergency Cut',
    description: 'OPEC agrees to cut production by 2M barrels per day. Oil prices surge on announcement.',
    effects: [
      { symbol: 'OIL', multiplier: 1.38 },
    ],
  },
  {
    type: 'ai_breakthrough',
    headline: '🤖 AI Compute Breakthrough',
    description: 'Major lab announces AGI-level model requiring 10x rare earth elements. Global demand for REE and chips explodes.',
    effects: [
      { symbol: 'REE', multiplier: 1.48 },
      { symbol: 'ELC', multiplier: 1.26 },
    ],
  },
  {
    type: 'financial_crisis',
    headline: '📉 Global Financial Crisis',
    description: 'Major banking contagion triggers worldwide recession. Commodity prices fall sharply across all sectors.',
    effects: [
      { symbol: 'OIL', multiplier: 0.76 },
      { symbol: 'STL', multiplier: 0.80 },
      { symbol: 'ELC', multiplier: 0.83 },
      { symbol: 'GRN', multiplier: 0.87 },
      { symbol: 'REE', multiplier: 0.78 },
    ],
  },
  {
    type: 'arctic_cold_snap',
    headline: '❄️ Arctic Cold Snap Paralyzes Farms',
    description: 'Unprecedented winter storm blankets major agricultural belts. Food prices spike; heating oil demand surges.',
    effects: [
      { symbol: 'GRN', multiplier: 1.32 },
      { symbol: 'OIL', multiplier: 1.18 },
    ],
  },
];

export function runEventTick(ctx: ModuleCtx): void {
  const now = ctx.timestamp.microsSinceUnixEpoch;

  // Deactivate events older than 90 seconds so the popup clears
  const expiryMicros = now - 90_000_000n;
  for (const ev of ctx.db.worldEvent.byActive.filter(true)) {
    if (ev.triggeredAt.microsSinceUnixEpoch < expiryMicros) {
      ctx.db.worldEvent.id.update({ ...ev, active: false });
    }
  }

  // ~5% chance per 60-second tick to trigger a new event
  const rng = Number(now % 10_000n);
  if (rng >= 500) return;

  // Avoid triggering a second event if one is already active
  for (const ev of ctx.db.worldEvent.byActive.filter(true)) {
    void ev;
    return;
  }

  const templateIdx = Number((now / 1_000n) % BigInt(EVENT_TEMPLATES.length));
  const template = EVENT_TEMPLATES[templateIdx];

  let primaryAffectedId = 0n;
  let primaryMultiplier = 1.0;

  for (const effect of template.effects) {
    for (const spot of ctx.db.spotPrice.iter()) {
      const comm = ctx.db.commodity.id.find(spot.commodityId);
      if (comm?.symbol !== effect.symbol) continue;

      const anchor = comm.basePrice;
      const rawNew = spot.price * effect.multiplier;
      const clamped = Math.max(anchor * 0.15, Math.min(anchor * 6, rawNew));

      ctx.db.spotPrice.id.update({
        ...spot,
        price: clamped,
        updatedAt: ctx.timestamp,
      });

      if (primaryAffectedId === 0n) {
        primaryAffectedId = spot.commodityId;
        primaryMultiplier = effect.multiplier;
      }
      break;
    }
  }

  ctx.db.worldEvent.insert({
    id: 0n,
    eventType: template.type,
    headline: template.headline,
    description: template.description,
    affectedCommodityId: primaryAffectedId,
    priceMultiplier: primaryMultiplier,
    active: true,
    triggeredAt: ctx.timestamp,
  });

  console.info(`[event] ${template.headline}`);
}
