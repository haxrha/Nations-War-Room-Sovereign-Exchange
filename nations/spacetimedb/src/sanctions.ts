import { SenderError, t } from 'spacetimedb/server';
import { spacetimedb } from './schema';
import { findCountryByIdentity, requireCountryByIdentity } from './lib/helpers';
import { findActiveSanction } from './lib/sanctions';

export const impose_sanction = spacetimedb.reducer(
  {
    targetCountryId: t.u64(),
    commodityId: t.u64(),
    reason: t.string(),
  },
  (ctx, { targetCountryId, commodityId, reason }) => {
    const issuer = requireCountryByIdentity(ctx, ctx.sender);
    if (issuer.isBot) throw new SenderError('Bots cannot impose sanctions');

    const target = ctx.db.country.id.find(targetCountryId);
    if (!target) throw new SenderError('Target country not found');
    if (target.id === issuer.id) throw new SenderError('Cannot sanction yourself');

    if (commodityId !== 0n && !ctx.db.commodity.id.find(commodityId)) {
      throw new SenderError('Unknown commodity');
    }

    const trimmed = reason.trim();
    if (!trimmed) throw new SenderError('Sanction reason required');

    const existing = findActiveSanction(ctx, issuer.id, targetCountryId, commodityId);
    if (existing) throw new SenderError('Active sanction already exists');

    ctx.db.sanction.insert({
      id: 0n,
      issuerCountryId: issuer.id,
      targetCountryId,
      commodityId,
      reason: trimmed,
      active: true,
      createdAt: ctx.timestamp,
    });

    console.info(`${issuer.name} sanctioned ${target.name} (${trimmed})`);
  },
);

export const lift_sanction = spacetimedb.reducer(
  { sanctionId: t.u64() },
  (ctx, { sanctionId }) => {
    const issuer = requireCountryByIdentity(ctx, ctx.sender);
    const row = ctx.db.sanction.id.find(sanctionId);

    if (!row || !row.active) throw new SenderError('Sanction not found');
    if (row.issuerCountryId !== issuer.id) {
      throw new SenderError('Only the issuing nation can lift this sanction');
    }

    ctx.db.sanction.id.update({ ...row, active: false });
  },
);
