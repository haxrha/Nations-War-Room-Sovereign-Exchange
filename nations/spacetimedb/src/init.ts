import { ScheduleAt } from 'spacetimedb';
import { SenderError } from 'spacetimedb/server';
import { spacetimedb } from './schema';
import { recalculateAllGdp } from './lib/helpers';

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

const SEED_BOTS: SeedBot[] = [
  {
    name: 'Saudi Arabia',
    isoCode: 'SAU',
    flag: '🇸🇦',
    region: 'Middle East',
    lat: 24.7,
    lng: 46.7,
    botStrategy: 'hoarder',
    balance: 1_600_000_000,
    resources: [{ symbol: 'OIL', qty: 55_000_000, productionRate: 500 }],
  },
  {
    name: 'China',
    isoCode: 'CHN',
    flag: '🇨🇳',
    region: 'East Asia',
    lat: 39.9,
    lng: 116.4,
    botStrategy: 'undercutter',
    balance: 2_100_000_000,
    resources: [
      { symbol: 'ELC', qty: 22_000_000, productionRate: 400 },
      { symbol: 'STL', qty: 35_000_000, productionRate: 350 },
      { symbol: 'REE', qty: 180_000, productionRate: 50 },
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
    balance: 1_800_000_000,
    resources: [
      { symbol: 'STL', qty: 18_000_000, productionRate: 200 },
      { symbol: 'ELC', qty: 6_000_000, productionRate: 150 },
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
    balance: 900_000_000,
    resources: [
      { symbol: 'GRN', qty: 28_000_000, productionRate: 300 },
      { symbol: 'STL', qty: 5_000_000, productionRate: 80 },
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
    balance: 1_400_000_000,
    resources: [
      { symbol: 'ELC', qty: 9_000_000, productionRate: 120 },
      { symbol: 'STL', qty: 2_000_000, productionRate: 40 },
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
    balance: 1_100_000_000,
    resources: [
      { symbol: 'GRN', qty: 32_000_000, productionRate: 280 },
      { symbol: 'ELC', qty: 4_000_000, productionRate: 90 },
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
    balance: 850_000_000,
    resources: [
      { symbol: 'GRN', qty: 15_000_000, productionRate: 150 },
      { symbol: 'REE', qty: 95_000, productionRate: 30 },
      { symbol: 'OIL', qty: 3_000_000, productionRate: 60 },
    ],
  },
];

const SEED_COMMODITIES = [
  { name: 'Crude Oil', symbol: 'OIL', basePrice: 78, unit: 'bbl' },
  { name: 'Steel', symbol: 'STL', basePrice: 620, unit: 't' },
  { name: 'Grain', symbol: 'GRN', basePrice: 245, unit: 't' },
  { name: 'Electronics', symbol: 'ELC', basePrice: 1200, unit: 'unit' },
  { name: 'Rare Earths', symbol: 'REE', basePrice: 4500, unit: 'kg' },
];

export const init = spacetimedb.reducer({}, (ctx) => {
  const existing = ctx.db.meta.id.find(0);
  if (existing?.initialized) {
    throw new SenderError('World already initialized');
  }

  if (existing) {
    ctx.db.meta.id.update({ id: 0, initialized: true });
  } else {
    ctx.db.meta.insert({ id: 0, initialized: true });
  }

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

  ctx.db.priceTickSchedule.insert({
    scheduledId: 0n,
    scheduledAt: ScheduleAt.interval(5_000_000n),
  });

  ctx.db.botTickSchedule.insert({
    scheduledId: 0n,
    scheduledAt: ScheduleAt.interval(10_000_000n),
  });

  console.info('Nations world initialized — commodities, bots, and schedulers ready');
});

export const reset_meta = spacetimedb.reducer({}, (ctx) => {
  const row = ctx.db.meta.id.find(0);
  if (row) ctx.db.meta.id.update({ ...row, initialized: false });
});
