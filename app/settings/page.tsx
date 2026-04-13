"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

declare global {
  interface Window {
    electronAPI?: {
      platform: string
      getSettings: () => Promise<Record<string, string>>
      saveSettings: (settings: Record<string, string>) => Promise<boolean>
    }
  }
}

export default function SettingsPage() {
  const router = useRouter()
  const [apiKey, setApiKey] = useState("")
  const [saved, setSaved] = useState(false)
  const [isElectron, setIsElectron] = useState(false)

  useEffect(() => {
    if (window.electronAPI) {
      setIsElectron(true)
      window.electronAPI.getSettings().then((settings) => {
        if (settings.OPENAI_API_KEY) {
          setApiKey(settings.OPENAI_API_KEY)
        }
      })
    }
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!window.electronAPI) return

    await window.electronAPI.saveSettings({ OPENAI_API_KEY: apiKey })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!isElectron) {
    return (
      <div className="flex items-center justify-center h-screen font-mono">
        <div className="border border-border p-6 max-w-md">
          <p className="text-sm text-secondary">
            settings are only available in the desktop app.
          </p>
          <button
            onClick={() => router.push("/notes")}
            className="mt-4 text-sm text-foreground hover:opacity-70 transition-opacity"
          >
            &gt; back to notes
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center h-screen font-mono">
      <form onSubmit={handleSave} className="border border-border p-6 w-full max-w-md">
        <h1 className="text-lg font-medium text-foreground mb-6">&gt; settings</h1>

        <div>
          <label htmlFor="apiKey" className="block text-sm text-secondary mb-1">
            openai api key
          </label>
          <input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full bg-surface border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-foreground transition-colors duration-100"
          />
          <p className="text-xs text-muted mt-1">
            used for ai features. stored locally on your machine.
          </p>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            type="submit"
            className="bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity duration-100"
          >
            {saved ? "> saved" : "> save"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/notes")}
            className="text-sm text-secondary hover:text-foreground transition-colors duration-100"
          >
            &gt; back
          </button>
        </div>
      </form>
    </div>
  )
}
