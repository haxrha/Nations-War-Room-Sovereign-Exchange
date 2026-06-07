import type { ModuleCtx } from '../schema';
import {
  openOffersForCommodity,
  recentFillsForCommodity,
  recalculateAllGdp,
} from './helpers';
import { cancelOversizedBotOffers, runBotStrategy } from '../bots';
export { runEventTick } from './events';

export function runPriceTick(ctx: ModuleCtx): void {
  const thirtySecondsAgo = ctx.timestamp.microsSinceUnixEpoch - 30_000_000n;

  for (const spot of ctx.db.spotPrice.iter()) {
    const openOffers = openOffersForCommodity(ctx, spot.commodityId);
    const recentFills = recentFillsForCommodity(
      ctx,
      spot.commodityId,
      thirtySecondsAgo,
    );

    const supplyPressure = openOffers.length * 0.005;
    const demandPressure = recentFills * 0.008;
    const drift = demandPressure - supplyPressure;

    const newPrice = Math.max(1, spot.price * (1 + drift));
    ctx.db.spotPrice.id.update({
      ...spot,
      price: newPrice,
      updatedAt: ctx.timestamp,
    });
  }

  recalculateAllGdp(ctx);
}

export function runBotTick(ctx: ModuleCtx): void {
  cancelOversizedBotOffers(ctx);

  for (const bot of ctx.db.country.isBot.filter(true)) {
    for (const resource of ctx.db.countryResource.countryId.filter(bot.id)) {
      ctx.db.countryResource.id.update({
        ...resource,
        qty: resource.qty + resource.productionRate,
      });
    }

    const refreshed = ctx.db.country.id.find(bot.id);
    if (refreshed) runBotStrategy(ctx, refreshed);
  }

  recalculateAllGdp(ctx);
}
