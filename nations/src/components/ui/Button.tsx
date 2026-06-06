import { cn } from '../../lib/cn'
import { accentAt, clashBorder } from '../../lib/design-system'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  accentIndex?: number
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ variant = 'primary', accentIndex = 0, children, size = 'md', className, disabled, ...props }: ButtonProps) {
  const accent = accentAt(accentIndex)
  const clash = clashBorder(accentIndex)
  const sizes = { sm: 'h-9 px-4 text-[10px]', md: 'h-11 px-6 text-xs', lg: 'h-14 px-10 text-sm' }
  const base = 'font-heading inline-flex items-center justify-center gap-2 rounded-full border-4 font-black uppercase tracking-widest transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-4 disabled:cursor-not-allowed disabled:opacity-50'

  if (variant === 'primary') {
    return (
      <button disabled={disabled} className={cn(base, sizes[size], 'animate-pulse-glow text-white hover:scale-110 active:scale-95', className)}
        style={{ background: 'linear-gradient(90deg, #FF3AF2, #7B2FFF, #00F5D4)', backgroundSize: '200% 100%', borderColor: clash, boxShadow: `0 0 24px ${accent}88, 8px 8px 0 #FFE600` }} {...props}>
        {children}
      </button>
    )
  }
  if (variant === 'secondary') {
    return (
      <button disabled={disabled} className={cn(base, sizes[size], 'border-dashed bg-transparent hover:scale-105', className)}
        style={{ borderColor: accent, color: accent }} {...props}>
        {children}
      </button>
    )
  }
  if (variant === 'danger') {
    return (
      <button disabled={disabled} className={cn(base, sizes[size], 'hover:scale-105', className)}
        style={{ backgroundColor: 'rgba(248,113,113,0.15)', borderColor: '#f87171', color: '#f87171', boxShadow: '4px 4px 0 #FF6B35' }} {...props}>
        {children}
      </button>
    )
  }
  return (
    <button disabled={disabled} className={cn(base, sizes[size], 'hover:-translate-x-1 hover:-translate-y-1', className)}
      style={{ backgroundColor: 'rgba(45,27,78,0.6)', borderColor: accent, color: '#fff', boxShadow: `8px 8px 0 ${clash}` }} {...props}>
      {children}
    </button>
  )
}

export function Input({ accentIndex = 0, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { accentIndex?: number }) {
  const accent = accentAt(accentIndex)
  const clash = clashBorder(accentIndex)
  return (
    <input className={cn('w-full rounded-2xl border-4 bg-[#2D1B4E]/50 px-4 py-3 font-heading text-sm font-bold text-white backdrop-blur-sm placeholder:text-white/40 transition-all duration-300 focus:bg-[#2D1B4E] focus:outline-none focus:ring-4 focus:ring-offset-2', className)}
      style={{ borderColor: accent }}
      onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 20px ${clash}66`; e.currentTarget.style.borderColor = clash }}
      onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = accent }}
      {...props} />
  )
}

export function Select({ accentIndex = 0, className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { accentIndex?: number }) {
  const accent = accentAt(accentIndex)
  return (
    <select className={cn('w-full rounded-full border-4 bg-[#2D1B4E]/70 px-4 py-2.5 font-heading text-xs font-bold uppercase tracking-wider text-white focus:outline-none focus:ring-4 focus:ring-offset-2', className)}
      style={{ borderColor: accent }} {...props}>
      {children}
    </select>
  )
}
