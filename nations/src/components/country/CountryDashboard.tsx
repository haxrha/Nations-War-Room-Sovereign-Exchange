import { useState } from 'react'
import { Send, UserPen } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import {
  formatMoney,
  formatPrice,
  formatQty,
  getCommodity,
  getResource,
  commodityAccent,
  idStr,
} from '../../lib/utils'
import { Panel, StatPill } from '../ui/Panel'
import { Button, Input, Select } from '../ui/Button'

import { cn } from '../../lib/cn'

export function CountryDashboard({ className }: { className?: string }) {
  const {
    playerCountry,
    playerCountryId,
    commodities,
    resources,
    spotPrices,
    selectedCommodityId,
    placeOffer,
    setCountryProfile,
    error,
    connected,
  } = useGame()

  const [commodityId, setCommodityId] = useState<bigint | null>(selectedCommodityId)
  const [qty, setQty] = useState('50')
  const [price, setPrice] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [profileIso, setProfileIso] = useState('')

  if (!playerCountry || playerCountryId == null) {
    return (
      <Panel title="Country Dashboard" subtitle="Connect to register your nation" label="Portfolio">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="text-sm text-[#8A8F98]">
            {connected
              ? 'Waiting for your country row — ensure the module is initialized with spacetime call nations init'
              : 'Connect to SpacetimeDB to join the exchange'}
          </p>
        </div>
      </Panel>
    )
  }

  const activeCommodityId = commodityId ?? commodities[0]?.id
  const commodity = activeCommodityId
    ? getCommodity(activeCommodityId, commodities)
    : undefined
  const spot = activeCommodityId
    ? spotPrices.find((s) => s.commodityId === activeCommodityId)
    : undefined
  const defaultPrice = spot?.price ?? commodity?.basePrice ?? 100
  const stock = activeCommodityId
    ? getResource(playerCountryId, activeCommodityId, resources)
    : 0

  const inventory = commodities.map((c) => {
    const row = resources.find(
      (r) => r.countryId === playerCountryId && r.commodityId === c.id,
    )
    return {
      commodity: c,
      qty: row?.qty ?? 0,
      productionRate: row?.productionRate ?? 0,
      spot: spotPrices.find((s) => s.commodityId === c.id),
    }
  })

  const holdings = inventory.filter((h) => h.qty > 0)

  const needsProfile =
    playerCountry.name === 'New Player' || playerCountry.isoCode === '???'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeCommodityId) return
    const parsedQty = parseFloat(qty)
    const parsedPrice = parseFloat(price || String(defaultPrice))
    if (parsedQty > 0 && parsedPrice > 0) {
      await placeOffer(activeCommodityId, parsedQty, parsedPrice)
      setQty('50')
      setPrice('')
    }
  }

  const handleProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    await setCountryProfile(profileName, profileIso)
    setProfileOpen(false)
  }

  return (
    <Panel
      title="Country Dashboard"
      subtitle={`${playerCountry.flag} ${playerCountry.name}`}
      label="Portfolio"
      spotlight
      className={cn('h-full min-h-0', className)}
      headerExtra={
        needsProfile || profileOpen ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setProfileName(playerCountry.name)
              setProfileIso(playerCountry.isoCode)
              setProfileOpen(true)
            }}
          >
            <UserPen className="h-3.5 w-3.5" />
            Profile
          </Button>
        ) : null
      }
    >
      <div className="flex min-h-0 flex-1 flex-col">
        {(needsProfile || profileOpen) && (
          <form
            onSubmit={handleProfile}
            className="shrink-0 border-b border-white/[0.06] bg-[#5E6AD2]/10 p-4"
          >
            <p className="mb-3 text-xs text-[#8A8F98]">Name your nation to appear on the map</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Country name"
                required
              />
              <Input
                value={profileIso}
                onChange={(e) => setProfileIso(e.target.value)}
                placeholder="ISO (e.g. USA)"
                maxLength={3}
              />
            </div>
            <Button type="submit" size="sm" className="mt-2">
              Save profile
            </Button>
          </form>
        )}

        <div className="shrink-0 grid grid-cols-2 gap-3 p-4">
          <StatPill label="Treasury" value={formatMoney(playerCountry.balance, true)} />
          <StatPill label="GDP Score" value={formatMoney(playerCountry.gdpScore, true)} />
          <StatPill label="Region" value={playerCountry.region} />
          <StatPill label="Status" value={playerCountry.online ? 'Online' : 'Offline'} />
        </div>

        <div className="scroll-subtle min-h-0 flex-1 overflow-y-auto border-y border-white/[0.06] px-4 py-3">
          <div className="font-mono-label mb-3 text-[10px] uppercase tracking-widest text-[#8A8F98]">
            Resource stockpile
          </div>
          <div className="space-y-2">
            {inventory.map(({ commodity: c, qty: q, productionRate, spot: s }) => (
              <div
                key={idStr(c.id)}
                className={cn(
                  'flex items-center justify-between rounded-lg border p-3 transition-transform duration-300',
                  q > 0
                    ? 'border-white/[0.06] bg-white/[0.02] hover:-translate-y-0.5'
                    : 'border-white/[0.03] bg-transparent opacity-60',
                )}
                style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-lg border text-[10px] font-semibold"
                    style={{
                      borderColor: `${commodityAccent(c)}40`,
                      color: commodityAccent(c),
                    }}
                  >
                    {c.symbol}
                  </span>
                  <div>
                    <span className="text-sm text-[#EDEDEF]">{c.name}</span>
                    {productionRate > 0 && (
                      <div className="font-mono text-[9px] text-[#64748b]">
                        +{formatQty(productionRate)}/tick prod.
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className={cn('text-sm font-semibold', q <= 0 && 'text-[#64748b]')}>
                    {formatQty(q)} {c.unit}
                  </div>
                  <div className="text-[10px] text-[#8A8F98]">
                    @ {formatPrice(s?.price ?? c.basePrice)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {holdings.length === 0 && (
            <p className="mt-2 text-xs text-[#8A8F98]">
              Buy commodities on the Exchange tab to build your stockpile.
            </p>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="shrink-0 space-y-3 border-t border-white/[0.06] bg-[#050506]/60 p-4 backdrop-blur-sm"
        >
          <div className="font-mono-label text-[10px] uppercase tracking-widest text-[#8A8F98]">
            Post sell offer
          </div>
          <Select
            value={activeCommodityId?.toString() ?? ''}
            onChange={(e) => setCommodityId(BigInt(e.target.value))}
          >
            {commodities.map((c) => (
              <option key={idStr(c.id)} value={idStr(c.id)}>
                {c.symbol} — {c.name}
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="Quantity"
              min={1}
            />
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={defaultPrice.toFixed(2)}
              step="0.01"
              min={0.01}
            />
          </div>
          <p className="text-[10px] text-[#8A8F98]">
            Available: {formatQty(stock)} {commodity?.unit ?? ''} · stock escrowed on listing
          </p>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={!connected || stock <= 0}>
            <Send className="h-4 w-4" />
            Post to exchange
          </Button>
        </form>
      </div>
    </Panel>
  )
}
