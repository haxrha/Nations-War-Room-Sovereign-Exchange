import { cn } from '../../lib/cn'
import { accentAt, clashBorder, borderStyleAt, cardRotation } from '../../lib/design-system'
import type { ReactNode } from 'react'

interface PanelProps {
  children: ReactNode
  title: string
  subtitle?: ReactNode
  accentIndex?: number
  emoji?: string
  className?: string
  headerExtra?: ReactNode
  rotate?: boolean
}

export function Panel({ children, title, subtitle, accentIndex = 0, emoji, className, headerExtra, rotate = true }: PanelProps) {
  const accent = accentAt(accentIndex)
  const borderColor = clashBorder(accentIndex)
  return (
    <div
      className={cn('relative flex h-full flex-col overflow-hidden rounded-3xl border-4 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01]', rotate && cardRotation(accentIndex), borderStyleAt(accentIndex), className)}
      style={{ backgroundColor: 'rgba(45, 27, 78, 0.82)', borderColor, boxShadow: `8px 8px 0 ${accent}, 0 0 24px ${accent}33` }}
    >
      <div className="pointer-events-none absolute inset-0 pattern-dots-cyan opacity-20" aria-hidden="true" />
      <div className="relative z-10 flex shrink-0 items-center justify-between gap-2 border-b-4 border-dashed px-4 py-3" style={{ borderColor: accent }}>
        <div className="flex min-w-0 items-center gap-2">
          {emoji && <span className="animate-wiggle text-2xl" aria-hidden="true">{emoji}</span>}
          <div className="min-w-0">
            <h2 className="font-heading truncate text-sm font-black uppercase tracking-wider text-shadow-single md:text-base">{title}</h2>
            {subtitle && <p className="truncate font-body text-[10px] font-bold uppercase tracking-widest text-white/60">{subtitle}</p>}
          </div>
        </div>
        {headerExtra}
      </div>
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  )
}

export function StatPill({ label, value, accentIndex = 0 }: { label: string; value: string; accentIndex?: number }) {
  const accent = accentAt(accentIndex)
  const border = clashBorder(accentIndex + 1)
  return (
    <div className={cn('rounded-2xl border-4 p-3 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]', accentIndex % 2 === 0 ? 'rotate-1' : '-rotate-1')}
      style={{ backgroundColor: `${accent}18`, borderColor: border, boxShadow: `4px 4px 0 ${accent}` }}>
      <div className="font-heading text-[9px] font-bold uppercase tracking-widest" style={{ color: accent }}>{label}</div>
      <div className="font-heading truncate text-lg font-black text-white text-shadow-single">{value}</div>
    </div>
  )
}

export function Badge({ children, color, dashed }: { children: ReactNode; color: string; dashed?: boolean }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border-4 px-2.5 py-0.5 font-heading text-[9px] font-black uppercase tracking-widest', dashed ? 'border-dashed' : 'border-solid')}
      style={{ borderColor: color, color, backgroundColor: `${color}22` }}>
      {children}
    </span>
  )
}
