# Nations — SpacetimeDB Module

Server-side module for the sovereign trade exchange. Implements the full game loop from the [SpacetimeDB docs](https://spacetimedb.com/docs/):

- **Connect** → auto-create player `country` row
- **`init`** → seed commodities, bot nations, spot prices, schedulers
- **`place_offer`** → deduct stock, publish open offer
- **`accept_trade`** → atomic transfer + trade history
- **`price_tick`** → supply/demand price drift every 5s
- **`bot_tick`** → production + AI strategies every 10s

## Prerequisites

1. Install the [SpacetimeDB CLI](https://spacetimedb.com/docs/)
2. Log in: `spacetime login`
3. Start local server: `spacetime start`

## Publish

From this directory:

```bash
npm install
spacetime publish nations -p . -s local
```

Or from the repo root with `spacetime dev` (recommended for local dev with client binding generation).

## Initialize the world

After first publish, seed the world **once**:

```bash
spacetime call nations init
```

## Reducers

| Reducer | Who calls | Purpose |
|---------|-----------|---------|
| `init` | Admin (CLI) | Seed commodities, 7 bot countries, schedulers |
| `on_connect` | SpacetimeDB (lifecycle) | Create player country on first connect |
| `on_disconnect` | SpacetimeDB (lifecycle) | Mark player offline |
| `set_country_profile` | Player | Set display name + ISO code |
| `place_offer` | Player | Sell commodity (stock escrowed) |
| `accept_trade` | Player | Buy from open offer |
| `cancel_offer` | Player | Cancel own offer, return stock |
| `price_tick` | Scheduler (5s) | Drift spot prices from order flow |
| `bot_tick` | Scheduler (10s) | Bot production + AI trading |

## Tables (all public except `meta`)

- `player` — maps SpacetimeDB identity → country (persistent login)
- `country` — players + bots, balance, GDP score, map coords
- `commodity` — Oil, Steel, Grain, Electronics, Rare Earths
- `spot_price` — one row per commodity, updated by scheduler
- `country_resource` — stockpile + production rate per country/commodity
- `trade_offer` — open sell orders (`status`: open | filled | cancelled)
- `trade_history` — completed trades for charts
- `price_tick_schedule` / `bot_tick_schedule` — internal schedulers

## Bot strategies

| Strategy | Behavior |
|----------|----------|
| `hoarder` | Saudi — floods cheap exports |
| `undercutter` | China, Brazil, Australia — lists below market |
| `protectionist` | Germany — premium pricing |
| `opportunist` | Japan, India — buys fair deals, moderate sells |

## Client subscriptions

```sql
SELECT * FROM country
SELECT * FROM trade_offer WHERE status = 'open'
SELECT * FROM spot_price
SELECT * FROM trade_history ORDER BY filled_at DESC LIMIT 100
SELECT * FROM country_resource
SELECT * FROM commodity
```

Generate TypeScript bindings after publish:

```bash
spacetime generate --lang typescript --out-dir ../src/module_bindings -p .
```

## Module layout

```
spacetimedb/src/
  index.ts      # entrypoint
  schema.ts     # tables, schema, scheduled tick reducers
  init.ts       # world seeding
  reducers.ts   # player actions + lifecycle
  bots.ts       # AI strategy implementations
  lib/
    tick-handlers.ts  # price_tick + bot_tick logic
    helpers.ts  # GDP, lookups, indexes
    trade.ts    # atomic trade execution
```
