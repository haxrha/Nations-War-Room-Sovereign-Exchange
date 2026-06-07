import { Crosshair, Pause, Play, RotateCcw } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export function GlobeControls({
  autoRotate,
  onToggleRotate,
  onFocusPlayer,
  onResetView,
  hasPlayer,
  className,
}: {
  autoRotate: boolean
  onToggleRotate: () => void
  onFocusPlayer: () => void
  onResetView: () => void
  hasPlayer: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'pointer-events-auto absolute right-3 top-3 z-10 flex flex-col gap-1.5',
        className,
      )}
    >
      {hasPlayer && (
        <GlobeControlButton
          label="Focus your nation"
          onClick={onFocusPlayer}
          title="Fly to your nation"
        >
          <Crosshair className="h-3.5 w-3.5" />
        </GlobeControlButton>
      )}
      <GlobeControlButton
        label={autoRotate ? 'Pause rotation' : 'Resume rotation'}
        onClick={onToggleRotate}
        title={autoRotate ? 'Pause globe rotation' : 'Resume globe rotation'}
      >
        {autoRotate ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </GlobeControlButton>
      <GlobeControlButton label="Reset view" onClick={onResetView} title="Reset camera">
        <RotateCcw className="h-3.5 w-3.5" />
      </GlobeControlButton>
    </div>
  )
}

function GlobeControlButton({
  children,
  label,
  onClick,
  title,
}: {
  children: ReactNode
  label: string
  onClick: () => void
  title: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#1a9e75]/20 bg-[#0a0e1a]/90 text-[#94a3b8] backdrop-blur-md transition-colors hover:border-[#2dd4bf]/30 hover:text-[#2dd4bf]"
    >
      {children}
    </button>
  )
}
