import { Globe, RotateCcw, Wifi, WifiOff, Users } from 'lucide-react'
import { useState } from 'react'
import { useGame } from '../../context/GameContext'
import { formatMoney } from '../../lib/utils'
import { Badge } from '../ui/Panel'
import { cn } from '../../lib/cn'

export function Header({ onOpenProfile }: { onOpenProfile?: () => void }) {
  const { playerCountry, connected, tablesReady, now, onlineHumans, resetWorld } = useGame()
  const [resetting, setResetting] = useState(false)

  async function handleResetWorld() {
    if (
      !window.confirm(
        'Reset the entire world? All trades, players, and balances will be wiped and re-seeded at human scale. You will need to refresh to reconnect.',
      )
    ) {
      return
    }
    setResetting(true)
    try {
      await resetWorld()
      window.location.reload()
    } catch {
      setResetting(false)
    }
  }

  return (
    <header className="relative z-50 shrink-0 border-b border-[#1a9e75]/15 bg-[#0a0e1a]/95 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#1a9e75]/25 bg-[#0f1729] shadow-[0_0_16px_rgba(45,212,191,0.08)]">
            <Globe className="h-5 w-5 text-[#2dd4bf]" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-[#f1f5f9] md:text-xl">
              NATIONS
              <span className="ml-2 font-mono text-[10px] font-normal tracking-[0.25em] text-[#64748b]">
                WAR ROOM
              </span>
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#64748b]">
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
            <span className="live-dot hidden h-1.5 w-1.5 rounded-full bg-[#2dd4bf] md:inline-block" />
          )}
          {onlineHumans.length > 0 && (
            <Badge variant="accent">
              <Users className="mr-1 h-3 w-3" />
              {onlineHumans.length} online
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetWorld}
            disabled={!connected || resetting}
            className={cn(
              'flex items-center gap-1.5 rounded-lg border border-[#1a9e75]/15 bg-[#0f1729]/80 px-3 py-2',
              'font-mono text-[10px] uppercase tracking-widest text-[#64748b]',
              'transition-colors hover:border-[#f87171]/30 hover:text-[#f87171]',
              'disabled:cursor-not-allowed disabled:opacity-40',
            )}
            title="Wipe and re-seed economy at human scale"
          >
            <RotateCcw className={cn('h-3.5 w-3.5', resetting && 'animate-spin')} />
            Reset world
          </button>

        {playerCountry && (
          <button
            type="button"
            onClick={onOpenProfile}
            className={cn(
              'flex items-center gap-4 rounded-lg border border-[#1a9e75]/15 bg-[#0f1729]/80 px-4 py-2 text-left',
              'transition-all duration-300 hover:border-[#2dd4bf]/30 hover:shadow-[0_0_20px_rgba(45,212,191,0.08)]',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2dd4bf]/40',
            )}
            aria-label="Open profile"
          >
            <div className="text-2xl">{playerCountry.flag}</div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-[#f1f5f9]">
                {playerCountry.name}
                <span className="ml-2 font-mono text-[10px] text-[#64748b]">
                  {playerCountry.isoCode}
                </span>
              </div>
              <div className="font-mono text-xs tabular-nums text-[#94a3b8]">
                TREAS {formatMoney(playerCountry.balance, true)} · GDP{' '}
                {formatMoney(playerCountry.gdpScore, true)}
              </div>
            </div>
            <div className="hidden font-mono text-[10px] tabular-nums text-[#64748b] md:block">
              {new Date(now).toLocaleTimeString()}
            </div>
          </button>
        )}
        </div>
      </div>
    </header>
  )
}
