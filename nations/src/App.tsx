import { Header } from './components/layout/Header'
import { WorldMap } from './components/map/WorldMap'
import { MarketPanel } from './components/market/MarketPanel'
import { CountryDashboard } from './components/country/CountryDashboard'
import { TradeOffers, RecentTrades } from './components/trading/TradeOffers'
import { Leaderboard } from './components/leaderboard/Leaderboard'
import { FloatingDecorations, BackgroundWord } from './components/ui/Decorations'

function App() {
  return (
    <div className="app-shell relative flex h-full flex-col overflow-hidden">
      <FloatingDecorations className="z-0" />
      <BackgroundWord word="TRADE" className="-left-4 top-24 z-0 -rotate-12" />
      <BackgroundWord word="WIN" className="-right-8 bottom-32 z-0 rotate-6" />

      <div className="relative z-10 flex h-full flex-col">
        <Header />

        <main className="scroll-max grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-3 pattern-mesh md:p-4 lg:grid-cols-12 lg:grid-rows-[1fr_auto] lg:overflow-hidden">
          <section className="relative min-h-[320px] lg:col-span-5 lg:row-span-2 lg:min-h-0">
            <div className="pattern-stripes-orange pointer-events-none absolute inset-0 rounded-3xl opacity-30" aria-hidden="true" />
            <div className="relative h-full min-h-[320px] lg:min-h-0"><WorldMap /></div>
          </section>

          <section className="flex min-h-0 flex-col gap-4 lg:col-span-4 lg:row-span-2">
            <div className="min-h-[280px] flex-1 lg:min-h-0"><MarketPanel /></div>
            <div className="min-h-[360px] shrink-0 lg:min-h-[300px] lg:flex-1"><CountryDashboard /></div>
          </section>

          <section className="flex flex-col gap-4 lg:col-span-3 lg:row-span-2">
            <div className="relative min-h-[240px] flex-1 lg:translate-y-2"><TradeOffers /></div>
            <div className="relative min-h-[220px] shrink-0 lg:-translate-y-1"><Leaderboard /></div>
            <div className="relative h-[160px] shrink-0 lg:translate-y-1"><RecentTrades /></div>
          </section>
        </main>

        <footer className="relative z-10 shrink-0 border-t-4 border-dashed px-4 py-2 text-center"
          style={{ borderColor: '#7B2FFF', background: 'linear-gradient(90deg, rgba(123,47,255,0.15), rgba(255,58,242,0.15))' }}>
          <p className="font-heading text-[10px] font-black uppercase tracking-widest text-white/50">
            ✨ Nations MVP — sovereign trade vs bots · SpacetimeDB next ✨
          </p>
        </footer>
      </div>
    </div>
  )
}

export default App
