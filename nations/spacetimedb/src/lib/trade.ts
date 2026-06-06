import { SenderError } from 'spacetimedb/server';
import type { ModuleCtx } from '../schema';
import { findResource, recalculateGdp } from './helpers';
import { applyTradePriceImpact } from './pricing';
import { isSanctioned } from './sanctions';

export function executeTrade(
  ctx: ModuleCtx,
  offerId: bigint,
  buyerId: bigint,
): void {
  const offer = ctx.db.tradeOffer.id.find(offerId);
  if (!offer || offer.status !== 'open') {
    throw new SenderError('Offer not available');
  }

  const buyer = ctx.db.country.id.find(buyerId);
  if (!buyer) throw new SenderError('Buyer not found');

  const seller = ctx.db.country.id.find(offer.sellerId);
  if (!seller) throw new SenderError('Seller not found');

  if (buyer.id === seller.id) throw new SenderError('Cannot trade with yourself');

  if (isSanctioned(ctx, buyer.id, seller.id, offer.commodityId)) {
    throw new SenderError('Trade blocked by active sanctions');
  }

  const totalCost = offer.qty * offer.pricePerUnit;
  if (buyer.balance < totalCost) throw new SenderError('Insufficient funds');

  ctx.db.country.id.update({ ...buyer, balance: buyer.balance - totalCost });
  ctx.db.country.id.update({ ...seller, balance: seller.balance + totalCost });

  const buyerResource = findResource(ctx, buyer.id, offer.commodityId);
  if (buyerResource) {
    ctx.db.countryResource.id.update({
      ...buyerResource,
      qty: buyerResource.qty + offer.qty,
    });
  } else {
    ctx.db.countryResource.insert({
      id: 0n,
      countryId: buyer.id,
      commodityId: offer.commodityId,
      qty: offer.qty,
      productionRate: 0,
    });
  }

  ctx.db.tradeOffer.id.update({ ...offer, status: 'filled' });

  ctx.db.tradeHistory.insert({
    id: 0n,
    sellerId: seller.id,
    buyerId: buyer.id,
    commodityId: offer.commodityId,
    qty: offer.qty,
    price: offer.pricePerUnit,
    filledAt: ctx.timestamp,
  });

  applyTradePriceImpact(ctx, offer.commodityId, offer.pricePerUnit, offer.qty);

  recalculateGdp(ctx, buyer.id);
  recalculateGdp(ctx, seller.id);
}
