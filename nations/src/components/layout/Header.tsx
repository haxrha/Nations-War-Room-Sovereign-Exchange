import { Globe, Wifi, WifiOff, Users } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { formatMoney } from '../../lib/utils'
import { Badge } from '../ui/Panel'
import { cn } from '../../lib/cn'

export function Header() {
  const { playerCountry, connected, tablesReady, now, onlineHumans } = useGame()

  return (
    <header className="relative z-50 shrink-0 border-b border-white/[0.06] bg-[#050506]/80 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
            <Globe className="h-5 w-5 text-[#5E6AD2]" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight md:text-xl">
              <span className="gradient-text">Nations</span>
            </h1>
            <p className="font-mono-label text-[10px] uppercase tracking-widest text-[#8A8F98]">
              Sovereign Trade Exchange
            </p>
          </div>
          <Badge variant={connected ? 'success' : 'default'}>
            {connected ? (
              <>
                <Wifi className="mr-1 h-3 w-3" />
                Live
              </>
            ) : (
              <>
                <WifiOff className="mr-1 h-3 w-3" />
                Offline
              </>
            )}
          </Badge>
          {tablesReady && (
            <span className="live-dot hidden h-1.5 w-1.5 rounded-full bg-emerald-400 md:inline-block" />
          )}
          {onlineHumans.length > 0 && (
            <Badge variant="accent">
              <Users className="mr-1 h-3 w-3" />
              {onlineHumans.length} online
            </Badge>
          )}
        </div>

        {playerCountry && (
          <div
            className={cn(
              'flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2',
              'transition-transform duration-300 hover:-translate-y-0.5',
            )}
            style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            <div className="text-2xl">{playerCountry.flag}</div>
            <div>
              <div className="text-sm font-semibold tracking-tight">
                {playerCountry.name}
                <span className="ml-2 font-mono-label text-[10px] text-[#8A8F98]">
                  {playerCountry.isoCode}
                </span>
              </div>
              <div className="text-xs text-[#8A8F98]">
                Treasury {formatMoney(playerCountry.balance, true)} · GDP{' '}
                {formatMoney(playerCountry.gdpScore, true)}
              </div>
            </div>
            <div className="hidden text-right text-[10px] text-[#8A8F98] md:block">
              {new Date(now).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
