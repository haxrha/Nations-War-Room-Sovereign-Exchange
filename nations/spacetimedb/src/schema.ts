import {
  schema,
  table,
  t,
  type ReducerCtx,
} from 'spacetimedb/server';
import type { Infer } from 'spacetimedb';

export const meta = table(
  { name: 'meta' },
  {
    id: t.u8().primaryKey(),
    initialized: t.bool(),
  },
);

export const player = table(
  { name: 'player', public: true },
  {
    identity: t.identity().primaryKey(),
    countryId: t.u64().unique(),
  },
);

export const country = table(
  { name: 'country', public: true },
  {
    id: t.u64().primaryKey().autoInc(),
    name: t.string(),
    isoCode: t.string(),
    flag: t.string(),
    region: t.string(),
    lat: t.f64(),
    lng: t.f64(),
    isBot: t.bool().index('btree'),
    botStrategy: t.string(),
    balance: t.f64(),
    gdpScore: t.f64(),
    online: t.bool(),
  },
);

export const commodity = table(
  { name: 'commodity', public: true },
  {
    id: t.u64().primaryKey().autoInc(),
    name: t.string(),
    symbol: t.string(),
    basePrice: t.f64(),
    unit: t.string(),
  },
);

export const spotPrice = table(
  { name: 'spot_price', public: true },
  {
    id: t.u64().primaryKey().autoInc(),
    commodityId: t.u64().unique(),
    price: t.f64(),
    updatedAt: t.timestamp(),
  },
);

export const countryResource = table(
  {
    name: 'country_resource',
    public: true,
    indexes: [
      {
        accessor: 'byCountryAndCommodity',
        algorithm: 'btree',
        columns: ['countryId', 'commodityId'],
      },
    ],
  },
  {
    id: t.u64().primaryKey().autoInc(),
    countryId: t.u64().index('btree'),
    commodityId: t.u64().index('btree'),
    qty: t.f64(),
    productionRate: t.f64(),
  },
);

export const tradeOffer = table(
  {
    name: 'trade_offer',
    public: true,
    indexes: [
      {
        accessor: 'byCommodityAndStatus',
        algorithm: 'btree',
        columns: ['commodityId', 'status'],
      },
      { accessor: 'bySeller', algorithm: 'btree', columns: ['sellerId'] },
    ],
  },
  {
    id: t.u64().primaryKey().autoInc(),
    sellerId: t.u64(),
    commodityId: t.u64(),
    qty: t.f64(),
    pricePerUnit: t.f64(),
    status: t.string().index('btree'),
    createdAt: t.timestamp(),
  },
);

export const tradeHistory = table(
  {
    name: 'trade_history',
    public: true,
    indexes: [
      { accessor: 'byCommodity', algorithm: 'btree', columns: ['commodityId'] },
    ],
  },
  {
    id: t.u64().primaryKey().autoInc(),
    sellerId: t.u64(),
    buyerId: t.u64(),
    commodityId: t.u64(),
    qty: t.f64(),
    price: t.f64(),
    filledAt: t.timestamp(),
  },
);

/** commodityId 0 = all commodities embargoed */
export const sanction = table(
  {
    name: 'sanction',
    public: true,
    indexes: [
      { accessor: 'byTarget', algorithm: 'btree', columns: ['targetCountryId'] },
      {
        accessor: 'byIssuerAndTarget',
        algorithm: 'btree',
        columns: ['issuerCountryId', 'targetCountryId'],
      },
    ],
  },
  {
    id: t.u64().primaryKey().autoInc(),
    issuerCountryId: t.u64().index('btree'),
    targetCountryId: t.u64(),
    commodityId: t.u64(),
    reason: t.string(),
    active: t.bool().index('btree'),
    createdAt: t.timestamp(),
  },
);

/** Forward refs resolved after reducer exports are created. */
const scheduleReducers: Record<'price_tick' | 'bot_tick', object | null> = {
  price_tick: null,
  bot_tick: null,
};

export const priceTickSchedule = table(
  {
    name: 'price_tick_schedule',
    scheduled: () => scheduleReducers.price_tick! as NonNullable<ReturnType<NonNullable<Parameters<typeof table>[0]['scheduled']>>>,
  },
  {
    scheduledId: t.u64().primaryKey().autoInc(),
    scheduledAt: t.scheduleAt(),
  },
);

export const botTickSchedule = table(
  {
    name: 'bot_tick_schedule',
    scheduled: () => scheduleReducers.bot_tick! as NonNullable<ReturnType<NonNullable<Parameters<typeof table>[0]['scheduled']>>>,
  },
  {
    scheduledId: t.u64().primaryKey().autoInc(),
    scheduledAt: t.scheduleAt(),
  },
);

export const spacetimedb = schema({
  meta,
  player,
  country,
  commodity,
  spotPrice,
  countryResource,
  tradeOffer,
  tradeHistory,
  sanction,
  priceTickSchedule,
  botTickSchedule,
});

export type ModuleCtx = ReducerCtx<typeof spacetimedb.schemaType>;
export type CountryRow = Infer<typeof country.rowType>;

import { runPriceTick, runBotTick } from './lib/tick-handlers';

export const price_tick = spacetimedb.reducer(
  { arg: priceTickSchedule.rowType },
  (ctx, { arg: _arg }) => {
    runPriceTick(ctx);
  },
);
scheduleReducers.price_tick = price_tick;

export const bot_tick = spacetimedb.reducer(
  { arg: botTickSchedule.rowType },
  (ctx, { arg: _arg }) => {
    runBotTick(ctx);
  },
);
scheduleReducers.bot_tick = bot_tick;

export default spacetimedb;
