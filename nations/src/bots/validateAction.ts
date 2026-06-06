import type { BotAction, BotGameState } from './types'

export function validateBotAction(
  action: unknown,
  state: BotGameState,
): { valid: true; action: BotAction } | { valid: false; error: string } {
  if (action == null) return { valid: true, action: null! } as never
  if (typeof action !== 'object' || action === null || !('action' in action)) {
    return { valid: false, error: 'Action must be an object with an action field' }
  }

  const a = action as Record<string, unknown>

  if (a.action === 'accept') {
    const offerId = String(a.offerId ?? '')
    const offer = state.openOffers.find((o) => o.id === offerId && !o.isMine)
    if (!offer) return { valid: false, error: `Invalid accept offerId: ${offerId}` }
    if (offer.totalCost > state.myCountry.balance) {
      return { valid: false, error: 'Insufficient balance for accept' }
    }
    return { valid: true, action: { action: 'accept', offerId } }
  }

  if (a.action === 'cancel') {
    const offerId = String(a.offerId ?? '')
    const offer = state.openOffers.find((o) => o.id === offerId && o.isMine)
    if (!offer) return { valid: false, error: `Invalid cancel offerId: ${offerId}` }
    return { valid: true, action: { action: 'cancel', offerId } }
  }

  if (a.action === 'offer') {
    const commodityId = String(a.commodityId ?? '')
    const qty = Number(a.qty)
    const pricePerUnit = Number(a.pricePerUnit)
    const comm = state.commodities.find((c) => c.id === commodityId)
    if (!comm) return { valid: false, error: `Unknown commodityId: ${commodityId}` }
    if (!Number.isFinite(qty) || qty <= 0) return { valid: false, error: 'qty must be > 0' }
    if (!Number.isFinite(pricePerUnit) || pricePerUnit <= 0) {
      return { valid: false, error: 'pricePerUnit must be > 0' }
    }
    const stock = state.myCountry.resources[comm.symbol] ?? 0
    if (stock < qty) return { valid: false, error: `Insufficient ${comm.symbol} stock` }
    return {
      valid: true,
      action: { action: 'offer', commodityId, qty, pricePerUnit },
    }
  }

  return { valid: false, error: `Unknown action: ${String(a.action)}` }
}
