import { cn } from '../../lib/cn'
import { useSpotlight } from '../../hooks/useSpotlight'
import type { ReactNode } from 'react'

interface PanelProps {
  children: ReactNode
  title: string
  subtitle?: ReactNode
  label?: string
  className?: string
  headerExtra?: ReactNode
  spotlight?: boolean
  variant?: 'default' | 'glass'
}

export function Panel({
  children,
  title,
  subtitle,
  label,
  className,
  headerExtra,
  spotlight = true,
  variant = 'default',
}: PanelProps) {
  const spot = useSpotlight()

  return (
    <div
      ref={spotlight ? spot.ref : undefined}
      onMouseMove={spotlight ? spot.onMouseMove : undefined}
      onMouseEnter={spotlight ? spot.onMouseEnter : undefined}
      onMouseLeave={spotlight ? spot.onMouseLeave : undefined}
      className={cn(
        'spotlight-card card-surface relative flex h-full flex-col overflow-hidden',
        variant === 'glass' && 'backdrop-blur-xl',
        className,
      )}
    >
      <div className="relative z-10 flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
        <div className="min-w-0">
          {label && (
            <div className="font-mono-label mb-1 text-[10px] font-medium uppercase tracking-widest text-[#8A8F98]">
              {label}
            </div>
          )}
          <h2 className="truncate text-sm font-semibold tracking-tight text-[#EDEDEF] md:text-base">
            {title}
          </h2>
          {subtitle && (
            <p className="truncate text-xs text-[#8A8F98]">{subtitle}</p>
          )}
        </div>
        {headerExtra}
      </div>
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  )
}

export function StatPill({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 transition-transform duration-300 hover:-translate-y-0.5"
      style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}>
      <div className="font-mono-label text-[10px] uppercase tracking-widest text-[#8A8F98]">
        {label}
      </div>
      <div className="mt-1 truncate text-lg font-semibold tracking-tight text-[#EDEDEF]">
        {value}
      </div>
      {hint && <div className="mt-0.5 text-[10px] text-[#8A8F98]">{hint}</div>}
    </div>
  )
}

export function Badge({
  children,
  variant = 'default',
}: {
  children: ReactNode
  variant?: 'default' | 'accent' | 'success' | 'danger'
}) {
  const styles = {
    default: 'border-white/10 text-[#8A8F98] bg-white/[0.04]',
    accent: 'border-[#5E6AD2]/30 text-[#6872D9] bg-[#5E6AD2]/10',
    success: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    danger: 'border-red-500/30 text-red-400 bg-red-500/10',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider',
        styles[variant],
      )}
    >
      {children}
    </span>
  )
}
