import { useState } from 'react'
import { useGame } from '../../context/GameContext'
import { COMMODITY } from '../../lib/utils'
import type { OrderSide } from '../../types'

export function TradeForm() {
  const { state, selectedPortId, placeOrder } = useGame()
  const [side, setSide] = useState<OrderSide>('buy')
  const [qty, setQty] = useState('1000')
  const [price, setPrice] = useState('')

  const spot = state.spotPrices.find((s) => s.portId === selectedPortId)
  const port = state.ports.find((p) => p.id === selectedPortId)
  const defaultPrice = spot?.price ?? port?.basePrice ?? 100

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsedQty = parseInt(qty, 10)
    const parsedPrice = parseFloat(price || String(defaultPrice))
    if (parsedQty > 0 && parsedPrice > 0) {
      placeOrder(selectedPortId, parsedQty, parsedPrice, side)
      setQty('1000')
    }
  }

  return (
    <div className="panel overflow-hidden">
      <div className="panel-header">
        <span>Place Order</span>
        <span className="font-mono text-[10px] normal-case tracking-normal">
          {port?.name}
        </span>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3 p-3">
        <div className="grid grid-cols-2 gap-1 rounded border border-[var(--border)] bg-[var(--bg-elevated)] p-0.5">
          <button
            type="button"
            onClick={() => setSide('buy')}
            className={`rounded py-1.5 text-xs font-semibold transition-colors ${
              side === 'buy'
                ? 'bg-[var(--green)] text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            Buy
          </button>
          <button
            type="button"
            onClick={() => setSide('sell')}
            className={`rounded py-1.5 text-xs font-semibold transition-colors ${
              side === 'sell'
                ? 'bg-[var(--red)] text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            Sell
          </button>
        </div>

        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
            Quantity ({COMMODITY})
          </span>
          <input
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            min={100}
            step={100}
            className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--bg-deep)] px-2 py-1.5 font-mono text-sm outline-none focus:border-[var(--accent)]"
          />
        </label>

        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
            Limit Price
          </span>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={defaultPrice.toFixed(2)}
            min={1}
            step={0.5}
            className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--bg-deep)] px-2 py-1.5 font-mono text-sm outline-none focus:border-[var(--accent)]"
          />
        </label>

        <button
          type="submit"
          className={`w-full rounded py-2 text-xs font-semibold uppercase tracking-wider text-white transition-opacity hover:opacity-90 ${
            side === 'buy' ? 'bg-[var(--green)]' : 'bg-[var(--red)]'
          }`}
        >
          {side === 'buy' ? 'Place Bid' : 'Place Ask'}
        </button>
      </form>
    </div>
  )
}
