import { SenderError, t } from 'spacetimedb/server';
import { spacetimedb } from './schema';
import { requireCountryByIdentity } from './lib/helpers';
import { findAllianceBetween } from './lib/alliances';

export const propose_alliance = spacetimedb.reducer(
  { partnerId: t.u64() },
  (ctx, { partnerId }) => {
    const proposer = requireCountryByIdentity(ctx, ctx.sender);
    if (proposer.isBot) throw new SenderError('Bots cannot propose alliances');

    const partner = ctx.db.country.id.find(partnerId);
    if (!partner) throw new SenderError('Partner country not found');
    if (partner.id === proposer.id) throw new SenderError('Cannot ally with yourself');

    const existing = findAllianceBetween(ctx, proposer.id, partnerId);
    if (existing) throw new SenderError('Alliance or pending proposal already exists');

    // Bot partners auto-accept
    const status = partner.isBot ? 'active' : 'pending';

    ctx.db.alliance.insert({
      id: 0n,
      proposerId: proposer.id,
      partnerId,
      status,
      createdAt: ctx.timestamp,
    });

    console.info(`${proposer.name} proposed alliance with ${partner.name} — status: ${status}`);
  },
);

export const accept_alliance = spacetimedb.reducer(
  { allianceId: t.u64() },
  (ctx, { allianceId }) => {
    const acceptor = requireCountryByIdentity(ctx, ctx.sender);

    const row = ctx.db.alliance.id.find(allianceId);
    if (!row || row.status !== 'pending') throw new SenderError('No pending alliance found');
    if (row.partnerId !== acceptor.id) throw new SenderError('This alliance proposal is not for you');

    ctx.db.alliance.id.update({ ...row, status: 'active' });

    const proposer = ctx.db.country.id.find(row.proposerId);
    console.info(`${acceptor.name} accepted alliance with ${proposer?.name ?? '?'}`);
  },
);

export const leave_alliance = spacetimedb.reducer(
  { allianceId: t.u64() },
  (ctx, { allianceId }) => {
    const actor = requireCountryByIdentity(ctx, ctx.sender);

    const row = ctx.db.alliance.id.find(allianceId);
    if (!row) throw new SenderError('Alliance not found');
    if (row.proposerId !== actor.id && row.partnerId !== actor.id) {
      throw new SenderError('You are not part of this alliance');
    }
    if (row.status === 'dissolved') throw new SenderError('Alliance already dissolved');

    ctx.db.alliance.id.update({ ...row, status: 'dissolved' });

    console.info(`${actor.name} dissolved alliance #${allianceId}`);
  },
);
