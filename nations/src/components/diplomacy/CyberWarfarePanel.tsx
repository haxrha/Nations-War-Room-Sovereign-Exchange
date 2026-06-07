import { useState } from 'react'
import { Zap, ShieldAlert, Eye, TrendingDown, Factory } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { formatMoney, getCountry, getCommodity, idStr } from '../../lib/utils'
import { Panel } from '../ui/Panel'
import { Button, Select } from '../ui/Button'
import { cn } from '../../lib/cn'

const ATTACK_TYPES = [
  {
    id: 'infrastructure',
    label: 'Infrastructure Strike',
    icon: Factory,
    description: 'Reduce target production by 35%',
    color: 'text-orange-400',
  },
  {
    id: 'disrupt_trade',
    label: 'Trade Disruption',
    icon: TrendingDown,
    description: 'Cancel all open offers from target',
    color: 'text-red-400',
  },
  {
    id: 'leak_info',
    label: 'Intelligence Leak',
    icon: Eye,
    description: 'Expose target treasury & inventory',
    color: 'text-purple-400',
  },
  {
    id: 'market_manipulation',
    label: 'Market Manipulation',
    icon: Zap,
    description: 'Spike or crash a commodity ±27%',
    color: 'text-yellow-400',
  },
] as const

type AttackTypeId = typeof ATTACK_TYPES[number]['id']

