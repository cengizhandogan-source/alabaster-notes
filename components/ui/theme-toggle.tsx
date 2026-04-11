"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return <span className="text-sm text-muted">...</span>

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="text-sm text-secondary hover:text-foreground transition-colors duration-100"
    >
      {theme === "dark" ? "> light" : "> dark"}
    </button>
  )
}
