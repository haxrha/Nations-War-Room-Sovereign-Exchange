import { useState } from 'react'
import { Send } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { COMMODITIES } from '../../data/mockData'
import { computeGdpProxy, formatMoney, formatPrice, formatQty, getCommodity, getCountry, getResource } from '../../lib/utils'
import { Panel, StatPill } from '../ui/Panel'
import { Button, Input, Select } from '../ui/Button'
import { accentAt } from '../../lib/design-system'
import type { OfferType } from '../../types'

export function CountryDashboard() {
  const { state, placeOffer } = useGame()
  const country = getCountry(state.playerCountryId, state.countries)
  const [offerType, setOfferType] = useState<OfferType>('sell')
  const [commodityId, setCommodityId] = useState(state.selectedCommodityId)
  const [qty, setQty] = useState('100000')
  const [price, setPrice] = useState('')

  if (!country) return null

  const gdp = computeGdpProxy(country.id, state)
  const spot = state.spotPrices.find((s) => s.countryId === country.id && s.commodityId === commodityId)
  const commodity = getCommodity(commodityId)
  const defaultPrice = spot?.price ?? commodity?.basePrice ?? 100
  const stock = getResource(country.id, commodityId, state.resources)
  const holdings = COMMODITIES.map((c) => ({ commodity: c, qty: getResource(country.id, c.id, state.resources), spot: state.spotPrices.find((s) => s.countryId === country.id && s.commodityId === c.id) })).filter((h) => h.qty > 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsedQty = parseInt(qty, 10)
    const parsedPrice = parseFloat(price || String(defaultPrice))
    if (parsedQty > 0 && parsedPrice > 0) { placeOffer(commodityId, parsedQty, parsedPrice, offerType); setQty('100000'); setPrice('') }
  }

  return (
    <Panel title="Country Dash" subtitle={`${country.flag} ${country.name}`} accentIndex={2} emoji="🏛️">
      <div className="grid grid-cols-2 gap-3 p-4">
        <StatPill label="Treasury" value={formatMoney(country.balance, true)} accentIndex={0} />
        <StatPill label="GDP Proxy" value={formatMoney(gdp, true)} accentIndex={1} />
        <StatPill label="Exports" value={country.exports.map((e) => getCommodity(e)?.symbol).join(' · ') ?? '—'} accentIndex={2} />
        <StatPill label="Control" value={country.isBot ? 'AI 🤖' : 'Human 🎮'} accentIndex={3} />
      </div>
      <div className="scroll-max min-h-0 flex-1 overflow-y-auto border-y-4 border-dashed px-4 py-3" style={{ borderColor: accentAt(3) }}>
        <div className="mb-3 font-heading text-xs font-black uppercase tracking-widest text-[#FFE600] text-shadow-single">💎 Resource Stockpile</div>
        <div className="space-y-2">
          {holdings.map(({ commodity: c, qty: q, spot: s }, i) => (
            <div key={c.id} className="flex items-center justify-between rounded-2xl border-4 p-3 transition-all hover:-translate-y-0.5"
              style={{ borderColor: accentAt(i + 1), backgroundColor: `${accentAt(i + 1)}15`, boxShadow: `4px 4px 0 ${accentAt(i + 2)}`, transform: i % 2 === 1 ? 'rotate(-0.5deg)' : 'rotate(0.5deg)' }}>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-4 font-heading text-[10px] font-black" style={{ borderColor: c.color, color: c.color }}>{c.symbol.slice(0, 2)}</span>
                <span className="font-body text-sm font-bold">{c.name}</span>
              </div>
              <div className="text-right">
                <div className="font-heading text-sm font-black">{formatQty(q)} {c.unit}</div>
                <div className="text-[10px] font-bold text-white/50">@ {formatPrice(s?.price ?? c.basePrice)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3 p-4">
        <div className="font-heading text-xs font-black uppercase tracking-widest text-shadow-single">⚡ Post Trade Offer</div>
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant={offerType === 'sell' ? 'primary' : 'secondary'} accentIndex={0} size="sm" onClick={() => setOfferType('sell')} className="w-full">Sell</Button>
          <Button type="button" variant={offerType === 'buy' ? 'primary' : 'secondary'} accentIndex={1} size="sm" onClick={() => setOfferType('buy')} className="w-full">Buy</Button>
        </div>
        <Select accentIndex={2} value={commodityId} onChange={(e) => setCommodityId(e.target.value)}>
          {COMMODITIES.map((c) => <option key={c.id} value={c.id}>{c.symbol} — {c.name}</option>)}
        </Select>
        <div className="grid grid-cols-2 gap-2">
          <Input accentIndex={3} type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Quantity" />
          <Input accentIndex={4} type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={defaultPrice.toFixed(2)} step="0.01" />
        </div>
        <p className="font-body text-[10px] font-bold text-white/50">
          {offerType === 'sell' ? `Available: ${formatQty(stock)} ${commodity?.unit ?? ''}` : `Treasury: ${formatMoney(country.balance, true)}`}
        </p>
        <Button type="submit" variant="primary" accentIndex={0} size="lg" className="w-full">
          <Send className="h-4 w-4" strokeWidth={3} /> Post to Exchange
        </Button>
      </form>
    </Panel>
  )
}
