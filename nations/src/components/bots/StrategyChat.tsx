import { useCallback, useEffect, useRef, useState } from 'react'
import { Bot, Loader2, Mic, MicOff, Send, Sparkles } from 'lucide-react'
import { useBot } from '../../context/BotContext'
import { useGame } from '../../context/GameContext'
import { useSpeechToText } from '../../hooks/useSpeechToText'
import { BOT_SAMPLES } from '../../bots/samples'
import { buildStrategyContext } from '../../lib/buildStrategyContext'
import { generateStrategy } from '../../lib/strategy-api'
import type { GeneratedStrategy, StrategyChatTurn } from '../../lib/strategy-api-types'
import { Button } from '../ui/Button'
import { cn } from '../../lib/cn'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  strategy?: GeneratedStrategy
  error?: string
  pending?: boolean
}

const CHAT_STORAGE_KEY = 'nations_strategy_chat'

const STARTER_PROMPTS = [
  'Buy commodities when they are 5% below spot price',
  'Hoard grain until I have 3000, then sell 10% above spot',
  'Only trade OIL — buy cheap offers, sell when holding over 800',
]

function loadChatHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as ChatMessage[]
  } catch {
    return []
  }
}

function saveChatHistory(messages: ChatMessage[]) {
  const trimmed = messages.filter((m) => !m.pending).slice(-40)
  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(trimmed))
}

