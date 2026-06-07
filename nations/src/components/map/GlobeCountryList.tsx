import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useGame, type Country } from '../../context/GameContext'
import { botStrategyLabel, formatMoney, idStr } from '../../lib/utils'
import { cn } from '../../lib/cn'

export function GlobeCountryList({
  selectedId,
  onSelect,
  className,
}: {
  selectedId: bigint | null
  onSelect: (country: Country) => void
  className?: string
}) {
  const { countries, playerCountryId } = useGame()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = [...countries].sort((a, b) => {
      const aPlayer = a.id === playerCountryId ? 0 : 1
      const bPlayer = b.id === playerCountryId ? 0 : 1
      if (aPlayer !== bPlayer) return aPlayer - bPlayer
      if (a.isBot !== b.isBot) return a.isBot ? 1 : -1
      return a.name.localeCompare(b.name)
    })
    if (!q) return list
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.isoCode.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q),
    )
  }, [countries, playerCountryId, query])

  return (
    <div
      className={cn(
        'pointer-events-auto absolute left-3 top-3 z-10 flex w-[min(100%,14rem)] flex-col overflow-hidden rounded-xl border border-[#1a9e75]/20 bg-[#0a0e1a]/92 backdrop-blur-xl md:w-52',
        className,
      )}
    >
      <div className="border-b border-[#1a9e75]/15 p-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#64748b]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find nation…"
            className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] py-1.5 pl-7 pr-2 font-mono text-[11px] text-[#e2e8f0] placeholder:text-[#64748b] focus:border-[#2dd4bf]/40 focus:outline-none"
          />
        </div>
        <p className="mt-1.5 font-mono text-[9px] uppercase tracking-widest text-[#64748b]">
          {filtered.length} nations · click to focus
        </p>
      </div>
      <ul className="scroll-subtle max-h-[min(40vh,16rem)] overflow-y-auto p-1.5">
        {filtered.map((country) => {
          const isPlayer = country.id === playerCountryId
          const isSelected = selectedId === country.id
          return (
            <li key={idStr(country.id)}>
              <button
                type="button"
                onClick={() => onSelect(country)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors',
                  isSelected
                    ? 'bg-[#1a9e75]/20 text-[#f1f5f9]'
                    : 'text-[#cbd5e1] hover:bg-white/[0.05]',
                )}
              >
                <span className="text-base leading-none">{country.flag}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium">
                    {country.name}
                    {isPlayer && (
                      <span className="ml-1 font-mono text-[9px] text-[#2dd4bf]">YOU</span>
                    )}
                  </span>
                  <span className="block truncate font-mono text-[9px] text-[#64748b]">
                    {country.isBot ? botStrategyLabel(country.botStrategy) : 'Human'} ·{' '}
                    {formatMoney(country.gdpScore, true)}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
        {filtered.length === 0 && (
          <li className="px-2 py-3 text-center text-[10px] text-[#64748b]">No matches</li>
        )}
      </ul>
    </div>
  )
}
