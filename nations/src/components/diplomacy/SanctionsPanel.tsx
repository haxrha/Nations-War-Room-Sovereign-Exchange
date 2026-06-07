import { useState } from 'react'
import { ShieldBan, ShieldOff } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { botStrategyLabel, getCommodity, getCountry, idStr } from '../../lib/utils'
import { Panel } from '../ui/Panel'
import { Button, Input, Select } from '../ui/Button'
import { cn } from '../../lib/cn'

export function SanctionsPanel({ className }: { className?: string }) {
  const {
    playerCountryId,
    countries,
    commodities,
    activeSanctions,
    imposeSanction,
    liftSanction,
    connected,
    error,
  } = useGame()

  const sanctionTargets = countries.filter((c) => c.id !== playerCountryId)
  const botTargets = sanctionTargets.filter((c) => c.isBot)
  const humanTargets = sanctionTargets.filter((c) => !c.isBot)
  const onlineHumanTargets = humanTargets.filter((c) => c.online)

  const [targetId, setTargetId] = useState('')
  const [commodityId, setCommodityId] = useState('0')
  const [reason, setReason] = useState('')

  const mySanctions = playerCountryId
    ? activeSanctions.filter((s) => s.issuerCountryId === playerCountryId)
    : []

  const sanctionsAgainstMe = playerCountryId
    ? activeSanctions.filter((s) => s.targetCountryId === playerCountryId)
    : []

  const handleImpose = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetId || !reason.trim()) return
    await imposeSanction(BigInt(targetId), BigInt(commodityId), reason.trim())
    setReason('')
  }

  return (
    <Panel
      title="Diplomacy & Sanctions"
      subtitle="Block trade with AI nations or other human players"
      label="Sanctions"
      spotlight
      className={cn('h-full min-h-0', className)}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="scroll-subtle min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
          <section>
            <h3 className="font-mono-label mb-2 text-[10px] uppercase tracking-widest text-[#8A8F98]">
              AI nations ({botTargets.length})
            </h3>
            {botTargets.length === 0 ? (
              <p className="text-xs text-[#8A8F98]">No bot nations available.</p>
            ) : (
              <ul className="space-y-1.5">
                {botTargets.map((c) => (
                  <li
                    key={idStr(c.id)}
                    className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm"
                  >
                    <span>
                      {c.flag} {c.name}{' '}
                      <span className="text-[#8A8F98]">{botStrategyLabel(c.botStrategy)}</span>
                    </span>
                    <button
                      type="button"
                      className="font-mono text-[10px] text-[#64748b] hover:text-[#2dd4bf]"
                      onClick={() => setTargetId(idStr(c.id))}
                    >
                      Select
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="font-mono-label mb-2 text-[10px] uppercase tracking-widest text-[#8A8F98]">
              Human players online
            </h3>
            {onlineHumanTargets.length === 0 ? (
              <p className="text-xs text-[#8A8F98]">
                No other human nations online — open another browser window to join.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {onlineHumanTargets.map((c) => (
                  <li
                    key={idStr(c.id)}
                    className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm"
                  >
                    <span>
                      {c.flag} {c.name}{' '}
                      <span className="text-[#8A8F98]">{c.isoCode}</span>
                    </span>
                    <span className="text-[10px] text-emerald-400">online</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {sanctionsAgainstMe.length > 0 && (
            <section>
              <h3 className="font-mono-label mb-2 text-[10px] uppercase tracking-widest text-red-400">
                Sanctions against you
              </h3>
              {sanctionsAgainstMe.map((s) => {
                const issuer = getCountry(s.issuerCountryId, countries)
                const comm =
                  s.commodityId === 0n
                    ? 'All commodities'
                    : getCommodity(s.commodityId, commodities)?.symbol ?? '?'
                return (
                  <div
                    key={idStr(s.id)}
                    className="mb-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs"
                  >
                    {issuer?.flag} {issuer?.name} · {comm} · {s.reason}
                  </div>
                )
              })}
            </section>
          )}

          <section>
            <h3 className="font-mono-label mb-2 text-[10px] uppercase tracking-widest text-[#8A8F98]">
              Your sanctions
            </h3>
            {mySanctions.length === 0 ? (
              <p className="text-xs text-[#8A8F98]">No active sanctions imposed.</p>
            ) : (
              mySanctions.map((s) => {
                const target = getCountry(s.targetCountryId, countries)
                const comm =
                  s.commodityId === 0n
                    ? 'All commodities'
                    : getCommodity(s.commodityId, commodities)?.symbol ?? '?'
                return (
                  <div
                    key={idStr(s.id)}
                    className="mb-2 flex items-start justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
                  >
                    <div className="text-xs">
                      <div className="font-medium text-[#EDEDEF]">
                        {target?.flag} {target?.name}
                        {target?.isBot && (
                          <span className="ml-1 font-mono text-[9px] text-[#64748b]">AI</span>
                        )}
                      </div>
                      <div className="text-[#8A8F98]">
                        {comm} · {s.reason}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => liftSanction(s.id)}
                      disabled={!connected}
                    >
                      <ShieldOff className="h-3 w-3" /> Lift
                    </Button>
                  </div>
                )
              })
            )}
          </section>
        </div>

        <form
          onSubmit={handleImpose}
          className="shrink-0 space-y-3 border-t border-white/[0.06] bg-[#050506]/60 p-4 backdrop-blur-sm"
        >
          <div className="font-mono-label text-[10px] uppercase tracking-widest text-[#8A8F98]">
            Impose sanction
          </div>
          <Select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            required
          >
            <option value="">Select nation…</option>
            {botTargets.length > 0 && (
              <optgroup label="AI nations">
                {botTargets.map((c) => (
                  <option key={idStr(c.id)} value={idStr(c.id)}>
                    {c.flag} {c.name} (AI)
                  </option>
                ))}
              </optgroup>
            )}
            {humanTargets.length > 0 && (
              <optgroup label="Human nations">
                {humanTargets.map((c) => (
                  <option key={idStr(c.id)} value={idStr(c.id)}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </optgroup>
            )}
          </Select>
          <Select value={commodityId} onChange={(e) => setCommodityId(e.target.value)}>
            <option value="0">All commodities (full embargo)</option>
            {commodities.map((c) => (
              <option key={idStr(c.id)} value={idStr(c.id)}>
                {c.symbol} only
              </option>
            ))}
          </Select>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (e.g. price manipulation)"
            required
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <Button
            type="submit"
            className="w-full"
            disabled={!connected || sanctionTargets.length === 0}
          >
            <ShieldBan className="h-4 w-4" />
            Impose sanction
          </Button>
        </form>
      </div>
    </Panel>
  )
}
