import { ScheduleAt } from 'spacetimedb';
import { SenderError } from 'spacetimedb/server';
import { spacetimedb } from './schema';
import { clearWorld, seedWorld } from './lib/seed-world';

export const init = spacetimedb.reducer({}, (ctx) => {
  const existing = ctx.db.meta.id.find(0);
  if (existing?.initialized) {
    throw new SenderError('World already initialized');
  }

  if (existing) {
    ctx.db.meta.id.update({ id: 0, initialized: true });
  } else {
    ctx.db.meta.insert({ id: 0, initialized: true });
  }

  seedWorld(ctx);
  console.info('Nations world initialized — scaled economy, bots, schedulers ready');
});

/** Wipes all game data and re-seeds bots/commodities. Humans must reconnect. */
export const reset_world = spacetimedb.reducer({}, (ctx) => {
  clearWorld(ctx);

  const meta = ctx.db.meta.id.find(0);
  if (meta) {
    ctx.db.meta.id.update({ id: 0, initialized: true });
  } else {
    ctx.db.meta.insert({ id: 0, initialized: true });
  }

  seedWorld(ctx);
  console.info('World reset — economy re-seeded at human scale');
});

export const reset_meta = spacetimedb.reducer({}, (ctx) => {
  const row = ctx.db.meta.id.find(0);
  if (row) ctx.db.meta.id.update({ ...row, initialized: false });
});
