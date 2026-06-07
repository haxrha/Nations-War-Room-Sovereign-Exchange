import type { ModuleCtx } from '../schema';

export function isAllied(ctx: ModuleCtx, aId: bigint, bId: bigint): boolean {
  if (aId === bId) return false;

  for (const row of ctx.db.alliance.byProposerAndPartner.filter([aId, bId])) {
    if (row.status === 'active') return true;
  }
  for (const row of ctx.db.alliance.byProposerAndPartner.filter([bId, aId])) {
    if (row.status === 'active') return true;
  }
  return false;
}

export function findAllianceBetween(
  ctx: ModuleCtx,
  aId: bigint,
  bId: bigint,
) {
  for (const row of ctx.db.alliance.byProposerAndPartner.filter([aId, bId])) {
    if (row.status === 'active' || row.status === 'pending') return row;
  }
  for (const row of ctx.db.alliance.byProposerAndPartner.filter([bId, aId])) {
    if (row.status === 'active' || row.status === 'pending') return row;
  }
  return undefined;
}
