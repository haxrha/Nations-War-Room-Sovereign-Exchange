import { SenderError, t } from 'spacetimedb/server';
import { spacetimedb } from './schema';
import {
  findCountryByIdentity,
  findResource,
  recalculateGdp,
  requireCountryByIdentity,
} from './lib/helpers';
import { executeTrade } from './lib/trade';
import {
  HUMAN_START_BALANCE,
  HUMAN_STARTER_RESOURCES,
  pickPlayerSpawn,
} from './lib/spawn';

function countHumanCountries(ctx: Parameters<typeof findCountryByIdentity>[0]) {
  let n = 0;
  for (const c of ctx.db.country.iter()) {
    if (!c.isBot) n++;
  }
  return n;
}

export const place_offer = spacetimedb.reducer(
  {
    commodityId: t.u64(),
    qty: t.f64(),
    pricePerUnit: t.f64(),
  },
  (ctx, { commodityId, qty, pricePerUnit }) => {
    if (qty <= 0 || pricePerUnit <= 0) throw new SenderError('Invalid offer parameters');

    const seller = requireCountryByIdentity(ctx, ctx.sender);
    if (seller.isBot) throw new SenderError('Bots cannot call place_offer');

    const resource = findResource(ctx, seller.id, commodityId);
    if (!resource || resource.qty < qty) throw new SenderError('Insufficient stock');

    ctx.db.countryResource.id.update({
      ...resource,
      qty: resource.qty - qty,
    });

    ctx.db.tradeOffer.insert({
      id: 0n,
      sellerId: seller.id,
      commodityId,
      qty,
      pricePerUnit,
      status: 'open',
      createdAt: ctx.timestamp,
    });

    recalculateGdp(ctx, seller.id);
  },
);

export const accept_trade = spacetimedb.reducer(
  { offerId: t.u64() },
  (ctx, { offerId }) => {
    const buyer = requireCountryByIdentity(ctx, ctx.sender);
    if (buyer.isBot) throw new SenderError('Bots cannot call accept_trade');
    executeTrade(ctx, offerId, buyer.id);
  },
);

export const cancel_offer = spacetimedb.reducer(
  { offerId: t.u64() },
  (ctx, { offerId }) => {
    const country = requireCountryByIdentity(ctx, ctx.sender);
    const offer = ctx.db.tradeOffer.id.find(offerId);

    if (!offer || offer.status !== 'open') throw new SenderError('Offer not found');
    if (offer.sellerId !== country.id) throw new SenderError('Not your offer');

    const resource = findResource(ctx, country.id, offer.commodityId);
    if (resource) {
      ctx.db.countryResource.id.update({
        ...resource,
        qty: resource.qty + offer.qty,
      });
    } else {
      ctx.db.countryResource.insert({
        id: 0n,
        countryId: country.id,
        commodityId: offer.commodityId,
        qty: offer.qty,
        productionRate: 0,
      });
    }

    ctx.db.tradeOffer.id.update({ ...offer, status: 'cancelled' });
    recalculateGdp(ctx, country.id);
  },
);

export const set_country_profile = spacetimedb.reducer(
  { name: t.string(), isoCode: t.string() },
  (ctx, { name, isoCode }) => {
    if (!name.trim()) throw new SenderError('Name required');
    const country = requireCountryByIdentity(ctx, ctx.sender);
    if (country.isBot) throw new SenderError('Cannot rename bot countries');

    ctx.db.country.id.update({
      ...country,
      name: name.trim(),
      isoCode: isoCode.trim().toUpperCase() || '???',
    });
  },
);

export const on_connect = spacetimedb.clientConnected((ctx) => {
  const meta = ctx.db.meta.id.find(0);
  if (!meta?.initialized) {
    console.warn('Client connected before world init — call `init` reducer first');
    return;
  }

  const existing = findCountryByIdentity(ctx, ctx.sender);
  if (existing) {
    ctx.db.country.id.update({ ...existing, online: true });
    return;
  }

  const humanIndex = countHumanCountries(ctx);
  const spawn = pickPlayerSpawn(humanIndex);

  const countryRow = ctx.db.country.insert({
    id: 0n,
    name: 'New Player',
    isoCode: '???',
    flag: spawn.flag,
    region: spawn.region,
    lat: spawn.lat,
    lng: spawn.lng,
    isBot: false,
    botStrategy: '',
    balance: HUMAN_START_BALANCE,
    gdpScore: 0,
    online: true,
  });

  for (const starter of HUMAN_STARTER_RESOURCES) {
    for (const commodity of ctx.db.commodity.iter()) {
      if (commodity.symbol !== starter.symbol) continue;
      ctx.db.countryResource.insert({
        id: 0n,
        countryId: countryRow.id,
        commodityId: commodity.id,
        qty: starter.qty,
        productionRate: starter.productionRate,
      });
      break;
    }
  }

  recalculateGdp(ctx, countryRow.id);

  ctx.db.player.insert({
    identity: ctx.sender,
    countryId: countryRow.id,
  });

  console.info(`New player country created for ${ctx.sender}`);
});

export const on_disconnect = spacetimedb.clientDisconnected((ctx) => {
  const existing = findCountryByIdentity(ctx, ctx.sender);
  if (existing) {
    ctx.db.country.id.update({ ...existing, online: false });
  }
});