export function CyberWarfarePanel({ className }: { className?: string }) {
  const {
    playerCountryId,
    countries,
    commodities,
    cyberAttacks,
    launchCyberAttack,
    playerCountry,
    connected,
  } = useGame()

  const [targetId, setTargetId] = useState('')
  const [attackType, setAttackType] = useState<AttackTypeId>('infrastructure')
  const [targetCommodityId, setTargetCommodityId] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [launching, setLaunching] = useState(false)
  const [lastResult, setLastResult] = useState<{ status: string; desc: string } | null>(null)

  const targets = countries.filter((c) => c.id !== playerCountryId)
  const canAfford = (playerCountry?.balance ?? 0) >= 5_000

  const myAttacks = playerCountryId
    ? [...cyberAttacks]
        .filter((a) => a.attackerId === playerCountryId || a.targetId === playerCountryId)
        .sort((a, b) =>
          Number(b.executedAt.microsSinceUnixEpoch - a.executedAt.microsSinceUnixEpoch),
        )
        .slice(0, 10)
    : []

  const attacksAgainstMe = myAttacks.filter((a) => a.targetId === playerCountryId)
  const attacksILaunched = myAttacks.filter((a) => a.attackerId === playerCountryId)

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetId || !attackType) return
    setLocalError(null)
    setLastResult(null)
    setLaunching(true)
    try {
      const commodityIdBig =
        attackType === 'market_manipulation' && targetCommodityId
          ? BigInt(targetCommodityId)
          : 0n
      await launchCyberAttack(BigInt(targetId), attackType, commodityIdBig)
      // Read result from cyberAttacks subscription (latest row for this target)
      setLastResult({ status: 'sent', desc: 'Operation launched. Awaiting confirmation…' })
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Launch failed')
    } finally {
      setLaunching(false)
    }
  }

  return (
    <Panel
      title="Cyber Warfare"
      subtitle="Each operation costs $5,000 · 35% detection chance"
      label="Cyber"
      spotlight
      className={cn('h-full min-h-0', className)}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="scroll-subtle min-h-0 flex-1 overflow-y-auto p-4 space-y-5">

          {/* Incoming attacks */}
          {attacksAgainstMe.length > 0 && (
            <section>
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-red-400 mb-2">
                Attacks against you
              </h3>
              {attacksAgainstMe.map((a) => {
                const attacker = getCountry(a.attackerId, countries)
                const typeInfo = ATTACK_TYPES.find((t) => t.id === a.attackType)
                return (
                  <AttackRow
                    key={idStr(a.id)}
                    flag={attacker?.flag ?? '?'}
                    name={attacker?.name ?? 'Unknown'}
                    type={typeInfo?.label ?? a.attackType}
                    status={a.status}
                    effect={a.effectDescription}
                    incoming
                  />
                )
              })}
            </section>
          )}

          {/* Ops I launched */}
          <section>
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#8A8F98] mb-2">
              Operations launched
            </h3>
            {attacksILaunched.length === 0 ? (
              <p className="text-xs text-[#8A8F98]">No operations launched yet.</p>
            ) : (
              attacksILaunched.map((a) => {
                const target = getCountry(a.targetId, countries)
                const typeInfo = ATTACK_TYPES.find((t) => t.id === a.attackType)
                return (
                  <AttackRow
                    key={idStr(a.id)}
                    flag={target?.flag ?? '?'}
                    name={target?.name ?? 'Unknown'}
                    type={typeInfo?.label ?? a.attackType}
                    status={a.status}
                    effect={a.effectDescription}
                  />
                )
              })
            )}
          </section>

          {/* Cost info */}
          <div className="rounded-lg border border-[#5E6AD2]/20 bg-[#5E6AD2]/5 p-3 text-xs text-[#8A8F98] space-y-1">
            <div className="font-medium text-[#EDEDEF]">Operation rules</div>
            <div>· Cost: {formatMoney(5_000)} per operation (charged win or lose)</div>
            <div>· Detection: 35% chance — failed ops trigger retaliatory sanctions</div>
            <div>· Infrastructure: reduces target production rate permanently until they rebuild</div>
            <div>· Market manipulation: affects global spot price for all players</div>
          </div>
        </div>

        {/* Launch form */}
        <form
          onSubmit={handleLaunch}
          className="shrink-0 space-y-3 border-t border-white/[0.06] bg-[#050506]/60 p-4 backdrop-blur-sm"
        >
          <div className="font-mono text-[10px] uppercase tracking-widest text-[#8A8F98]">
            Launch operation
          </div>

          <Select value={targetId} onChange={(e) => setTargetId(e.target.value)} required>
            <option value="">Select target…</option>
            {targets.filter((c) => c.isBot).length > 0 && (
              <optgroup label="AI nations">
                {targets
                  .filter((c) => c.isBot)
                  .map((c) => (
                    <option key={idStr(c.id)} value={idStr(c.id)}>
                      {c.flag} {c.name} (AI)
                    </option>
                  ))}
              </optgroup>
            )}
            {targets.filter((c) => !c.isBot).length > 0 && (
              <optgroup label="Human nations">
                {targets
                  .filter((c) => !c.isBot)
                  .map((c) => (
                    <option key={idStr(c.id)} value={idStr(c.id)}>
                      {c.flag} {c.name}
                    </option>
                  ))}
              </optgroup>
            )}
          </Select>

          <div className="grid grid-cols-2 gap-2">
            {ATTACK_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setAttackType(t.id)}
                className={cn(
                  'flex flex-col items-start gap-1 rounded-lg border p-2.5 text-left transition-all',
                  attackType === t.id
                    ? 'border-[#5E6AD2]/50 bg-[#5E6AD2]/10'
                    : 'border-white/[0.06] bg-white/[0.02] hover:border-white/10',
                )}
              >
                <t.icon className={cn('h-3.5 w-3.5', t.color)} />
                <span className="text-[10px] font-medium text-[#EDEDEF]">{t.label}</span>
                <span className="text-[9px] text-[#64748b]">{t.description}</span>
              </button>
            ))}
          </div>

          {attackType === 'market_manipulation' && (
            <Select
              value={targetCommodityId}
              onChange={(e) => setTargetCommodityId(e.target.value)}
              required
            >
              <option value="">Select commodity to manipulate…</option>
              {commodities.map((c) => (
                <option key={idStr(c.id)} value={idStr(c.id)}>
                  {c.symbol} — {c.name}
                </option>
              ))}
            </Select>
          )}

          {!canAfford && (
            <p className="text-xs text-amber-400">Insufficient funds — need $5,000</p>
          )}
          {localError && <p className="text-xs text-red-400">{localError}</p>}
          {lastResult && (
            <p className="text-xs text-emerald-400">{lastResult.desc}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={!connected || !canAfford || !targetId || launching}
          >
            <ShieldAlert className="h-4 w-4" />
            {launching ? 'Launching…' : 'Launch operation'}
          </Button>
        </form>
      </div>
    </Panel>
  )
}

function AttackRow({
  flag,
  name,
  type,
  status,
  effect,
  incoming = false,
}: {
  flag: string
  name: string
  type: string
  status: string
  effect: string
  incoming?: boolean
}) {
  const isDetected = status === 'detected'
  return (
    <div
      className={cn(
        'mb-2 rounded-lg border p-3 text-xs',
        incoming
          ? 'border-red-500/20 bg-red-500/5'
          : isDetected
          ? 'border-amber-500/20 bg-amber-500/5'
          : 'border-emerald-500/15 bg-emerald-500/4',
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-[#EDEDEF]">
          {flag} {name}
        </span>
        <span
          className={cn(
            'font-mono text-[9px] uppercase tracking-wider',
            isDetected ? 'text-amber-400' : incoming ? 'text-red-400' : 'text-emerald-400',
          )}
        >
          {incoming ? (isDetected ? 'DETECTED' : 'HIT') : isDetected ? 'DETECTED' : 'SUCCESS'}
        </span>
      </div>
      <div className="text-[#64748b]">{type}</div>
      <div className="mt-1 text-[#8A8F98]">{effect}</div>
    </div>
  )
}
