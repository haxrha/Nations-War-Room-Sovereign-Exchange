import { cn } from '../../lib/cn'

export function AmbientBackground({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none fixed inset-0 z-0 overflow-hidden', className)} aria-hidden="true">
      <div
        className="animate-float-blob absolute -top-[20%] left-1/2 h-[900px] w-[1400px] -translate-x-1/2 rounded-full blur-[150px]"
        style={{ background: 'rgba(94, 106, 210, 0.25)' }}
      />
      <div
        className="animate-float-blob-alt absolute top-[30%] -left-[10%] h-[600px] w-[800px] rounded-full blur-[120px]"
        style={{ background: 'rgba(139, 92, 246, 0.15)' }}
      />
      <div
        className="animate-float-blob absolute top-[20%] -right-[5%] h-[500px] w-[700px] rounded-full blur-[100px]"
        style={{ background: 'rgba(99, 102, 241, 0.12)' }}
      />
      <div
        className="animate-pulse-glow absolute bottom-0 left-1/2 h-[400px] w-[800px] -translate-x-1/2 rounded-full blur-[120px]"
        style={{ background: 'rgba(94, 106, 210, 0.1)' }}
      />
      <div className="grid-overlay absolute inset-0" />
    </div>
  )
}

export function ConnectionBanner({
  connected,
  connecting,
}: {
  connected: boolean
  connecting: boolean
}) {
  if (connected) return null

  return (
    <div className="relative z-50 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-200">
      {connecting
        ? 'Connecting to SpacetimeDB…'
        : 'Offline — start the local server with spacetime start and publish the nations module'}
    </div>
  )
}
