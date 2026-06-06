import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useGame } from './GameContext'
import { buildBotSnapshot } from '../bots/buildSnapshot'
import {
  loadBotCode,
  loadBotSessionStats,
  saveBotCode,
  upsertBotSession,
} from '../bots/samples'
import type { BotAction, BotSessionEntry, BotStatus } from '../bots/types'
import { validateBotAction } from '../bots/validateAction'
import type { WorkerRequest, WorkerResponse } from '../bots/bot.worker'

const TICK_MS = 5000
const SESSION_ID = `bot-${Date.now()}`

interface BotContextValue {
  code: string
  setCode: (code: string) => void
  saveCode: () => void
  enabled: boolean
  setEnabled: (v: boolean) => void
  status: BotStatus
  sessionStats: BotSessionEntry[]
  runOnce: () => void
}

const BotContext = createContext<BotContextValue | null>(null)

function describeAction(action: BotAction | null): string {
  if (!action) return 'No action'
  if (action.action === 'accept') return `Accept offer #${action.offerId}`
  if (action.action === 'cancel') return `Cancel offer #${action.offerId}`
  return `Offer ${action.qty} @ $${action.pricePerUnit.toFixed(2)} (commodity ${action.commodityId})`
}

export function BotProvider({ children }: { children: ReactNode }) {
  const game = useGame()
  const [code, setCodeState] = useState(loadBotCode)
  const [enabled, setEnabled] = useState(false)
  const [sessionStats, setSessionStats] = useState(loadBotSessionStats)
  const [status, setStatus] = useState<BotStatus>({
    enabled: false,
    lastTickAt: null,
    lastAction: null,
    lastError: null,
    actionsThisSession: 0,
    startingGdp: null,
  })

  const tickRef = useRef(0)
  const workerRef = useRef<Worker | null>(null)
  const runningRef = useRef(false)
  const startingGdpRef = useRef<number | null>(null)
  const actionsRef = useRef(0)

  const setCode = useCallback((next: string) => setCodeState(next), [])

  const saveCode = useCallback(() => {
    saveBotCode(code)
  }, [code])

  const executeAction = useCallback(
    async (action: BotAction) => {
      if (action.action === 'accept') {
        await game.acceptOffer(BigInt(action.offerId))
      } else if (action.action === 'cancel') {
        await game.cancelOffer(BigInt(action.offerId))
      } else {
        await game.placeOffer(BigInt(action.commodityId), action.qty, action.pricePerUnit)
      }
    },
    [game],
  )

  const runTick = useCallback(async () => {
    if (!game.connected || !game.playerCountry || runningRef.current) return
    runningRef.current = true

    try {
      tickRef.current += 1
      const snapshot = buildBotSnapshot(game, tickRef.current)
      if (!snapshot) return

      if (!workerRef.current) {
        workerRef.current = new Worker(new URL('../bots/bot.worker.ts', import.meta.url), {
          type: 'module',
        })
      }

      const result = await new Promise<WorkerResponse>((resolve, reject) => {
        const worker = workerRef.current!
        const onMessage = (e: MessageEvent<WorkerResponse>) => {
          worker.removeEventListener('message', onMessage)
          worker.removeEventListener('error', onError)
          resolve(e.data)
        }
        const onError = (e: ErrorEvent) => {
          worker.removeEventListener('message', onMessage)
          worker.removeEventListener('error', onError)
          reject(new Error(e.message))
        }
        worker.addEventListener('message', onMessage)
        worker.addEventListener('error', onError)
        worker.postMessage({ code, state: snapshot } satisfies WorkerRequest)
      })

      const now = Date.now()

      if (!result.ok) {
        setStatus((s) => ({
          ...s,
          lastTickAt: now,
          lastError: result.error,
        }))
        return
      }

      let actionDesc = describeAction(result.action)

      if (result.action) {
        const check = validateBotAction(result.action, snapshot)
        if (!check.valid) {
          setStatus((s) => ({
            ...s,
            lastTickAt: now,
            lastError: check.error,
            lastAction: `Rejected: ${actionDesc}`,
          }))
          return
        }

        await executeAction(check.action)
        actionDesc = describeAction(check.action)

        if (startingGdpRef.current == null) {
          startingGdpRef.current = game.playerCountry!.gdpScore
        }
        actionsRef.current += 1
        const startingGdp = startingGdpRef.current
        const actions = actionsRef.current

        const entry: BotSessionEntry = {
          id: SESSION_ID,
          name: 'My strategy',
          actions,
          startingGdp,
          currentGdp: game.playerCountry!.gdpScore,
          pnl: game.playerCountry!.gdpScore - startingGdp,
          lastAction: actionDesc,
          updatedAt: now,
        }
        upsertBotSession(entry)
        setSessionStats(loadBotSessionStats())

        setStatus((s) => ({
          ...s,
          lastTickAt: now,
          lastAction: actionDesc,
          lastError: null,
          actionsThisSession: actions,
          startingGdp,
        }))
      } else {
        setStatus((s) => ({
          ...s,
          lastTickAt: now,
          lastAction: actionDesc,
          lastError: null,
        }))
      }
    } catch (err) {
      setStatus((s) => ({
        ...s,
        lastTickAt: Date.now(),
        lastError: err instanceof Error ? err.message : String(err),
      }))
    } finally {
      runningRef.current = false
    }
  }, [code, game, executeAction])

  const runOnce = useCallback(() => {
    void runTick()
  }, [runTick])

  useEffect(() => {
    if (!enabled) {
      setStatus((s) => ({ ...s, enabled: false }))
      return
    }

    if (game.playerCountry && startingGdpRef.current == null) {
      startingGdpRef.current = game.playerCountry.gdpScore
      actionsRef.current = 0
      setStatus((s) => ({
        ...s,
        enabled: true,
        startingGdp: game.playerCountry!.gdpScore,
        actionsThisSession: 0,
        lastError: null,
      }))
    } else {
      setStatus((s) => ({ ...s, enabled: true }))
    }

    void runTick()
    const id = setInterval(() => void runTick(), TICK_MS)
    return () => clearInterval(id)
  }, [enabled, game.playerCountry, runTick])

  useEffect(() => {
    return () => {
      workerRef.current?.terminate()
      workerRef.current = null
    }
  }, [])

  const value: BotContextValue = {
    code,
    setCode,
    saveCode,
    enabled,
    setEnabled,
    status,
    sessionStats,
    runOnce,
  }

  return <BotContext.Provider value={value}>{children}</BotContext.Provider>
}

export function useBot(): BotContextValue {
  const ctx = useContext(BotContext)
  if (!ctx) throw new Error('useBot must be used within BotProvider')
  return ctx
}
