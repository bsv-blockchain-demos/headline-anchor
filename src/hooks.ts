import { useEffect, useRef, useState } from 'react'

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Count a number up from 0 to `target` over ~1.2s (ease-out) when `active`.
// Respects reduced-motion by jumping straight to the target.
export function useCountUp(target: number, active: boolean): number {
  const [value, setValue] = useState(0)
  const frame = useRef<number>()

  useEffect(() => {
    if (!active) return
    if (prefersReducedMotion() || target <= 0) {
      setValue(target)
      return
    }
    const duration = 1200
    const start = performance.now()
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(target * eased))
      if (p < 1) frame.current = requestAnimationFrame(step)
    }
    frame.current = requestAnimationFrame(step)
    return () => { if (frame.current) cancelAnimationFrame(frame.current) }
  }, [target, active])

  return value
}