export function StrategyChat({ className }: { className?: string }) {
  const game = useGame()
  const { code, setCode, saveCode } = useBot()
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = loadChatHistory()
    if (saved.length > 0) return saved
    return [
      {
        id: 'welcome',
        role: 'assistant',
        content:
          'Describe your trading strategy in plain English. I\'ll generate a myBot(gameState) function you can review and run in the editor.',
      },
    ]
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [includeContext, setIncludeContext] = useState(true)
  const [sampleId, setSampleId] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputBaseRef = useRef('')

  const appendTranscript = useCallback((text: string, isFinal: boolean) => {
    if (!text) return
    if (isFinal) {
      setInput((prev) => {
        const base = inputBaseRef.current || prev
        const merged = base ? `${base} ${text}`.trim() : text
        inputBaseRef.current = merged
        return merged
      })
    } else {
      setInput(() => {
        const base = inputBaseRef.current
        return base ? `${base} ${text}`.trim() : text
      })
    }
  }, [])

  const { listening, supported, error: speechError, toggle: toggleSpeech, stop: stopSpeech } =
    useSpeechToText(appendTranscript)

  useEffect(() => {
    if (!listening) inputBaseRef.current = input
  }, [listening, input])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    saveChatHistory(messages)
  }, [messages])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || loading) return

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: trimmed,
      }
      const pendingId = `a-${Date.now()}`
      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: pendingId, role: 'assistant', content: '', pending: true },
      ])
      setInput('')
      inputBaseRef.current = ''
      stopSpeech()
      setLoading(true)

      const chatHistory: StrategyChatTurn[] = [...messages, userMsg]
        .filter((m) => !m.pending && m.id !== 'welcome')
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content || m.strategy?.summary || '' }))

      const mode = trimmed.toLowerCase().startsWith('explain')
        ? 'explain'
        : code.trim()
          ? 'refine'
          : 'generate'

      const selectedSample = sampleId
        ? BOT_SAMPLES.find((s) => s.id === sampleId)
        : undefined

      try {
        const result = await generateStrategy({
          message: trimmed,
          mode,
          chatHistory,
          context: {
            currentCode: code.trim() || undefined,
            sampleId: sampleId || undefined,
            sampleCode: selectedSample?.code,
            gameSnapshot:
              includeContext && game.playerCountry ? buildStrategyContext(game) : null,
          },
        })

        if (!result.ok) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === pendingId
                ? {
                    ...m,
                    pending: false,
                    content: 'Could not generate a strategy.',
                    error: result.error.message,
                  }
                : m,
            ),
          )
          return
        }

        const { strategy, validation } = result
        const warnText =
          validation.warnings.length > 0
            ? `\n\nNote: ${validation.warnings.join('; ')}`
            : ''

        setMessages((prev) =>
          prev.map((m) =>
            m.id === pendingId
              ? {
                  ...m,
                  pending: false,
                  content: `${strategy.summary}${warnText}`,
                  strategy,
                }
              : m,
          ),
        )
      } catch (err) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === pendingId
              ? {
                  ...m,
                  pending: false,
                  content: 'Request failed.',
                  error: err instanceof Error ? err.message : String(err),
                }
              : m,
          ),
        )
      } finally {
        setLoading(false)
      }
    },
    [loading, messages, code, sampleId, includeContext, game, stopSpeech],
  )

  const applyStrategy = useCallback(
    (strategy: GeneratedStrategy) => {
      setCode(strategy.code)
      saveCode()
    },
    [setCode, saveCode],
  )

  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col rounded-xl border border-[#1a9e75]/15 bg-[#0a0e1a]/80',
        className,
      )}
    >
      <div className="shrink-0 border-b border-[#1a9e75]/15 px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#2dd4bf]" />
          <div>
            <h3 className="text-sm font-semibold text-[#f1f5f9]">Strategy assistant</h3>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#64748b]">
              Powered by Gemini
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <label className="flex items-center gap-1.5 font-mono text-[10px] text-[#94a3b8]">
            <input
              type="checkbox"
              checked={includeContext}
              onChange={(e) => setIncludeContext(e.target.checked)}
              className="rounded border-white/20"
            />
            Use my portfolio context
          </label>
          <select
            value={sampleId}
            onChange={(e) => setSampleId(e.target.value)}
            className="rounded border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] text-[#cbd5e1]"
          >
            <option value="">No sample seed</option>
            {BOT_SAMPLES.map((s) => (
              <option key={s.id} value={s.id}>
                Seed: {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div ref={scrollRef} className="scroll-subtle min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'max-w-[95%] rounded-lg px-3 py-2 text-xs leading-relaxed',
              msg.role === 'user'
                ? 'ml-auto bg-[#1a9e75]/20 text-[#e2e8f0]'
                : 'mr-auto border border-white/[0.06] bg-white/[0.03] text-[#cbd5e1]',
            )}
          >
            {msg.pending ? (
              <span className="inline-flex items-center gap-2 text-[#94a3b8]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Generating strategy…
              </span>
            ) : (
              <>
                {msg.strategy && (
                  <div className="mb-2 font-semibold text-[#2dd4bf]">{msg.strategy.name}</div>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.strategy?.risks.length ? (
                  <ul className="mt-2 space-y-0.5 text-[10px] text-amber-400/90">
                    {msg.strategy.risks.map((r) => (
                      <li key={r}>⚠ {r}</li>
                    ))}
                  </ul>
                ) : null}
                {msg.error && <p className="mt-2 text-[10px] text-red-400">{msg.error}</p>}
                {msg.strategy && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="primary" onClick={() => applyStrategy(msg.strategy!)}>
                      Apply to editor
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-[#1a9e75]/15 p-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={loading || !game.connected}
              onClick={() => sendMessage(prompt)}
              className="rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 font-mono text-[9px] text-[#94a3b8] transition-colors hover:border-[#2dd4bf]/30 hover:text-[#2dd4bf] disabled:opacity-40"
            >
              {prompt.length > 42 ? `${prompt.slice(0, 42)}…` : prompt}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void sendMessage(input)
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => {
              inputBaseRef.current = e.target.value
              setInput(e.target.value)
            }}
            placeholder={
              game.playerCountry
                ? listening
                  ? 'Listening…'
                  : 'Describe your strategy…'
                : 'Connect to the game first'
            }
            disabled={loading || !game.connected}
            className="min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-[#f1f5f9] placeholder:text-[#64748b] focus:border-[#2dd4bf]/40 focus:outline-none disabled:opacity-50"
          />
          <Button
            type="button"
            variant={listening ? 'primary' : 'secondary'}
            disabled={!supported || loading || !game.connected}
            onClick={toggleSpeech}
            title={
              supported
                ? listening
                  ? 'Stop dictation'
                  : 'Speech to text'
                : 'Speech recognition not supported in this browser'
            }
            aria-label={listening ? 'Stop dictation' : 'Start speech to text'}
            aria-pressed={listening}
          >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button type="submit" disabled={loading || !input.trim() || !game.connected}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
        {speechError && (
          <p className="mt-2 font-mono text-[9px] text-red-400">{speechError}</p>
        )}
        {!supported && (
          <p className="mt-2 font-mono text-[9px] text-[#64748b]">
            Speech-to-text works in Chrome and Edge. Use the mic button to dictate your strategy.
          </p>
        )}
        {!import.meta.env.DEV && (
          <p className="mt-2 flex items-center gap-1 font-mono text-[9px] text-[#64748b]">
            <Bot className="h-3 w-3" />
            Review generated code before running your bot.
          </p>
        )}
      </div>
    </div>
  )
}
