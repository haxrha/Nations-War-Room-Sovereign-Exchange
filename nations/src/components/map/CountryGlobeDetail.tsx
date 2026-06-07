import { ShieldBan, X } from 'lucide-react'
import { useState } from 'react'
import { useGame, type Country } from '../../context/GameContext'
import {
  botStrategyLabel,
  formatMoney,
  formatPrice,
  formatQty,
  getCommodity,
  getResource,
  idStr,
} from '../../lib/utils'
import { Button, Select } from '../ui/Button'
import { cn } from '../../lib/cn'

export function CountryGlobeDetail({
  country,
  onClose,
  className,
}: {
  country: Country
  onClose: () => void
  className?: string
}) {
  const {
    playerCountryId,
    commodities,
    resources,
    offers,
    tradeHistory,
    spotPrices,
    activeSanctions,
    imposeSanction,
    connected,
    error,
  } = useGame()

  const [sanctionCommodityId, setSanctionCommodityId] = useState('0')
  const [sanctionReason, setSanctionReason] = useState('')
  const [sanctionBusy, setSanctionBusy] = useState(false)

  const isPlayer = playerCountryId != null && country.id === playerCountryId
  const holdings = commodities
    .map((c) => ({
      commodity: c,
      qty: getResource(country.id, c.id, resources),
    }))
    .filter((h) => h.qty > 0)

  const countryOffers = offers.filter((o) => o.sellerId === country.id)
  const recentTrades = tradeHistory
    .filter((t) => t.buyerId === country.id || t.sellerId === country.id)
    .slice(0, 5)

  const sanctionsOn = activeSanctions.filter(
    (s) => s.targetCountryId === country.id || s.issuerCountryId === country.id,
  )

  const mySanctionOnTarget = playerCountryId
    ? activeSanctions.find(
        (s) => s.issuerCountryId === playerCountryId && s.targetCountryId === country.id,
      )
    : undefined

  const canSanction =
    playerCountryId != null && !isPlayer && country.id !== playerCountryId

  async function handleSanction(e: React.FormEvent) {
    e.preventDefault()
    if (!canSanction || !sanctionReason.trim()) return
    setSanctionBusy(true)
    try {
      await imposeSanction(country.id, BigInt(sanctionCommodityId), sanctionReason.trim())
      setSanctionReason('')
    } finally {
      setSanctionBusy(false)
    }
  }

  return (
    <div
      className={cn(
        'pointer-events-auto absolute bottom-4 right-4 z-20 w-[min(100%,20rem)] overflow-hidden rounded-xl border border-[#1a9e75]/25 bg-[#0a0e1a]/95 shadow-[0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-xl',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2 border-b border-[#1a9e75]/15 px-4 py-3">
        <div>
          <div className="text-2xl">{country.flag}</div>
          <h3 className="text-base font-semibold text-[#f1f5f9]">{country.name}</h3>
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#64748b]">
            {country.isoCode} · {country.region}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-[#64748b] hover:bg-white/[0.06] hover:text-[#f1f5f9]"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="scroll-subtle max-h-[min(55vh,24rem)] space-y-3 overflow-y-auto px-4 py-3 text-xs">
        <div className="flex flex-wrap gap-2">
          {isPlayer && (
            <span className="rounded border border-[#2dd4bf]/30 bg-[#1a9e75]/10 px-2 py-0.5 font-mono text-[10px] uppercase text-[#2dd4bf]">
              Your nation
            </span>
          )}
          {country.isBot && (
            <span className="rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] uppercase text-[#94a3b8]">
              {botStrategyLabel(country.botStrategy)}
            </span>
          )}
          <span
            className={cn(
              'rounded border px-2 py-0.5 font-mono text-[10px] uppercase',
              country.online
                ? 'border-[#2dd4bf]/30 text-[#2dd4bf]'
                : 'border-white/10 text-[#64748b]',
            )}
          >
            {country.online ? 'Online' : 'Offline'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Stat label="Treasury" value={formatMoney(country.balance, true)} />
          <Stat label="GDP score" value={formatMoney(country.gdpScore, true)} />
        </div>

        {isPlayer ? (
          <section>
            <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#2dd4bf]">
              Your stockpile
            </h4>
            <ul className="mt-1 space-y-1">
              {commodities.map((commodity) => {
                const qty = getResource(country.id, commodity.id, resources)
                const spot = spotPrices.find((s) => s.commodityId === commodity.id)
                return (
                  <li
                    key={idStr(commodity.id)}
                    className={cn(
                      'flex justify-between font-mono tabular-nums',
                      qty > 0 ? 'text-[#e2e8f0]' : 'text-[#64748b]',
                    )}
                  >
                    <span>{commodity.symbol}</span>
                    <span>
                      {formatQty(qty)} {commodity.unit}
                      {qty > 0 && (
                        <span className="text-[#64748b]">
                          {' '}
                          · {formatPrice(spot?.price ?? commodity.basePrice)}
                        </span>
                      )}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        ) : holdings.length > 0 ? (
          <section>
            <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#64748b]">
              Stockpile
            </h4>
            <ul className="mt-1 space-y-1">
              {holdings.map(({ commodity, qty }) => {
                const spot = spotPrices.find((s) => s.commodityId === commodity.id)
                return (
                  <li
                    key={idStr(commodity.id)}
                    className="flex justify-between font-mono tabular-nums text-[#e2e8f0]"
                  >
                    <span>{commodity.symbol}</span>
                    <span className="text-[#94a3b8]">
                      {formatQty(qty)} · {formatPrice(spot?.price ?? commodity.basePrice)}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        ) : (
          <p className="text-[#64748b]">No stockpile on record.</p>
        )}

        {countryOffers.length > 0 && (
          <section>
            <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#64748b]">
              Open offers ({countryOffers.length})
            </h4>
            <ul className="mt-1 max-h-24 space-y-1 overflow-y-auto scroll-subtle">
              {countryOffers.slice(0, 6).map((o) => {
                const comm = getCommodity(o.commodityId, commodities)
                return (
                  <li key={idStr(o.id)} className="flex justify-between font-mono text-[#cbd5e1]">
                    <span>{comm?.symbol ?? '?'}</span>
                    <span>
                      {formatQty(o.qty)} @ {formatPrice(o.pricePerUnit)}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {recentTrades.length > 0 && (
          <section>
            <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#64748b]">
              Recent trades
            </h4>
            <ul className="mt-1 space-y-1">
              {recentTrades.map((t) => {
                const comm = getCommodity(t.commodityId, commodities)
                const role = t.sellerId === country.id ? 'Sold' : 'Bought'
                return (
                  <li key={idStr(t.id)} className="font-mono text-[#94a3b8]">
                    {role} {formatQty(t.qty)} {comm?.symbol} @ {formatPrice(t.price)}
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {sanctionsOn.length > 0 && (
          <section>
            <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#f87171]">
              Sanctions
            </h4>
            <p className="mt-1 text-[#fca5a5]">{sanctionsOn.length} active restriction(s)</p>
          </section>
        )}

        {canSanction && (
          <section className="border-t border-[#1a9e75]/15 pt-3">
            {mySanctionOnTarget ? (
              <p className="font-mono text-[10px] text-[#f87171]">
                You have an active sanction on this nation.
              </p>
            ) : (
              <form onSubmit={handleSanction} className="space-y-2">
                <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#64748b]">
                  Impose sanction
                </h4>
                <Select
                  value={sanctionCommodityId}
                  onChange={(e) => setSanctionCommodityId(e.target.value)}
                >
                  <option value="0">All commodities (embargo)</option>
                  {commodities.map((c) => (
                    <option key={idStr(c.id)} value={idStr(c.id)}>
                      {c.symbol} only
                    </option>
                  ))}
                </Select>
                <input
                  value={sanctionReason}
                  onChange={(e) => setSanctionReason(e.target.value)}
                  placeholder="Reason (required)"
                  required
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 font-mono text-[11px] text-[#e2e8f0] placeholder:text-[#64748b] focus:border-[#f87171]/40 focus:outline-none"
                />
                {error && <p className="text-[10px] text-red-400">{error}</p>}
                <Button
                  type="submit"
                  size="sm"
                  className="w-full"
                  disabled={!connected || sanctionBusy || !sanctionReason.trim()}
                >
                  <ShieldBan className="h-3.5 w-3.5" />
                  Sanction {country.isBot ? 'AI nation' : country.name}
                </Button>
              </form>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
      <div className="font-mono text-[9px] uppercase tracking-widest text-[#64748b]">{label}</div>
      <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-[#f1f5f9]">
        {value}
      </div>
    </div>
  )
}
