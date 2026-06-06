import type { CountryRow, ModuleCtx } from './schema';
import {
  getSpotPrice,
  openOffersForCommodity,
  findResource,
} from './lib/helpers';
import { executeTrade } from './lib/trade';

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
    const qty = Math.min(resource.qty * 0.05, 500_000);
    botCreateSellOffer(ctx, bot, resource.commodityId, qty, askPrice);
  }
}

export function runUndercutter(ctx: ModuleCtx, bot: CountryRow) {
  for (const resource of ctx.db.countryResource.countryId.filter(bot.id)) {
    if (resource.qty < 1000) continue;
    const cheapest = cheapestOpenOffer(ctx, resource.commodityId, bot.id);
    const spot = getSpotPrice(ctx, resource.commodityId);
    const askPrice = cheapest ? cheapest.pricePerUnit * 0.97 : spot * 0.95;
    const qty = Math.min(resource.qty * 0.03, 300_000);
    botCreateSellOffer(ctx, bot, resource.commodityId, qty, askPrice);
  }
}

export function runProtectionist(ctx: ModuleCtx, bot: CountryRow) {
  for (const resource of ctx.db.countryResource.countryId.filter(bot.id)) {
    if (resource.qty < 1000) continue;
    const spot = getSpotPrice(ctx, resource.commodityId);
    const askPrice = spot * 1.06;
    const qty = Math.min(resource.qty * 0.02, 100_000);
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
    const qty = Math.min(resource.qty * 0.02, 200_000);
    botCreateSellOffer(ctx, bot, resource.commodityId, qty, spot * 0.99);
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
