import { Header } from './components/layout/Header'
import { WorldMap } from './components/map/WorldMap'
import { FleetPanel } from './components/fleet/FleetPanel'
import { Leaderboard, RecentTrades } from './components/leaderboard/Leaderboard'
import { PortDashboard } from './components/ports/PortDashboard'
import { OrderBook } from './components/trading/OrderBook'
import { PriceChart } from './components/trading/PriceChart'
import { TradeForm } from './components/trading/TradeForm'
import { GameProvider } from './context/GameContext'

function App() {
  return (
    <GameProvider>
      <div className="flex h-full flex-col">
        <Header />

        <main className="grid min-h-0 flex-1 grid-cols-1 gap-2 p-2 lg:grid-cols-12 lg:grid-rows-[1fr_auto]">
          {/* Left column: map + fleet */}
          <section className="flex min-h-[320px] flex-col gap-2 lg:col-span-5 lg:row-span-2 lg:min-h-0">
            <div className="min-h-[240px] flex-1 lg:min-h-0">
              <WorldMap />
            </div>
            <div className="h-[200px] shrink-0 lg:h-[220px]">
              <FleetPanel />
            </div>
          </section>

          {/* Center: trading terminal */}
          <section className="flex min-h-[280px] flex-col gap-2 lg:col-span-4 lg:row-span-2 lg:min-h-0">
            <PortDashboard />
            <div className="min-h-[200px] flex-1 lg:min-h-0">
              <OrderBook />
            </div>
            <div className="h-[160px] shrink-0">
              <PriceChart />
            </div>
          </section>

          {/* Right column: actions + leaderboard */}
          <section className="flex flex-col gap-2 lg:col-span-3 lg:row-span-2">
            <TradeForm />
            <div className="min-h-[160px] flex-1">
              <Leaderboard />
            </div>
            <div className="h-[180px] shrink-0">
              <RecentTrades />
            </div>
          </section>
        </main>

        <footer className="shrink-0 border-t border-[var(--border)] px-4 py-1.5 text-center text-[10px] text-[var(--text-muted)]">
          Portex MVP — mock simulation · SpacetimeDB integration coming next
        </footer>
      </div>
    </GameProvider>
  )
}

export default App
