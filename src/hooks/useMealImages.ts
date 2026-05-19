import { useEffect, useState } from 'react'
import { getMealImagePool } from '../services/mealDbApi'

// Module-level cache so all components share the same fetch
let globalPool: string[] = []
const listeners: Array<(pool: string[]) => void> = []
let fetching = false

function ensureFetched() {
  if (globalPool.length > 0 || fetching) return
  fetching = true
  getMealImagePool().then(pool => {
    globalPool = pool
    listeners.splice(0).forEach(fn => fn(pool))
  })
}

export function useMealImages() {
  const [pool, setPool] = useState<string[]>(globalPool)

  useEffect(() => {
    if (globalPool.length > 0) { setPool(globalPool); return }
    listeners.push(setPool)
    ensureFetched()
    return () => {
      const idx = listeners.indexOf(setPool)
      if (idx !== -1) listeners.splice(idx, 1)
    }
  }, [])

  // Returns image URL for a given index, cycling through the pool
  function img(index: number): string | undefined {
    if (pool.length === 0) return undefined
    return pool[Math.abs(index) % pool.length]
  }

  return { pool, img }
}
