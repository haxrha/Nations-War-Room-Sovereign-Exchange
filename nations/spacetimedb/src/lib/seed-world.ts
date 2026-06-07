import { ScheduleAt } from 'spacetimedb';
import type { ModuleCtx } from '../schema';
import { recalculateAllGdp } from './helpers';

type SeedBot = {
  name: string;
  isoCode: string;
  flag: string;
  region: string;
  lat: number;
  lng: number;
  botStrategy: string;
  balance: number;
  resources: { symbol: string; qty: number; productionRate: number }[];
};

/** Scaled for human-scale treasuries (~$100k) — not billions. */
export const SEED_BOTS: SeedBot[] = [
  {
    name: 'Saudi Arabia',
    isoCode: 'SAU',
    flag: '🇸🇦',
    region: 'Middle East',
    lat: 24.7,
    lng: 46.7,
    botStrategy: 'hoarder',
    balance: 620_000,
    resources: [{ symbol: 'OIL', qty: 12_000, productionRate: 8 }],
  },
  {
    name: 'China',
    isoCode: 'CHN',
    flag: '🇨🇳',
    region: 'East Asia',
    lat: 39.9,
    lng: 116.4,
    botStrategy: 'undercutter',
    balance: 780_000,
    resources: [
      { symbol: 'ELC', qty: 4_200, productionRate: 6 },
      { symbol: 'STL', qty: 6_500, productionRate: 5 },
      { symbol: 'REE', qty: 900, productionRate: 2 },
    ],
  },
  {
    name: 'Germany',
    isoCode: 'DEU',
    flag: '🇩🇪',
    region: 'Europe',
    lat: 52.5,
    lng: 13.4,
    botStrategy: 'protectionist',
    balance: 540_000,
    resources: [
      { symbol: 'STL', qty: 3_800, productionRate: 4 },
      { symbol: 'ELC', qty: 1_400, productionRate: 3 },
    ],
  },
  {
    name: 'Brazil',
    isoCode: 'BRA',
    flag: '🇧🇷',
    region: 'South America',
    lat: -15.8,
    lng: -47.9,
    botStrategy: 'undercutter',
    balance: 380_000,
    resources: [
      { symbol: 'GRN', qty: 9_500, productionRate: 5 },
      { symbol: 'STL', qty: 1_600, productionRate: 2 },
    ],
  },
  {
    name: 'Japan',
    isoCode: 'JPN',
    flag: '🇯🇵',
    region: 'East Asia',
    lat: 35.7,
    lng: 139.7,
    botStrategy: 'opportunist',
    balance: 480_000,
    resources: [
      { symbol: 'ELC', qty: 2_400, productionRate: 3 },
      { symbol: 'STL', qty: 900, productionRate: 1 },
    ],
  },
  {
    name: 'India',
    isoCode: 'IND',
    flag: '🇮🇳',
    region: 'South Asia',
    lat: 28.6,
    lng: 77.2,
    botStrategy: 'opportunist',
    balance: 420_000,
    resources: [
      { symbol: 'GRN', qty: 10_500, productionRate: 4 },
      { symbol: 'ELC', qty: 1_800, productionRate: 2 },
    ],
  },
  {
    name: 'Australia',
    isoCode: 'AUS',
    flag: '🇦🇺',
    region: 'Oceania',
    lat: -35.3,
    lng: 149.1,
    botStrategy: 'undercutter',
    balance: 350_000,
    resources: [
      { symbol: 'GRN', qty: 5_200, productionRate: 3 },
      { symbol: 'REE', qty: 450, productionRate: 1 },
      { symbol: 'OIL', qty: 800, productionRate: 1 },
    ],
  },
];

export const SEED_COMMODITIES = [
  { name: 'Crude Oil', symbol: 'OIL', basePrice: 78, unit: 'bbl' },
  { name: 'Steel', symbol: 'STL', basePrice: 620, unit: 't' },
  { name: 'Grain', symbol: 'GRN', basePrice: 245, unit: 't' },
  { name: 'Electronics', symbol: 'ELC', basePrice: 1200, unit: 'unit' },
  { name: 'Rare Earths', symbol: 'REE', basePrice: 4500, unit: 'kg' },
];

