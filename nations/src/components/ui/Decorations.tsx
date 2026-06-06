import { cn } from '../../lib/cn'
import { accentAt } from '../../lib/design-system'

const DECORATIONS = [
  { emoji: '✨', top: '8%', left: '3%', anim: 'animate-float', size: 'text-3xl' },
  { emoji: '🚀', top: '15%', right: '5%', anim: 'animate-bounce-subtle', size: 'text-4xl' },
  { emoji: '💫', bottom: '20%', left: '8%', anim: 'animate-float-reverse', size: 'text-2xl' },
  { emoji: '⚡', top: '45%', right: '2%', anim: 'animate-wiggle', size: 'text-3xl' },
  { emoji: '🔥', bottom: '8%', right: '12%', anim: 'animate-float', size: 'text-3xl' },
] as const

export function FloatingDecorations({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden="true">
      {DECORATIONS.map((d, i) => (
        <span key={i} className={cn('absolute select-none', d.anim, d.size)}
          style={{
            top: 'top' in d ? d.top : undefined,
            left: 'left' in d ? d.left : undefined,
            right: 'right' in d ? d.right : undefined,
            bottom: 'bottom' in d ? d.bottom : undefined,
            color: accentAt(i),
            filter: `drop-shadow(0 0 8px ${accentAt(i)}88)`,
          }}>
          {d.emoji}
        </span>
      ))}
      <div className="absolute -right-8 top-1/4 h-24 w-24 rounded-full border-4 border-dashed border-[#FFE600] animate-spin-slow opacity-40" />
    </div>
  )
}

export function BackgroundWord({ word, className }: { word: string; className?: string }) {
  return <div className={cn('bg-word pointer-events-none absolute font-display uppercase text-[#FF3AF2]', className)} aria-hidden="true">{word}</div>
}
