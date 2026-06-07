import { useRef } from 'react'
import Editor from '@monaco-editor/react'
import { Bot, Play, Square, Save, Upload } from 'lucide-react'
import { useBot } from '../../context/BotContext'
import { useGame } from '../../context/GameContext'
import { BOT_SAMPLES } from '../../bots/samples'
import { formatMoney } from '../../lib/utils'
import { Panel, StatPill } from '../ui/Panel'
import { Button } from '../ui/Button'
import { cn } from '../../lib/cn'

export function BotStrategyPanel({ className }: { className?: string }) {
  const { connected, playerCountry, error: gameError } = useGame()
  const {
    code,
    setCode,
    saveCode,
    enabled,
    setEnabled,
    status,
    sessionStats,
    runOnce,
  } = useBot()
  const fileRef = useRef<HTMLInputElement>(null)

  const pnl =
    status.startingGdp != null && playerCountry
      ? playerCountry.gdpScore - status.startingGdp
      : 0

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCode(String(reader.result ?? ''))
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <Panel
      title="Trading bot"
      subtitle="Runs in a sandboxed Web Worker — same reducers as humans"
      label="Strategy"
      spotlight
      className={cn('h-full min-h-0', className)}
      headerExtra={
        <Button
          variant={enabled ? 'danger' : 'primary'}
          size="sm"
          onClick={() => setEnabled(!enabled)}
          disabled={!connected || !playerCountry}
        >
          {enabled ? (
            <>
              <Square className="h-3 w-3" /> Stop
            </>
          ) : (
            <>
              <Play className="h-3 w-3" /> Run
            </>
          )}
        </Button>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="grid shrink-0 grid-cols-2 gap-2 p-4 md:grid-cols-4">
          <StatPill
            label="Status"
            value={enabled ? 'Running' : 'Idle'}
            hint={status.lastAction ?? '—'}
          />
          <StatPill label="Actions" value={String(status.actionsThisSession)} />
          <StatPill
            label="Session P&L"
            value={formatMoney(pnl, true)}
            hint={
              status.startingGdp != null
                ? `from ${formatMoney(status.startingGdp, true)} GDP`
                : undefined
            }
          />
          <StatPill
            label="Last tick"
            value={
              status.lastTickAt
                ? new Date(status.lastTickAt).toLocaleTimeString()
                : '—'
            }
          />
        </div>

        {(status.lastError || gameError) && (
          <div className="shrink-0 border-y border-red-500/20 bg-red-500/5 px-4 py-2 text-xs text-red-400">
            {status.lastError ?? gameError}
          </div>
        )}

        <div className="flex shrink-0 flex-wrap gap-2 border-b border-white/[0.06] px-4 py-2">
          <span className="font-mono-label w-full text-[10px] uppercase tracking-widest text-[#8A8F98]">
            Sample strategies
          </span>
          {BOT_SAMPLES.map((sample) => (
            <Button
              key={sample.id}
              variant="ghost"
              size="sm"
              onClick={() => setCode(sample.code)}
              title={sample.description}
            >
              {sample.name}
            </Button>
          ))}
          <Button variant="secondary" size="sm" onClick={() => saveCode()}>
            <Save className="h-3 w-3" /> Save
          </Button>
          <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="h-3 w-3" /> Upload .js
          </Button>
          <input ref={fileRef} type="file" accept=".js,.ts,.txt" className="hidden" onChange={handleFile} />
          <Button variant="secondary" size="sm" onClick={runOnce} disabled={!connected}>
            <Bot className="h-3 w-3" /> Run once
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden p-4">
          <div className="h-full min-h-[220px] overflow-hidden rounded-lg border border-[#1a9e75]/15">
            <Editor
              height="100%"
              language="javascript"
              theme="vs-dark"
              value={code}
              onChange={(v) => setCode(v ?? '')}
              options={{
                minimap: { enabled: false },
                fontSize: 12,
                fontFamily: 'ui-monospace, SF Mono, monospace',
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                padding: { top: 12 },
              }}
            />
          </div>
          <p className="mt-2 text-[10px] text-[#64748b]">
            Define <code className="text-[#2dd4bf]">function myBot(gameState)</code> returning an
            action or <code className="text-[#2dd4bf]">null</code>. Tick every 5s.
          </p>
        </div>

        <div className="shrink-0 border-t border-white/[0.06] p-4">
          <h3 className="font-mono-label mb-2 text-[10px] uppercase tracking-widest text-[#8A8F98]">
            Bot leaderboard (this browser session)
          </h3>
          {sessionStats.length === 0 ? (
            <p className="text-xs text-[#8A8F98]">Run your bot to record session stats.</p>
          ) : (
            <ul className="space-y-1.5">
              {sessionStats.map((entry, i) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs"
                >
                  <span>
                    #{i + 1} {entry.name} · {entry.actions} actions
                  </span>
                  <span className={entry.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {formatMoney(entry.pnl, true)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Panel>
  )
}