export function seedWorld(ctx: ModuleCtx): void {
  const commodityIds = new Map<string, bigint>();
  for (const c of SEED_COMMODITIES) {
    const row = ctx.db.commodity.insert({
      id: 0n,
      name: c.name,
      symbol: c.symbol,
      basePrice: c.basePrice,
      unit: c.unit,
    });
    commodityIds.set(c.symbol, row.id);
    ctx.db.spotPrice.insert({
      id: 0n,
      commodityId: row.id,
      price: c.basePrice,
      updatedAt: ctx.timestamp,
    });
  }

  for (const bot of SEED_BOTS) {
    const countryRow = ctx.db.country.insert({
      id: 0n,
      name: bot.name,
      isoCode: bot.isoCode,
      flag: bot.flag,
      region: bot.region,
      lat: bot.lat,
      lng: bot.lng,
      isBot: true,
      botStrategy: bot.botStrategy,
      balance: bot.balance,
      gdpScore: 0,
      online: true,
    });

    for (const resource of bot.resources) {
      const commodityId = commodityIds.get(resource.symbol);
      if (!commodityId) continue;
      ctx.db.countryResource.insert({
        id: 0n,
        countryId: countryRow.id,
        commodityId,
        qty: resource.qty,
        productionRate: resource.productionRate,
      });
    }
  }

  recalculateAllGdp(ctx);

  let hasPriceTick = false;
  for (const _ of ctx.db.priceTickSchedule.iter()) hasPriceTick = true;
  if (!hasPriceTick) {
    ctx.db.priceTickSchedule.insert({
      scheduledId: 0n,
      scheduledAt: ScheduleAt.interval(5_000_000n),
    });
  }

  let hasBotTick = false;
  for (const _ of ctx.db.botTickSchedule.iter()) hasBotTick = true;
  if (!hasBotTick) {
    ctx.db.botTickSchedule.insert({
      scheduledId: 0n,
      scheduledAt: ScheduleAt.interval(10_000_000n),
    });
  }

  let hasEventTick = false;
  for (const _ of ctx.db.eventTickSchedule.iter()) hasEventTick = true;
  if (!hasEventTick) {
    ctx.db.eventTickSchedule.insert({
      scheduledId: 0n,
      scheduledAt: ScheduleAt.interval(60_000_000n), // every 60 seconds
    });
  }
}

export function clearWorld(ctx: ModuleCtx): void {
  for (const row of [...ctx.db.tradeOffer.iter()]) {
    ctx.db.tradeOffer.id.delete(row.id);
  }
  for (const row of [...ctx.db.tradeHistory.iter()]) {
    ctx.db.tradeHistory.id.delete(row.id);
  }
  for (const row of [...ctx.db.sanction.iter()]) {
    ctx.db.sanction.id.delete(row.id);
  }
  for (const row of [...ctx.db.alliance.iter()]) {
    ctx.db.alliance.id.delete(row.id);
  }
  for (const row of [...ctx.db.cyberAttack.iter()]) {
    ctx.db.cyberAttack.id.delete(row.id);
  }
  for (const row of [...ctx.db.worldEvent.iter()]) {
    ctx.db.worldEvent.id.delete(row.id);
  }
  for (const row of [...ctx.db.player.iter()]) {
    ctx.db.player.identity.delete(row.identity);
  }
  for (const row of [...ctx.db.countryResource.iter()]) {
    ctx.db.countryResource.id.delete(row.id);
  }
  for (const row of [...ctx.db.country.iter()]) {
    ctx.db.country.id.delete(row.id);
  }
  for (const row of [...ctx.db.spotPrice.iter()]) {
    ctx.db.spotPrice.id.delete(row.id);
  }
  for (const row of [...ctx.db.commodity.iter()]) {
    ctx.db.commodity.id.delete(row.id);
  }
}
