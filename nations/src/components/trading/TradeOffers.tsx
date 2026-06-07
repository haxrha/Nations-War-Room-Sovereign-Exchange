import { useState } from 'react'
import { Handshake, X } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import {
  formatPrice,
  formatQty,
  formatTimeAgo,
  formatMoney,
  getCommodity,
  getCountry,
  commodityAccent,
  idStr,
  isTradeSanctioned,
} from '../../lib/utils'
import { buildTradeExplainRequest } from '../../lib/buildTradeExplainContext'
import type { ExplainTradeRequest } from '../../lib/trade-explain-types'
import { Panel, Badge } from '../ui/Panel'
import { Button } from '../ui/Button'
import { cn } from '../../lib/cn'

export function TradeOffers({
  className,
  onTradeAccepted,
}: {
  className?: string
  onTradeAccepted?: (payload: ExplainTradeRequest) => void
}) {
  const { offers, playerCountryId, now } = useGame()
  const myOffers = playerCountryId != null
    ? offers.filter((o) => o.sellerId === playerCountryId)
    : []
  const marketOffers = (playerCountryId != null
    ? offers.filter((o) => o.sellerId !== playerCountryId)
    : offers
  ).slice().sort((a, b) => a.qty * a.pricePerUnit - b.qty * b.pricePerUnit)

  return (
    <Panel
      title="Trade Offers"
      subtitle={`${offers.length} open listings`}
      label="Order book"
      spotlight
      className={cn('h-full min-h-0', className)}
    >
      <div className="scroll-subtle min-h-0 flex-1 overflow-y-auto p-3">
        {marketOffers.length === 0 && myOffers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-8 text-center">
            <p className="text-sm text-[#8A8F98]">No open offers — post one or wait for bots</p>
          </div>
        ) : (
          <>
            {marketOffers.length > 0 && (
              <div className="mb-4">
                <div className="mb-2 font-mono-label text-[10px] uppercase tracking-widest text-[#8A8F98]">
                  Global market
                </div>
                {marketOffers.map((offer) => (
                  <OfferRow
                    key={idStr(offer.id)}
                    offer={offer}
                    isOwn={false}
                    now={now}
                    onTradeAccepted={onTradeAccepted}
                  />
                ))}
              </div>
            )}
            {myOffers.length > 0 && (
              <div>
                <div className="mb-2 font-mono-label text-[10px] uppercase tracking-widest text-[#8A8F98]">
                  Your listings
                </div>
                {myOffers.map((offer) => (
                  <OfferRow key={idStr(offer.id)} offer={offer} isOwn now={now} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Panel>
  )
}

function OfferRow({
  offer,
  isOwn,
  now,
  onTradeAccepted,
}: {
  offer: ReturnType<typeof useGame>['offers'][number]
  isOwn: boolean
  now: number
  onTradeAccepted?: (payload: ExplainTradeRequest) => void
}) {
  const game = useGame()
  const {
    countries,
    commodities,
    playerCountry,
    playerCountryId,
    acceptOffer,
    cancelOffer,
    activeSanctions,
  } = game
  const [accepting, setAccepting] = useState(false)
  const seller = getCountry(offer.sellerId, countries)
  const commodity = getCommodity(offer.commodityId, commodities)
  const accent = commodityAccent(commodity)
  const total = offer.qty * offer.pricePerUnit
  const sanctioned =
    playerCountryId != null &&
    isTradeSanctioned(activeSanctions, playerCountryId, offer.sellerId, offer.commodityId)
  const canAccept =
    !isOwn &&
    !sanctioned &&
    playerCountry != null &&
    playerCountry.balance >= total

  const handleAccept = async () => {
    if (!canAccept || playerCountryId == null) return
    const payload = buildTradeExplainRequest(offer, game)
    setAccepting(true)
    try {
      await acceptOffer(offer.id)
      if (payload && onTradeAccepted) onTradeAccepted(payload)
    } catch {
      /* error surfaced via GameContext */
    } finally {
      setAccepting(false)
    }
  }

  return (
    <div
      className="mb-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/10"
      style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="accent">sell</Badge>
            <span className="text-sm font-semibold" style={{ color: accent }}>
              {commodity?.symbol}
            </span>
          </div>
          <div className="mt-1 text-sm text-[#8A8F98]">
            {seller?.flag} {seller?.name}
            {seller?.isBot && (
              <span className="ml-1 text-[10px] text-[#5E6AD2]">bot</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-base font-semibold">{formatPrice(offer.pricePerUnit)}/u</div>
          <div className="text-[10px] text-[#8A8F98]">
            {formatQty(offer.qty)} · total {formatMoney(total)}
          </div>
          <div className="text-[10px] text-[#8A8F98]">
            {formatTimeAgo(offer.createdAt.microsSinceUnixEpoch, now)}
          </div>
        </div>
      </div>
      {!isOwn && playerCountry && (
        <div className="mb-2 text-[10px] text-[#8A8F98]">
          {sanctioned ? (
            <span className="text-red-400">Trade blocked by sanctions</span>
          ) : (
            <>
              Treasury {formatMoney(playerCountry.balance)} ·{' '}
              {canAccept ? (
                <span className="text-emerald-400">affordable</span>
              ) : (
                <span className="text-red-400">need {formatMoney(total - playerCountry.balance)} more</span>
              )}
            </>
          )}
        </div>
      )}
      <div className="mt-3">
        {isOwn ? (
          <Button variant="danger" size="sm" className="w-full" onClick={() => cancelOffer(offer.id)}>
            <X className="h-3 w-3" /> Cancel
          </Button>
        ) : (
          <Button
            variant={canAccept ? 'primary' : 'secondary'}
            size="sm"
            className="w-full"
            onClick={() => void handleAccept()}
            disabled={!canAccept || playerCountryId == null || accepting}
          >
            <Handshake className="h-3 w-3" />
            {accepting
              ? 'Processing…'
              : canAccept
                ? `Accept · ${formatPrice(total)}`
                : sanctioned
                  ? 'Sanctioned'
                  : 'Insufficient funds'}
          </Button>
        )}
      </div>
    </div>
  )
}

export function RecentTrades({ className, limit = 8 }: { className?: string; limit?: number }) {
  const { tradeHistory, countries, commodities, now } = useGame()

  return (
    <Panel title="Recent Trades" subtitle="Fill feed" label="Activity" spotlight className={cn('h-full min-h-0', className)}>
      <div className="scroll-subtle min-h-0 flex-1 overflow-y-auto p-3">
        {tradeHistory.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#8A8F98]">No trades yet</div>
        ) : (
          tradeHistory.slice(0, limit).map((trade) => {
            const seller = getCountry(trade.sellerId, countries)
            const buyer = getCountry(trade.buyerId, countries)
            const commodity = getCommodity(trade.commodityId, commodities)
            return (
              <div
                key={idStr(trade.id)}
                className="mb-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5"
              >
                <div className="flex justify-between">
                  <span className="text-xs font-semibold" style={{ color: commodityAccent(commodity) }}>
                    {commodity?.symbol}
                  </span>
                  <span className="text-[10px] text-[#8A8F98]">
                    {formatTimeAgo(trade.filledAt.microsSinceUnixEpoch, now)}
                  </span>
                </div>
                <div className="text-[10px] text-[#8A8F98]">
                  {seller?.flag} → {buyer?.flag} · {formatQty(trade.qty)}
                </div>
                <div className="text-xs font-medium text-emerald-400">
                  {formatPrice(trade.price)}/unit
                </div>
              </div>
            )
          })
        )}
      </div>
    </Panel>
  )
}
