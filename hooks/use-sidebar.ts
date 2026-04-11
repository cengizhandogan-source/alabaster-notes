"use client"

import { useState, useCallback } from "react"

export function useSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])
  const toggleCollapse = useCallback(() => setIsCollapsed((prev) => !prev), [])
  return { isOpen, open, close, toggle, isCollapsed, toggleCollapse }
}
