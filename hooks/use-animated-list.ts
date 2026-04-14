"use client"

import { useRef, useState, useEffect } from "react"

interface WithId {
  id: string
}

export type AnimatedItem<T> = T & { _exiting?: boolean }

export function useAnimatedList<T extends WithId>(items: T[]) {
  const prevRef = useRef<T[]>(items)
  const [exitingItems, setExitingItems] = useState<Map<string, T>>(new Map())

  useEffect(() => {
    const currentIds = new Set(items.map((i) => i.id))
    const removed = new Map<string, T>()

    for (const prev of prevRef.current) {
      if (!currentIds.has(prev.id)) {
        removed.set(prev.id, prev)
      }
    }

    if (removed.size > 0) {
      setExitingItems((prev) => {
        const next = new Map(prev)
        for (const [id, item] of removed) {
          next.set(id, item)
        }
        return next
      })
    }

    // Cancel exit for items that reappeared
    if (exitingItems.size > 0) {
      const reappeared = [...exitingItems.keys()].filter((id) => currentIds.has(id))
      if (reappeared.length > 0) {
        setExitingItems((prev) => {
          const next = new Map(prev)
          for (const id of reappeared) next.delete(id)
          return next
        })
      }
    }

    prevRef.current = items
  }, [items])

  const onExitComplete = (id: string) => {
    setExitingItems((prev) => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }

  const allItems: AnimatedItem<T>[] = [
    ...items,
    ...[...exitingItems.values()].map((item) => ({ ...item, _exiting: true as const })),
  ]

  return { items: allItems, onExitComplete }
}
