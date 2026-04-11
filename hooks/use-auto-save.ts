"use client"

import { useRef, useCallback, useEffect, useState } from "react"

type SaveStatus = "idle" | "saving" | "saved" | "error"

export function useAutoSave(
  saveFn: () => Promise<void>,
  delay: number = 1500
) {
  const [status, setStatus] = useState<SaveStatus>("idle")
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const saveFnRef = useRef(saveFn)
  saveFnRef.current = saveFn

  const save = useCallback(async () => {
    setStatus("saving")
    try {
      await saveFnRef.current()
      setStatus("saved")
      // Reset to idle after 2 seconds
      savedTimeoutRef.current = setTimeout(() => setStatus("idle"), 2000)
    } catch {
      setStatus("error")
    }
  }, [])

  const trigger = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
    timeoutRef.current = setTimeout(save, delay)
  }, [save, delay])

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
      save()
    }
  }, [save])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
    }
  }, [])

  return { status, trigger, flush }
}
