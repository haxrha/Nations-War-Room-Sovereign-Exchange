import type { ModuleCtx } from '../schema';

/** Move global spot price toward the trade execution price (visible immediately in clients). */
export function applyTradePriceImpact(
  ctx: ModuleCtx,
  commodityId: bigint,
  tradePrice: number,
  qty: number,
): void {
  const spot = ctx.db.spotPrice.commodityId.find(commodityId);
  if (!spot) return;

  const comm = ctx.db.commodity.id.find(commodityId);
  const anchor = comm?.basePrice ?? spot.price;

  const volumeWeight = Math.min(1, qty / 150);
  const blend = 0.08 + volumeWeight * 0.22;

  let newPrice = spot.price * (1 - blend) + tradePrice * blend;

  if (tradePrice > spot.price * 1.005) {
    newPrice *= 1 + 0.015 * volumeWeight;
  } else if (tradePrice < spot.price * 0.995) {
    newPrice *= 1 - 0.015 * volumeWeight;
  }

  newPrice = Math.max(anchor * 0.2, Math.min(anchor * 5, newPrice));

  ctx.db.spotPrice.id.update({
    ...spot,
    price: newPrice,
    updatedAt: ctx.timestamp,
  });
}
