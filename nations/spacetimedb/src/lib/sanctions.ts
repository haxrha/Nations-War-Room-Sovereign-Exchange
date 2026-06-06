import type { ModuleCtx } from '../schema';

/** commodityId 0 = all commodities */
export function isSanctioned(
  ctx: ModuleCtx,
  partyA: bigint,
  partyB: bigint,
  commodityId: bigint,
): boolean {
  if (partyA === partyB) return false;

  for (const s of ctx.db.sanction.active.filter(true)) {
    if (!s.active) continue;
    const commOk = s.commodityId === 0n || s.commodityId === commodityId;
    if (!commOk) continue;

    const blocks =
      (s.issuerCountryId === partyA && s.targetCountryId === partyB) ||
      (s.issuerCountryId === partyB && s.targetCountryId === partyA);

    if (blocks) return true;
  }
  return false;
}

export function findActiveSanction(
  ctx: ModuleCtx,
  issuerId: bigint,
  targetId: bigint,
  commodityId: bigint,
) {
  for (const s of ctx.db.sanction.byIssuerAndTarget.filter([issuerId, targetId])) {
    if (!s.active) continue;
    if (s.commodityId === commodityId || s.commodityId === 0n || commodityId === 0n) {
      return s;
    }
  }
  return undefined;
}
