import { useState } from 'react'
import { Header } from './components/layout/Header'
import { TabBar, type AppTab } from './components/layout/TabBar'
import { WorldMap } from './components/map/WorldMap'
import { MarketPanel } from './components/market/MarketPanel'
import { NationTab } from './components/country/NationTab'
import { ExchangeTab } from './components/trading/ExchangeTab'
import { Leaderboard } from './components/leaderboard/Leaderboard'
import { BotTab } from './components/bots/BotTab'
import { AmbientBackground, ConnectionBanner } from './components/ui/Decorations'
import { useGame } from './context/GameContext'
import { cn } from './lib/cn'

function App() {
  const { connected, connecting, offers } = useGame()
  const [tab, setTab] = useState<AppTab>('exchange')

  return (
    <div className="app-shell relative flex h-full flex-col overflow-hidden">
      <AmbientBackground />
      <ConnectionBanner connected={connected} connecting={connecting} />

      <div className="relative z-10 flex h-full min-h-0 flex-col">
        <Header />
        <TabBar active={tab} onChange={setTab} offerCount={offers.length} />

        <main className="min-h-0 flex-1 overflow-hidden p-3 md:p-4">
          <div
            className={cn(
              'mx-auto h-full max-w-6xl',
              tab === 'world' ? 'block' : 'hidden',
            )}
          >
            <WorldMap active={tab === 'world'} className="h-full" />
          </div>

          <div
            className={cn(
              'mx-auto h-full max-w-4xl',
              tab === 'market' ? 'block' : 'hidden',
            )}
          >
            <MarketPanel className="h-full" />
          </div>

          <div
            className={cn(
              'mx-auto h-full max-w-3xl',
              tab === 'exchange' ? 'block' : 'hidden',
            )}
          >
            <ExchangeTab />
          </div>

          <div
            className={cn(
              'mx-auto h-full max-w-3xl',
              tab === 'nation' ? 'block' : 'hidden',
            )}
          >
            <NationTab />
          </div>

          <div
            className={cn(
              'mx-auto h-full max-w-3xl',
              tab === 'bots' ? 'block' : 'hidden',
            )}
          >
            <BotTab />
          </div>

          <div
            className={cn(
              'mx-auto h-full max-w-3xl',
              tab === 'ranks' ? 'block' : 'hidden',
            )}
          >
            <Leaderboard className="h-full" />
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
