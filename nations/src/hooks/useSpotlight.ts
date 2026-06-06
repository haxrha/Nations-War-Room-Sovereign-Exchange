import { useCallback, useRef, type MouseEvent } from 'react'

export function useSpotlight() {
  const ref = useRef<HTMLDivElement>(null)

  const onMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    el.style.setProperty('--spot-x', `${x}px`)
    el.style.setProperty('--spot-y', `${y}px`)
  }, [])

  const onMouseLeave = useCallback(() => {
    ref.current?.style.setProperty('--spot-opacity', '0')
  }, [])

  const onMouseEnter = useCallback(() => {
    ref.current?.style.setProperty('--spot-opacity', '1')
  }, [])

  return { ref, onMouseMove, onMouseLeave, onMouseEnter }
}
