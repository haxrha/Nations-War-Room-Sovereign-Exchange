import { useEffect, useRef } from 'react'
import { cn } from '../../lib/cn'

const LAYERS = [
  { nodes: 4, label: 'Input' },
  { nodes: 6, label: 'Hidden·1' },
  { nodes: 6, label: 'Hidden·2' },
  { nodes: 3, label: 'Output' },
]

const ANCHOR_COLORS: Record<string, string> = {
  'ARIA-7': '#2dd4bf',
  NOVA: '#f59e0b',
  'HELIX-3': '#a78bfa',
  CIPHER: '#f87171',
}

function nodePositions(layerIdx: number, nodeCount: number, w: number, h: number) {
  const x = (layerIdx / (LAYERS.length - 1)) * (w - 60) + 30
  const spacing = (h - 40) / (nodeCount + 1)
  return Array.from({ length: nodeCount }, (_, i) => ({
    x,
    y: spacing * (i + 1) + 20,
  }))
}

export function NeuralNetworkViz({
  className,
  activeAnchor = 'ARIA-7',
}: {
  className?: string
  activeAnchor?: string
}) {
  const canvasRef = useRef<SVGSVGElement>(null)
  const frameRef = useRef<number>(0)
  const phaseRef = useRef(0)

  const accentColor = ANCHOR_COLORS[activeAnchor] ?? '#2dd4bf'

  useEffect(() => {
    const svg = canvasRef.current
    if (!svg) return

    const W = svg.clientWidth || 320
    const H = svg.clientHeight || 160

    const allPositions = LAYERS.map((l, i) => nodePositions(i, l.nodes, W, H))

    // Draw connections
    const connGroup = svg.querySelector('#conn') as SVGGElement
    const nodeGroup = svg.querySelector('#nodes') as SVGGElement
    const dotGroup = svg.querySelector('#dots') as SVGGElement

    if (!connGroup || !nodeGroup || !dotGroup) return

    // Build connections array
    type Conn = { x1: number; y1: number; x2: number; y2: number; el: SVGLineElement }
    const connections: Conn[] = []

    connGroup.innerHTML = ''
    for (let li = 0; li < allPositions.length - 1; li++) {
      for (const a of allPositions[li]) {
        for (const b of allPositions[li + 1]) {
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
          line.setAttribute('x1', String(a.x))
          line.setAttribute('y1', String(a.y))
          line.setAttribute('x2', String(b.x))
          line.setAttribute('y2', String(b.y))
          line.setAttribute('stroke', accentColor)
          line.setAttribute('stroke-width', '0.5')
          line.setAttribute('opacity', '0.15')
          connGroup.appendChild(line)
          connections.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, el: line })
        }
      }
    }

    // Build nodes
    nodeGroup.innerHTML = ''
    const nodeSvgEls: SVGCircleElement[][] = allPositions.map((layer) =>
      layer.map((pos) => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        circle.setAttribute('cx', String(pos.x))
        circle.setAttribute('cy', String(pos.y))
        circle.setAttribute('r', '5')
        circle.setAttribute('fill', '#0a0e1a')
        circle.setAttribute('stroke', accentColor)
        circle.setAttribute('stroke-width', '1')
        circle.setAttribute('opacity', '0.5')
        nodeGroup.appendChild(circle)
        return circle
      }),
    )

    // Animate
    const animate = () => {
      phaseRef.current += 0.04

      // Pulse connections
      connections.forEach((conn, i) => {
        const pulse = 0.1 + 0.25 * (0.5 + 0.5 * Math.sin(phaseRef.current * 1.2 + i * 0.7))
        conn.el.setAttribute('opacity', String(pulse))
      })

      // Pulse nodes
      nodeSvgEls.forEach((layer, li) => {
        layer.forEach((node, ni) => {
          const activation = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(phaseRef.current * 0.9 + li * 1.3 + ni * 0.6))
          node.setAttribute('opacity', String(activation))
          node.setAttribute('r', String(4 + activation * 2.5))
        })
      })

      // Moving dots along connections (every 4th connection)
      dotGroup.innerHTML = ''
      connections.filter((_, i) => i % 4 === 0).forEach((conn, i) => {
        const t = ((phaseRef.current * 0.5 + i * 0.3) % 1 + 1) % 1
        const x = conn.x1 + (conn.x2 - conn.x1) * t
        const y = conn.y1 + (conn.y2 - conn.y1) * t
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        dot.setAttribute('cx', String(x))
        dot.setAttribute('cy', String(y))
        dot.setAttribute('r', '2')
        dot.setAttribute('fill', accentColor)
        dot.setAttribute('opacity', '0.9')
        dotGroup.appendChild(dot)
      })

      frameRef.current = requestAnimationFrame(animate)
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [accentColor])

  return (
    <div className={cn('relative', className)}>
      <svg
        ref={canvasRef}
        className="w-full h-full"
        viewBox="0 0 320 140"
        preserveAspectRatio="xMidYMid meet"
      >
        <g id="conn" />
        <g id="nodes" />
        <g id="dots" />
        {/* Layer labels */}
        {LAYERS.map((layer, i) => {
          const x = (i / (LAYERS.length - 1)) * (320 - 60) + 30
          return (
            <text
              key={i}
              x={x}
              y={132}
              textAnchor="middle"
              fontSize="7"
              fill={accentColor}
              opacity={0.4}
              fontFamily="monospace"
            >
              {layer.label}
            </text>
          )
        })}
      </svg>
    </div>
  )
}
