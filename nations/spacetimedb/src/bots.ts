import type { CountryRow, ModuleCtx } from './schema';
import { tradeOffer } from './schema';
import type { Infer } from 'spacetimedb';

type OfferRow = Infer<typeof tradeOffer.rowType>;
import {
  getSpotPrice,
  openOffersForCommodity,
  findResource,
} from './lib/helpers';
import { executeTrade } from './lib/trade';

/** Max total $ value per listing — sized for human treasuries (~$10k–100k). */
export const MAX_LISTING_VALUE = 8_000;

export function listingQty(
  resourceQty: number,
  pricePerUnit: number,
  pct: number,
  unitCap: number,
): number {
  if (pricePerUnit <= 0 || resourceQty <= 0) return 0;
  let qty = Math.min(resourceQty * pct, unitCap);
  qty = Math.min(qty, MAX_LISTING_VALUE / pricePerUnit);
  return Math.floor(qty);
}

function cancelOversizedBotOffer(ctx: ModuleCtx, offer: OfferRow) {
  const total = offer.qty * offer.pricePerUnit;
  if (total <= MAX_LISTING_VALUE) return;

  const resource = findResource(ctx, offer.sellerId, offer.commodityId);
  if (resource) {
    ctx.db.countryResource.id.update({ ...resource, qty: resource.qty + offer.qty });
  } else {
    ctx.db.countryResource.insert({
      id: 0n,
      countryId: offer.sellerId,
      commodityId: offer.commodityId,
      qty: offer.qty,
      productionRate: 0,
    });
  }
  ctx.db.tradeOffer.id.update({ ...offer, status: 'cancelled' });
}

export function cancelOversizedBotOffers(ctx: ModuleCtx) {
  for (const offer of ctx.db.tradeOffer.status.filter('open')) {
    const seller = ctx.db.country.id.find(offer.sellerId);
    if (seller?.isBot) cancelOversizedBotOffer(ctx, offer);
  }
}

function botOpenOffers(ctx: ModuleCtx, botId: bigint, commodityId: bigint) {
  return openOffersForCommodity(ctx, commodityId).filter(
    (o) => o.sellerId === botId && o.status === 'open',
  );
}

function botCreateSellOffer(
  ctx: ModuleCtx,
  bot: CountryRow,
  commodityId: bigint,
  qty: number,
  pricePerUnit: number,
) {
  if (botOpenOffers(ctx, bot.id, commodityId).length >= 2) return;

  const resource = findResource(ctx, bot.id, commodityId);
  if (!resource || resource.qty < qty) return;

  ctx.db.countryResource.id.update({ ...resource, qty: resource.qty - qty });
  ctx.db.tradeOffer.insert({
    id: 0n,
    sellerId: bot.id,
    commodityId,
    qty,
    pricePerUnit,
    status: 'open',
    createdAt: ctx.timestamp,
  });
}

function cheapestOpenOffer(
  ctx: ModuleCtx,
  commodityId: bigint,
  excludeSellerId: bigint,
) {
  const offers = openOffersForCommodity(ctx, commodityId)
    .filter((o) => o.sellerId !== excludeSellerId)
    .sort((a, b) => a.pricePerUnit - b.pricePerUnit);
  return offers[0];
}

export function runHoarder(ctx: ModuleCtx, bot: CountryRow) {
  for (const resource of ctx.db.countryResource.countryId.filter(bot.id)) {
    if (resource.qty < 1000) continue;
    const spot = getSpotPrice(ctx, resource.commodityId);
    const askPrice = spot * 0.88;
    const qty = listingQty(resource.qty, askPrice, 0.05, 500);
    if (qty < 1) continue;
    botCreateSellOffer(ctx, bot, resource.commodityId, qty, askPrice);
  }
}

export function runUndercutter(ctx: ModuleCtx, bot: CountryRow) {
  for (const resource of ctx.db.countryResource.countryId.filter(bot.id)) {
    if (resource.qty < 1000) continue;
    const cheapest = cheapestOpenOffer(ctx, resource.commodityId, bot.id);
    const spot = getSpotPrice(ctx, resource.commodityId);
    const askPrice = cheapest ? cheapest.pricePerUnit * 0.97 : spot * 0.95;
    const qty = listingQty(resource.qty, askPrice, 0.03, 400);
    if (qty < 1) continue;
    botCreateSellOffer(ctx, bot, resource.commodityId, qty, askPrice);
  }
}

export function runProtectionist(ctx: ModuleCtx, bot: CountryRow) {
  for (const resource of ctx.db.countryResource.countryId.filter(bot.id)) {
    if (resource.qty < 1000) continue;
    const spot = getSpotPrice(ctx, resource.commodityId);
    const askPrice = spot * 1.06;
    const qty = listingQty(resource.qty, askPrice, 0.02, 300);
    if (qty < 1) continue;
    botCreateSellOffer(ctx, bot, resource.commodityId, qty, askPrice);
  }
}

export function runOpportunist(ctx: ModuleCtx, bot: CountryRow) {
  for (const offer of ctx.db.tradeOffer.status.filter('open')) {
    if (offer.sellerId === bot.id) continue;

    const spot = getSpotPrice(ctx, offer.commodityId);
    const fair = offer.pricePerUnit <= spot * 1.02;
    const total = offer.qty * offer.pricePerUnit;

    if (fair && bot.balance >= total) {
      try {
        executeTrade(ctx, offer.id, bot.id);
      } catch {
        // insufficient balance or race — skip
      }
      return;
    }
  }

  for (const resource of ctx.db.countryResource.countryId.filter(bot.id)) {
    if (resource.qty < 5000) continue;
    const spot = getSpotPrice(ctx, resource.commodityId);
    const askPrice = spot * 0.99;
    const qty = listingQty(resource.qty, askPrice, 0.02, 350);
    if (qty < 1) continue;
    botCreateSellOffer(ctx, bot, resource.commodityId, qty, askPrice);
  }
}

export function runBotStrategy(ctx: ModuleCtx, bot: CountryRow) {
  switch (bot.botStrategy) {
    case 'hoarder':
      runHoarder(ctx, bot);
      break;
    case 'undercutter':
      runUndercutter(ctx, bot);
      break;
    case 'protectionist':
      runProtectionist(ctx, bot);
      break;
    case 'opportunist':
    default:
      runOpportunist(ctx, bot);
      break;
  }
}
