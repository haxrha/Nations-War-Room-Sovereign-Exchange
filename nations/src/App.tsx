import { Header } from './components/layout/Header'
import { WorldMap } from './components/map/WorldMap'
import { MarketPanel } from './components/market/MarketPanel'
import { CountryDashboard } from './components/country/CountryDashboard'
import { TradeOffers, RecentTrades } from './components/trading/TradeOffers'
import { Leaderboard } from './components/leaderboard/Leaderboard'
import { AmbientBackground, ConnectionBanner } from './components/ui/Decorations'
import { useGame } from './context/GameContext'

function App() {
  const { connected, connecting } = useGame()

  return (
    <div className="app-shell relative flex h-full flex-col overflow-hidden">
      <AmbientBackground />
      <ConnectionBanner connected={connected} connecting={connecting} />

      <div className="relative z-10 flex h-full flex-col">
        <Header />

        <main className="scroll-subtle grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 lg:grid-cols-12 lg:grid-rows-[minmax(0,1fr)_auto] lg:overflow-hidden lg:p-5">
          {/* Hero map — spans 5 cols, 2 rows on desktop */}
          <section className="min-h-[340px] lg:col-span-5 lg:row-span-2 lg:min-h-0">
            <WorldMap />
          </section>

          {/* Market — tall center column */}
          <section className="flex min-h-[300px] flex-col lg:col-span-4 lg:row-span-1 lg:min-h-0">
            <MarketPanel />
          </section>

          {/* Country dashboard — below market on desktop */}
          <section className="min-h-[400px] lg:col-span-4 lg:row-span-1 lg:min-h-0">
            <CountryDashboard />
          </section>

          {/* Right rail — asymmetric stack */}
          <section className="flex flex-col gap-4 lg:col-span-3 lg:row-span-2">
            <div className="min-h-[260px] flex-1 lg:min-h-0">
              <TradeOffers />
            </div>
            <div className="min-h-[220px] shrink-0 lg:min-h-[200px]">
              <Leaderboard />
            </div>
            <div className="h-[160px] shrink-0">
              <RecentTrades />
            </div>
          </section>
        </main>

        <footer className="relative z-10 shrink-0 border-t border-white/[0.06] px-4 py-3 text-center">
          <div className="section-divider mb-3" />
          <p className="font-mono-label text-[10px] uppercase tracking-widest text-[#8A8F98]">
            Nations · SpacetimeDB live backend ·{' '}
            <span className="gradient-text-accent">precision trade</span>
          </p>
        </footer>
      </div>
    </div>
  )
}

export default App
