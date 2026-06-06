import { cn } from '../../lib/cn'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  variant = 'primary',
  children,
  size = 'md',
  className,
  disabled,
  ...props
}: ButtonProps) {
  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-11 px-6 text-sm',
  }
  const variants = {
    primary: 'btn-primary rounded-lg font-medium',
    secondary: 'btn-secondary rounded-lg font-medium border border-white/[0.06]',
    ghost: 'btn-ghost rounded-lg font-medium',
    danger:
      'rounded-lg font-medium border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/15',
  }

  return (
    <button
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5E6AD2]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050506] disabled:cursor-not-allowed disabled:opacity-40',
        sizes[size],
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn('input-field w-full px-3 py-2.5 text-sm', className)}
      {...props}
    />
  )
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn('input-field w-full px-3 py-2.5 text-sm', className)}
      {...props}
    >
      {children}
    </select>
  )
}
