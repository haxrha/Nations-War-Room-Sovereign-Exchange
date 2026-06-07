import { SenderError, t } from 'spacetimedb/server';
import { spacetimedb } from './schema';
import { findResource, recalculateGdp, requireCountryByIdentity } from './lib/helpers';

const ATTACK_COST = 5_000;
const DETECTION_CHANCE = 35; // percent

export const launch_cyber_attack = spacetimedb.reducer(
  {
    targetId: t.u64(),
    attackType: t.string(),
    targetCommodityId: t.u64(),
  },
  (ctx, { targetId, attackType, targetCommodityId }) => {
    const validTypes = new Set(['infrastructure', 'disrupt_trade', 'leak_info', 'market_manipulation']);
    if (!validTypes.has(attackType)) throw new SenderError('Invalid attack type');

    const attacker = requireCountryByIdentity(ctx, ctx.sender);
    if (attacker.isBot) throw new SenderError('Bots cannot launch cyber attacks');

    const target = ctx.db.country.id.find(targetId);
    if (!target) throw new SenderError('Target not found');
    if (target.id === attacker.id) throw new SenderError('Cannot attack yourself');

    if (attacker.balance < ATTACK_COST) {
      throw new SenderError(`Insufficient funds — operation costs $${ATTACK_COST.toLocaleString()}`);
    }

    // Deduct cost whether detected or not
    ctx.db.country.id.update({ ...attacker, balance: attacker.balance - ATTACK_COST });

    const rng = Number(ctx.timestamp.microsSinceUnixEpoch % 100n);
    const detected = rng < DETECTION_CHANCE;

    if (detected) {
      // Attack fails; target auto-sanctions attacker
      const existingSanction = (() => {
        for (const s of ctx.db.sanction.byIssuerAndTarget.filter([target.id, attacker.id])) {
          if (s.active && s.commodityId === 0n) return s;
        }
        return undefined;
      })();

      if (!existingSanction) {
        ctx.db.sanction.insert({
          id: 0n,
          issuerCountryId: target.id,
          targetCountryId: attacker.id,
          commodityId: 0n,
          reason: `Cyber attack detected — operation: ${attackType}`,
          active: true,
          createdAt: ctx.timestamp,
        });
      }

      ctx.db.cyberAttack.insert({
        id: 0n,
        attackerId: attacker.id,
        targetId: target.id,
        attackType,
        status: 'detected',
        effectDescription: `Operation burned. ${target.name} has imposed retaliatory sanctions.`,
        executedAt: ctx.timestamp,
      });

      console.info(`[cyber] ${attacker.name} attacked ${target.name} (${attackType}) — DETECTED`);
      return;
    }

    // Attack succeeds
    let effectDescription = '';

    switch (attackType) {
      case 'infrastructure': {
        let affected = 0;
        for (const resource of ctx.db.countryResource.countryId.filter(target.id)) {
          if (resource.productionRate > 0) {
            ctx.db.countryResource.id.update({
              ...resource,
              productionRate: resource.productionRate * 0.65,
            });
            affected++;
          }
        }
        effectDescription = `Disrupted ${affected} production facilities — output reduced 35%.`;
        break;
      }

      case 'disrupt_trade': {
        let cancelled = 0;
        for (const offer of ctx.db.tradeOffer.bySeller.filter(target.id)) {
          if (offer.status !== 'open') continue;
          ctx.db.tradeOffer.id.update({ ...offer, status: 'cancelled' });
          const resource = findResource(ctx, target.id, offer.commodityId);
          if (resource) {
            ctx.db.countryResource.id.update({ ...resource, qty: resource.qty + offer.qty });
          } else {
            ctx.db.countryResource.insert({
              id: 0n,
              countryId: target.id,
              commodityId: offer.commodityId,
              qty: offer.qty,
              productionRate: 0,
            });
          }
          cancelled++;
        }
        effectDescription = cancelled > 0
          ? `Cancelled ${cancelled} active trade offer${cancelled > 1 ? 's' : ''} — market position compromised.`
          : 'Intrusion succeeded but target had no open offers to disrupt.';
        break;
      }

      case 'leak_info': {
        let resourceCount = 0;
        for (const _ of ctx.db.countryResource.countryId.filter(target.id)) resourceCount++;
        effectDescription = `Intelligence leaked: ${target.name} holds $${Math.round(target.balance).toLocaleString()} in treasury across ${resourceCount} commodity positions.`;
        break;
      }

      case 'market_manipulation': {
        const spot = ctx.db.spotPrice.commodityId.find(targetCommodityId);
        if (!spot) {
          effectDescription = 'Market manipulation failed — commodity not found.';
          break;
        }
        const comm = ctx.db.commodity.id.find(targetCommodityId);
        const anchor = comm?.basePrice ?? spot.price;
        // Alternate spike/crash based on timestamp parity
        const spike = (ctx.timestamp.microsSinceUnixEpoch % 2n) === 0n;
        const multiplier = spike ? 1.28 : 0.74;
        const rawNew = spot.price * multiplier;
        const clamped = Math.max(anchor * 0.15, Math.min(anchor * 6, rawNew));
        ctx.db.spotPrice.id.update({ ...spot, price: clamped, updatedAt: ctx.timestamp });
        const dir = spike ? '+28%' : '-26%';
        effectDescription = `${comm?.symbol ?? 'commodity'} price manipulated ${dir} — market in chaos.`;
        break;
      }
    }

    recalculateGdp(ctx, target.id);

    ctx.db.cyberAttack.insert({
      id: 0n,
      attackerId: attacker.id,
      targetId: target.id,
      attackType,
      status: 'success',
      effectDescription,
      executedAt: ctx.timestamp,
    });

    console.info(`[cyber] ${attacker.name} → ${target.name} (${attackType}) — SUCCESS: ${effectDescription}`);
  },
);
