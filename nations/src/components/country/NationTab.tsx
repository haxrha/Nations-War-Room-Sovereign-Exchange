import { useState } from 'react'
import { CountryDashboard } from '../country/CountryDashboard'
import { SanctionsPanel } from '../diplomacy/SanctionsPanel'
import { AlliancesPanel } from '../diplomacy/AlliancesPanel'
import { CyberWarfarePanel } from '../diplomacy/CyberWarfarePanel'
import { cn } from '../../lib/cn'

type NationView = 'portfolio' | 'diplomacy' | 'alliances' | 'cyber'

const VIEWS: { id: NationView; label: string }[] = [
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'diplomacy', label: 'Sanctions' },
  { id: 'alliances', label: 'Alliances' },
  { id: 'cyber', label: 'Cyber Ops' },
]

export function NationTab() {
  const [view, setView] = useState<NationView>('portfolio')

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div
        className="flex shrink-0 gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] p-1"
        role="tablist"
        aria-label="Nation views"
      >
        {VIEWS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={view === id}
            onClick={() => setView(id)}
            className={cn(
              'flex-1 rounded-md px-3 py-2 text-xs font-medium transition-all duration-200 md:text-sm',
              view === id
                ? 'bg-[#5E6AD2] text-white shadow-[0_2px_8px_rgba(94,106,210,0.35)]'
                : 'text-[#8A8F98] hover:text-[#EDEDEF]',
            )}
            style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1">
        {view === 'portfolio' && <CountryDashboard className="h-full" />}
        {view === 'diplomacy' && <SanctionsPanel className="h-full" />}
        {view === 'alliances' && <AlliancesPanel className="h-full" />}
        {view === 'cyber' && <CyberWarfarePanel className="h-full" />}
      </div>
    </div>
  )
}
