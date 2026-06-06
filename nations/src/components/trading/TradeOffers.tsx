import { Handshake, X } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { formatPrice, formatQty, formatTimeAgo, getCommodity, getCountry, getResource } from '../../lib/utils'
import { Panel, Badge } from '../ui/Panel'
import { Button } from '../ui/Button'
import { accentAt } from '../../lib/design-system'

export function TradeOffers() {
  const { state, acceptOffer, cancelOffer, now } = useGame()
  const playerId = state.playerCountryId
  const openOffers = state.offers.filter((o) => o.status === 'open').sort((a, b) => b.createdAt - a.createdAt)
  const myOffers = openOffers.filter((o) => o.fromCountryId === playerId)
  const marketOffers = openOffers.filter((o) => o.fromCountryId !== playerId)

  return (
    <Panel title="Trade Offers" subtitle={`${openOffers.length} open deals`} accentIndex={3} emoji="🤝">
      <div className="scroll-max min-h-0 flex-1 overflow-y-auto p-2">
        {marketOffers.length === 0 && myOffers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-8 text-center">
            <span className="animate-bounce-subtle text-5xl" aria-hidden="true">📭</span>
            <p className="font-heading text-sm font-black uppercase text-white/60">No open offers — post one or wait for bots!</p>
          </div>
        ) : (
          <>
            {marketOffers.length > 0 && (
              <div className="mb-3">
                <div className="mb-2 font-heading text-[10px] font-black uppercase text-[#FF6B35]">🌐 Global Market</div>
                {marketOffers.map((offer, i) => (
                  <OfferRow key={offer.id} offer={offer} state={state} playerId={playerId} now={now} index={i} onAccept={() => acceptOffer(offer.id)} />
                ))}
              </div>
            )}
            {myOffers.length > 0 && (
              <div>
                <div className="mb-2 font-heading text-[10px] font-black uppercase text-[#FF6B35]">🏳️ Your Offers</div>
                {myOffers.map((offer, i) => (
                  <OfferRow key={offer.id} offer={offer} state={state} playerId={playerId} now={now} index={i} onCancel={() => cancelOffer(offer.id)} isOwn />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Panel>
  )
}

function OfferRow({ offer, state, playerId, now, index, onAccept, onCancel, isOwn }: {
  offer: (typeof state.offers)[0]; state: ReturnType<typeof useGame>['state']; playerId: string; now: number; index: number
  onAccept?: () => void; onCancel?: () => void; isOwn?: boolean
}) {
  const from = getCountry(offer.fromCountryId, state.countries)
  const commodity = getCommodity(offer.commodityId)
  const accent = accentAt(index)
  const total = offer.qty * offer.pricePerUnit
  const canAccept = !isOwn && onAccept && (offer.type === 'sell'
    ? (getCountry(playerId, state.countries)?.balance ?? 0) >= total
    : getResource(playerId, offer.commodityId, state.resources) >= offer.qty)

  return (
    <div className="mb-2 rounded-2xl border-4 p-3 transition-all hover:-translate-y-1 hover:scale-[1.01]"
      style={{ borderColor: accentAt(index + 2), borderStyle: index % 2 === 0 ? 'solid' : 'dashed', backgroundColor: `${accent}12`, boxShadow: `6px 6px 0 ${accent}`, transform: index % 2 === 1 ? 'rotate(-0.5deg)' : 'rotate(0.5deg)' }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge color={offer.type === 'sell' ? '#34d399' : '#60a5fa'} dashed={index % 3 === 0}>{offer.type}</Badge>
            <span className="font-heading text-sm font-black uppercase" style={{ color: commodity?.color ?? accent }}>{commodity?.symbol}</span>
          </div>
          <div className="mt-1.5 font-body text-sm font-bold">{from?.flag} {from?.name}</div>
        </div>
        <div className="text-right">
          <div className="font-heading text-lg font-black text-shadow-single">{formatPrice(offer.pricePerUnit)}</div>
          <div className="text-[10px] font-bold text-white/50">{formatQty(offer.qty)} · {formatTimeAgo(offer.createdAt, now)}</div>
        </div>
      </div>
      <div className="mt-3">
        {isOwn && onCancel && <Button variant="danger" size="sm" className="w-full" onClick={onCancel}><X className="h-3 w-3" strokeWidth={3} /> Cancel</Button>}
        {!isOwn && onAccept && (
          <Button variant={canAccept ? 'primary' : 'outline'} accentIndex={index} size="sm" className="w-full" onClick={onAccept} disabled={!canAccept}>
            <Handshake className="h-3 w-3" strokeWidth={3} /> {canAccept ? 'Accept Trade!' : 'Need funds/stock'}
          </Button>
        )}
      </div>
    </div>
  )
}

export function RecentTrades() {
  const { state, now } = useGame()
  return (
    <Panel title="Recent Trades" subtitle="Fill feed" accentIndex={4} emoji="💥">
      <div className="scroll-max min-h-0 flex-1 overflow-y-auto p-2">
        {state.completedTrades.length === 0 ? (
          <div className="p-6 text-center font-heading text-xs font-bold uppercase text-white/40">No trades yet ✨</div>
        ) : (
          state.completedTrades.slice(0, 8).map((trade, i) => {
            const seller = getCountry(trade.sellerId, state.countries)
            const buyer = getCountry(trade.buyerId, state.countries)
            const commodity = getCommodity(trade.commodityId)
            const accent = accentAt(i)
            return (
              <div key={trade.id} className="mb-2 rounded-xl border-4 border-dotted p-2.5" style={{ borderColor: accent, backgroundColor: `${accent}10` }}>
                <div className="flex justify-between">
                  <span className="font-heading text-xs font-black uppercase" style={{ color: commodity?.color ?? accent }}>{commodity?.symbol}</span>
                  <span className="text-[9px] font-bold text-white/40">{formatTimeAgo(trade.filledAt, now)}</span>
                </div>
                <div className="text-[10px] font-bold text-white/60">{seller?.flag} → {buyer?.flag} · {formatQty(trade.qty)}</div>
                <div className="font-heading text-xs font-black text-[#34d399]">{formatPrice(trade.totalPrice / trade.qty)}/unit</div>
              </div>
            )
          })
        )}
      </div>
    </Panel>
  )
}
