import { useState } from 'react'
import { Handshake, UserMinus, Check } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { getCountry, idStr } from '../../lib/utils'
import { Panel } from '../ui/Panel'
import { Button, Select } from '../ui/Button'
import { cn } from '../../lib/cn'

export function AlliancesPanel({ className }: { className?: string }) {
  const {
    playerCountryId,
    countries,
    alliances,
    activeAlliances,
    proposeAlliance,
    acceptAlliance,
    leaveAlliance,
    connected,
    error,
  } = useGame()

  const [partnerId, setPartnerId] = useState('')

  const eligible = countries.filter((c) => c.id !== playerCountryId)

  const myAlliances = playerCountryId
    ? alliances.filter(
        (a) =>
          (a.proposerId === playerCountryId || a.partnerId === playerCountryId) &&
          (a.status === 'active' || a.status === 'pending'),
      )
    : []

  const incoming = myAlliances.filter(
    (a) => a.status === 'pending' && a.partnerId === playerCountryId,
  )
  const outgoing = myAlliances.filter(
    (a) => a.status === 'pending' && a.proposerId === playerCountryId,
  )
  const active = myAlliances.filter((a) => a.status === 'active')

  const alliedIds = new Set(
    activeAlliances.flatMap((a) =>
      playerCountryId
        ? a.proposerId === playerCountryId
          ? [a.partnerId]
          : a.partnerId === playerCountryId
          ? [a.proposerId]
          : []
        : [],
    ),
  )

  const pendingIds = new Set(
    myAlliances
      .filter((a) => a.status === 'pending')
      .flatMap((a) => [a.proposerId, a.partnerId]),
  )

  const availableTargets = eligible.filter(
    (c) => !alliedIds.has(c.id) && !pendingIds.has(c.id),
  )

  const handlePropose = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!partnerId) return
    await proposeAlliance(BigInt(partnerId))
    setPartnerId('')
  }

  return (
    <Panel
      title="Alliances"
      subtitle="Allied trades earn both parties a 5% bonus on every deal"
      label="Alliances"
      spotlight
      className={cn('h-full min-h-0', className)}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="scroll-subtle min-h-0 flex-1 overflow-y-auto p-4 space-y-5">

          {/* Incoming proposals */}
          {incoming.length > 0 && (
            <section>
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-amber-400 mb-2">
                Incoming proposals ({incoming.length})
              </h3>
              {incoming.map((a) => {
                const proposer = getCountry(a.proposerId, countries)
                return (
                  <div
                    key={idStr(a.id)}
                    className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-amber-500/25 bg-amber-500/8 p-3"
                  >
                    <div className="text-sm">
                      <span className="font-medium text-[#EDEDEF]">
                        {proposer?.flag} {proposer?.name}
                      </span>
                      <span className="ml-2 text-[10px] text-amber-400">wants an alliance</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => acceptAlliance(a.id)}
                        disabled={!connected}
                        className="text-emerald-400 hover:text-emerald-300"
                      >
                        <Check className="h-3 w-3" /> Accept
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => leaveAlliance(a.id)}
                        disabled={!connected}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                )
              })}
            </section>
          )}

          {/* Active alliances */}
          <section>
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#8A8F98] mb-2">
              Active alliances ({active.length})
            </h3>
            {active.length === 0 ? (
              <p className="text-xs text-[#8A8F98]">No active alliances — propose one below.</p>
            ) : (
              active.map((a) => {
                const ally = getCountry(
                  a.proposerId === playerCountryId ? a.partnerId : a.proposerId,
                  countries,
                )
                return (
                  <div
                    key={idStr(a.id)}
                    className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3"
                  >
                    <div>
                      <div className="text-sm font-medium text-[#EDEDEF]">
                        {ally?.flag} {ally?.name}
                        {ally?.isBot && (
                          <span className="ml-1 font-mono text-[9px] text-[#64748b]">AI</span>
                        )}
                      </div>
                      <div className="text-[10px] text-emerald-400 mt-0.5">
                        +5% bonus on every mutual trade
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => leaveAlliance(a.id)}
                      disabled={!connected}
                      className="text-[#64748b] hover:text-red-400"
                    >
                      <UserMinus className="h-3 w-3" /> Leave
                    </Button>
                  </div>
                )
              })
            )}
          </section>

          {/* Outgoing pending */}
          {outgoing.length > 0 && (
            <section>
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#8A8F98] mb-2">
                Awaiting response
              </h3>
              {outgoing.map((a) => {
                const partner = getCountry(a.partnerId, countries)
                return (
                  <div
                    key={idStr(a.id)}
                    className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-sm"
                  >
                    <span className="text-[#8A8F98]">
                      {partner?.flag} {partner?.name} — proposal sent
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => leaveAlliance(a.id)}
                      disabled={!connected}
                    >
                      Cancel
                    </Button>
                  </div>
                )
              })}
            </section>
          )}

          {/* Bonus info card */}
          <div className="rounded-lg border border-[#5E6AD2]/20 bg-[#5E6AD2]/5 p-3 text-xs text-[#8A8F98] space-y-1">
            <div className="font-medium text-[#EDEDEF]">Alliance benefits</div>
            <div>· +5% trade rebate credited to <em>both</em> parties on every allied transaction</div>
            <div>· Bot nations auto-accept alliance proposals</div>
            <div>· Either party can dissolve the alliance at any time</div>
          </div>
        </div>

        <form
          onSubmit={handlePropose}
          className="shrink-0 space-y-3 border-t border-white/[0.06] bg-[#050506]/60 p-4 backdrop-blur-sm"
        >
          <div className="font-mono text-[10px] uppercase tracking-widest text-[#8A8F98]">
            Propose alliance
          </div>
          <Select value={partnerId} onChange={(e) => setPartnerId(e.target.value)} required>
            <option value="">Select nation…</option>
            {availableTargets.filter((c) => c.isBot).length > 0 && (
              <optgroup label="AI nations">
                {availableTargets
                  .filter((c) => c.isBot)
                  .map((c) => (
                    <option key={idStr(c.id)} value={idStr(c.id)}>
                      {c.flag} {c.name} (AI)
                    </option>
                  ))}
              </optgroup>
            )}
            {availableTargets.filter((c) => !c.isBot).length > 0 && (
              <optgroup label="Human nations">
                {availableTargets
                  .filter((c) => !c.isBot)
                  .map((c) => (
                    <option key={idStr(c.id)} value={idStr(c.id)}>
                      {c.flag} {c.name}
                    </option>
                  ))}
              </optgroup>
            )}
          </Select>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <Button
            type="submit"
            className="w-full"
            disabled={!connected || !partnerId}
          >
            <Handshake className="h-4 w-4" />
            Propose alliance
          </Button>
        </form>
      </div>
    </Panel>
  )
}
