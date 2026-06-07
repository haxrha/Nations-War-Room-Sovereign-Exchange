# Nations — Sovereign Trade Exchange

A real-time multiplayer trading simulation built on [SpacetimeDB](https://spacetimedb.com). Players control nations, trade commodities, manage diplomacy, and compete on a live global market — all backed by a strongly-consistent server-side game loop with AI bot opponents.

---

## Project Structure

```
SpacetimeDB/
├── run.sh                    # One-command launcher (backend + frontend)
├── nations/
│   ├── spacetimedb/          # SpacetimeDB server module (TypeScript)
│   │   └── src/
│   │       ├── schema.ts     # Tables: countries, offers, trades, prices, …
│   │       ├── reducers.ts   # place_offer, accept_trade, diplomacy actions
│   │       ├── bots.ts       # AI nation logic and strategies
│   │       ├── sanctions.ts  # Sanction / embargo system
│   │       ├── init.ts       # World seed (commodities, bot nations, prices)
│   │       └── lib/          # Tick handlers, price drift, helpers
│   └── src/                  # React + Vite frontend (TypeScript)
│       ├── App.tsx
│       ├── module_bindings/  # Auto-generated SpacetimeDB client bindings
│       ├── components/       # UI: map, market, diplomacy, trading, news, …
│       ├── bots/             # Client-side bot worker (Web Worker)
│       ├── context/          # React context providers
│       ├── hooks/            # Custom React hooks
│       └── data/             # Static reference data
```

---

## Prerequisites

| Tool | Install |
|------|---------|
| **Node.js 18+** | [nodejs.org](https://nodejs.org) |
| **SpacetimeDB CLI** | `curl -sSf https://install.spacetimedb.com \| sh` |

After installing the SpacetimeDB CLI, **restart your terminal** (or `source` the path the installer prints) so `spacetime` is on your `PATH`. Verify with:

```bash
spacetime version
```

---

## Running the Project

### Full stack (recommended)

```bash
./run.sh
```

This single command:
1. Starts a local SpacetimeDB server on `ws://127.0.0.1:3000`
2. Installs and publishes the server module as the `nations` database
3. Seeds the world (`init` reducer — safe to re-run, skipped if already done)
4. Installs frontend dependencies and starts the Vite dev server

Open **http://localhost:5173** in your browser.

### Backend only

```bash
./run.sh backend
# or: npm run dev:backend
```

Starts SpacetimeDB, publishes the module, and keeps the server running. Use this if you want to run the frontend separately or inspect the database directly.

### Frontend only

```bash
./run.sh frontend
# or: npm run dev:frontend
```

Assumes the backend is already running. Starts the Vite dev server at http://localhost:5173.

---

## Environment Variables

The script creates `nations/.env` from `nations/.env.example` on first run. You can also create `nations/.env.local` to override values locally (not committed to git).

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_SPACETIME_HOST` | `ws://127.0.0.1:3000` | WebSocket URL for the local SpacetimeDB server |
| `VITE_SPACETIME_DB` | `nations` | Database / module name |
| `GEMINI_API_KEY` | *(empty)* | Google Gemini API key — **optional**, enables AI-powered features in the UI |

To get a Gemini API key: [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) (free tier available). Add it to `nations/.env.local`:

```
GEMINI_API_KEY=your_key_here
```

---

## How It Works

The game loop runs entirely inside the SpacetimeDB module:

- **`init`** — Seeds commodities, bot nations, and spot prices on first launch
- **`price_tick`** (every 5s) — Supply/demand price drift across all commodities
- **`bot_tick`** (every 10s) — AI nations produce goods and execute trade strategies
- **`place_offer`** — Player deducts stock and posts an open trade offer
- **`accept_trade`** — Atomic transfer between two nations, recorded in trade history
- **Connect** — Automatically creates a player `country` row on first connection

The React frontend subscribes to SpacetimeDB tables in real time via WebSocket — no polling, no REST API. All game state (prices, offers, trades, sanctions, diplomacy) updates live across all connected clients.

---

## Useful CLI Commands

```bash
# Inspect live tables
spacetime sql local nations "SELECT * FROM country"
spacetime sql local nations "SELECT * FROM offer"

# Manually call a reducer
spacetime call local nations init

# Re-publish after server-side changes
cd nations/spacetimedb
spacetime publish --server local --module-path . nations -y
```
