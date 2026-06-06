import {
  Globe,
  TrendingUp,
  Handshake,
  Landmark,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '../../lib/cn'

export type AppTab = 'world' | 'market' | 'exchange' | 'nation' | 'ranks'

const TABS: { id: AppTab; label: string; shortLabel: string; icon: LucideIcon }[] = [
  { id: 'world', label: 'World', shortLabel: 'Map', icon: Globe },
  { id: 'market', label: 'Market', shortLabel: 'Market', icon: TrendingUp },
  { id: 'exchange', label: 'Exchange', shortLabel: 'Trade', icon: Handshake },
  { id: 'nation', label: 'Nation', shortLabel: 'Nation', icon: Landmark },
  { id: 'ranks', label: 'Ranks', shortLabel: 'Ranks', icon: Trophy },
]

interface TabBarProps {
  active: AppTab
  onChange: (tab: AppTab) => void
  offerCount?: number
}

export function TabBar({ active, onChange, offerCount = 0 }: TabBarProps) {
  return (
    <nav
      className="relative z-40 shrink-0 border-b border-white/[0.06] bg-[#050506]/90 px-2 py-2 backdrop-blur-xl md:px-4"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-5xl gap-1 md:gap-2">
        {TABS.map(({ id, label, shortLabel, icon: Icon }) => {
          const isActive = active === id
          const showBadge = id === 'exchange' && offerCount > 0
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-center transition-all duration-200 md:flex-row md:justify-center md:gap-2 md:px-4',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5E6AD2]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050506]',
                isActive
                  ? 'bg-[#5E6AD2]/15 text-[#EDEDEF] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]'
                  : 'text-[#8A8F98] hover:bg-white/[0.05] hover:text-[#EDEDEF]',
              )}
              style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
              <span className="relative">
                <Icon className="h-4 w-4 md:h-[18px] md:w-[18px]" strokeWidth={isActive ? 2 : 1.75} />
                {showBadge && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#5E6AD2] px-1 text-[9px] font-semibold text-white">
                    {offerCount > 99 ? '99+' : offerCount}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium md:text-sm">
                <span className="md:hidden">{shortLabel}</span>
                <span className="hidden md:inline">{label}</span>
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
