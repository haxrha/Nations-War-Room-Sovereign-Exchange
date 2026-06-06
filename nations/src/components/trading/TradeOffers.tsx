import { Handshake, X } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import {
  formatPrice,
  formatQty,
  formatTimeAgo,
  getCommodity,
  getCountry,
  commodityAccent,
  idStr,
} from '../../lib/utils'
import { Panel, Badge } from '../ui/Panel'
import { Button } from '../ui/Button'

export function TradeOffers() {
  const { offers, playerCountryId, now } = useGame()
  const myOffers = playerCountryId != null
    ? offers.filter((o) => o.sellerId === playerCountryId)
    : []
  const marketOffers = playerCountryId != null
    ? offers.filter((o) => o.sellerId !== playerCountryId)
    : offers

  return (
    <Panel
      title="Trade Offers"
      subtitle={`${offers.length} open listings`}
      label="Order book"
      spotlight
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
                  <OfferRow key={idStr(offer.id)} offer={offer} isOwn={false} now={now} />
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
}: {
  offer: ReturnType<typeof useGame>['offers'][number]
  isOwn: boolean
  now: number
}) {
  const { countries, commodities, playerCountry, playerCountryId, acceptOffer, cancelOffer } =
    useGame()
  const seller = getCountry(offer.sellerId, countries)
  const commodity = getCommodity(offer.commodityId, commodities)
  const accent = commodityAccent(commodity)
  const total = offer.qty * offer.pricePerUnit
  const canAccept =
    !isOwn &&
    playerCountry != null &&
    playerCountry.balance >= total

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
          <div className="text-base font-semibold">{formatPrice(offer.pricePerUnit)}</div>
          <div className="text-[10px] text-[#8A8F98]">
            {formatQty(offer.qty)} · {formatTimeAgo(offer.createdAt.microsSinceUnixEpoch, now)}
          </div>
        </div>
      </div>
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
            onClick={() => acceptOffer(offer.id)}
            disabled={!canAccept || playerCountryId == null}
          >
            <Handshake className="h-3 w-3" />
            {canAccept ? `Accept · ${formatPrice(total)}` : 'Insufficient funds'}
          </Button>
        )}
      </div>
    </div>
  )
}

export function RecentTrades() {
  const { tradeHistory, countries, commodities, now } = useGame()

  return (
    <Panel title="Recent Trades" subtitle="Fill feed" label="Activity" spotlight>
      <div className="scroll-subtle min-h-0 flex-1 overflow-y-auto p-3">
        {tradeHistory.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#8A8F98]">No trades yet</div>
        ) : (
          tradeHistory.slice(0, 8).map((trade) => {
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
