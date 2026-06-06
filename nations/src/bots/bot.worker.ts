import type { BotGameState, BotRunResult } from './types'

export type WorkerRequest = { code: string; state: BotGameState }
export type WorkerResponse = BotRunResult

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { code, state } = event.data
  try {
    const wrapped = `
      "use strict";
      ${code}
      const __fn = typeof myBot === "function" ? myBot
        : typeof strategy === "function" ? strategy
        : null;
      if (!__fn) throw new Error("Define function myBot(gameState) or strategy(gameState)");
      return __fn(state);
    `
    const runner = new Function('state', wrapped) as (s: BotGameState) => unknown
    const raw = runner(state)
    const response: WorkerResponse =
      raw == null ? { ok: true, action: null } : { ok: true, action: raw as never }
    self.postMessage(response)
  } catch (err) {
    const response: WorkerResponse = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
    self.postMessage(response)
  }
}
