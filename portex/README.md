# Portex — Global Freight Exchange

A hackathon MVP for a live multiplayer commodity-routing sim. Players route ships between real-world ports, trade iron ore on spot markets, and compete on arbitrage — all in a shared persistent world.

**This is the UI + mock simulation layer.** SpacetimeDB integration is the next step.

## Quick start

```bash
cd portex
npm install --cache ../.npm-cache   # if you hit npm cache permission issues
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Open a second browser window and switch the player dropdown to simulate multiplayer.

## Demo flow (for judges)

1. **Two windows side-by-side** — switch players in the header dropdown
2. **Place a bid** in window A → watch it appear in the order book in window B (mock state is in-memory per tab today; SpacetimeDB will sync across clients)
3. **Dispatch a ship** from the Fleet panel → watch the amber dot move along the route on the map
4. **Crossing orders auto-match** every ~4s — fills show in Recent Trades and shift the leaderboard

## What's built

| View | Description |
|------|-------------|
| **World Map** | Dark OSM tiles, port markers sized by congestion, ship positions interpolated along routes |
| **Order Book** | Live bids/asks per port with depth bars |
| **Price Chart** | Last 20 price ticks (recharts) |
| **Fleet Panel** | Dispatch ships, ETA progress bars |
| **Port Dashboard** | Spot price, congestion, incoming vessels |
| **Leaderboard** | Player balances ranked live |
| **Trade Form** | Place buy/sell limit orders |

## Mock reducers (client-side)

These mirror the planned SpacetimeDB reducers:

- `dispatch_ship` — creates a route, ship enters transit
- `place_order` / `cancel_order` — order book mutations
- `tick_prices` — every 8s, prices drift on order imbalance + congestion
- `match_orders` — every 4s, crossing bids/asks become contracts
- `tick_ship_arrivals` — every 2s, ships arrive at ETA, congestion updates

## Tech stack

- **React 19 + Vite + TypeScript**
- **Tailwind CSS v4**
- **react-leaflet** + Carto dark map tiles
- **recharts** for price history

## Next: SpacetimeDB module

Tables: `Port`, `Ship`, `Route`, `SpotPrice`, `Order`, `Contract`, `Player`

Reducers: `dispatch_ship`, `place_order`, `cancel_order`, scheduled `tick_prices`, `match_orders`, `tick_ship_arrivals`

Replace `GameContext` mock reducer with generated SDK bindings from the module.
