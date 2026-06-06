import type { ModuleCtx } from '../schema';

export function findCountryByIdentity(
  ctx: ModuleCtx,
  identity: ModuleCtx['sender'],
) {
  const link = ctx.db.player.identity.find(identity);
  if (!link) return undefined;
  return ctx.db.country.id.find(link.countryId) ?? undefined;
}

export function requireCountryByIdentity(
  ctx: ModuleCtx,
  identity: ModuleCtx['sender'],
) {
  const c = findCountryByIdentity(ctx, identity);
  if (!c) throw new Error('Country not registered for this identity');
  return c;
}

export function findResource(
  ctx: ModuleCtx,
  countryId: bigint,
  commodityId: bigint,
) {
  for (const row of ctx.db.countryResource.byCountryAndCommodity.filter([
    countryId,
    commodityId,
  ])) {
    return row;
  }
  return undefined;
}

export function getSpotPrice(ctx: ModuleCtx, commodityId: bigint): number {
  const spot = ctx.db.spotPrice.commodityId.find(commodityId);
  if (spot) return spot.price;
  const comm = ctx.db.commodity.id.find(commodityId);
  return comm?.basePrice ?? 0;
}

export function recalculateGdp(ctx: ModuleCtx, countryId: bigint) {
  const c = ctx.db.country.id.find(countryId);
  if (!c) return;

  let resourceValue = 0;
  for (const resource of ctx.db.countryResource.countryId.filter(countryId)) {
    resourceValue += resource.qty * getSpotPrice(ctx, resource.commodityId);
  }

  ctx.db.country.id.update({
    ...c,
    gdpScore: c.balance + resourceValue,
  });
}

export function recalculateAllGdp(ctx: ModuleCtx) {
  for (const c of ctx.db.country.iter()) {
    recalculateGdp(ctx, c.id);
  }
}

export function openOffersForCommodity(ctx: ModuleCtx, commodityId: bigint) {
  const offers = [];
  for (const offer of ctx.db.tradeOffer.byCommodityAndStatus.filter([
    commodityId,
    'open',
  ])) {
    offers.push(offer);
  }
  return offers;
}

export function recentFillsForCommodity(
  ctx: ModuleCtx,
  commodityId: bigint,
  sinceMicros: bigint,
) {
  let count = 0;
  for (const fill of ctx.db.tradeHistory.byCommodity.filter(commodityId)) {
    if (fill.filledAt.microsSinceUnixEpoch >= sinceMicros) count++;
  }
  return count;
}
