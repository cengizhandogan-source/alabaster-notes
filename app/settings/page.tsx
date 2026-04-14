"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { addRepository, removeRepository } from "@/actions/github"
import type { GithubRepository } from "@/lib/types"

export default function SettingsPage() {
  const router = useRouter()
  const [apiKey, setApiKey] = useState("")
  const [saved, setSaved] = useState(false)
  const [isElectron, setIsElectron] = useState(false)

  // GitHub state
  const [ghConnected, setGhConnected] = useState(false)
  const [ghUsername, setGhUsername] = useState("")
  const [ghLoading, setGhLoading] = useState(true)
  const [enabledRepos, setEnabledRepos] = useState<GithubRepository[]>([])
  const [availableRepos, setAvailableRepos] = useState<{ id: number; full_name: string; name: string; owner: string; default_branch: string; private: boolean }[]>([])
  const [showRepoPicker, setShowRepoPicker] = useState(false)
  const [repoSearch, setRepoSearch] = useState("")

  useEffect(() => {
    if (window.electronAPI) {
      setIsElectron(true)
      window.electronAPI.getSettings().then((settings) => {
        if (settings.OPENAI_API_KEY) setApiKey(settings.OPENAI_API_KEY)
      })
    }
  }, [])

  const fetchGithubStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/github/status")
      const data = await res.json()
      setGhConnected(data.connected)
      setGhUsername(data.username || "")
    } catch {
      // ignore
    } finally {
      setGhLoading(false)
    }
  }, [])

  useEffect(() => { fetchGithubStatus() }, [fetchGithubStatus])

  // Fetch enabled repos from Supabase (via a simple client fetch is fine here)
  useEffect(() => {
    if (!ghConnected) return
    fetch("/api/github/repos/enabled")
      .then((r) => r.ok ? r.json() : [])
      .then(setEnabledRepos)
      .catch(() => {})
  }, [ghConnected])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!window.electronAPI) return
    await window.electronAPI.saveSettings({ OPENAI_API_KEY: apiKey })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleConnectGithub = () => {
    window.location.href = "/api/github/auth"
  }

  const handleDisconnectGithub = async () => {
    if (!confirm("Disconnect GitHub? This will remove all linked branches, PRs, and commits.")) return
    await fetch("/api/github/disconnect", { method: "POST" })
    setGhConnected(false)
    setGhUsername("")
    setEnabledRepos([])
  }

  const handleShowRepoPicker = async () => {
    setShowRepoPicker(true)
    try {
      const res = await fetch("/api/github/repos")
      if (res.ok) setAvailableRepos(await res.json())
    } catch {
      // ignore
    }
  }

  const handleAddRepo = async (repo: { id: number; full_name: string; name: string; owner: string; default_branch: string }) => {
    const result = await addRepository({
      github_repo_id: repo.id,
      owner: repo.owner,
      name: repo.name,
      full_name: repo.full_name,
      default_branch: repo.default_branch,
    })
    setEnabledRepos((prev) => [...prev, result])
  }

  const handleRemoveRepo = async (repoId: string) => {
    await removeRepository(repoId)
    setEnabledRepos((prev) => prev.filter((r) => r.id !== repoId))
  }

  const enabledRepoIds = new Set(enabledRepos.map((r) => r.github_repo_id))
  const filteredRepos = availableRepos.filter(
    (r) => !enabledRepoIds.has(r.id) && r.full_name.toLowerCase().includes(repoSearch.toLowerCase())
  )

  return (
    <div className="flex items-start justify-center min-h-screen font-mono py-12">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-medium text-foreground">&gt; settings</h1>
          <button
            onClick={() => router.push("/notes")}
            className="text-sm text-secondary hover:text-foreground transition-colors duration-100"
          >
            &gt; back
          </button>
        </div>

        {/* OpenAI Section (Electron only) */}
        {isElectron && (
          <form onSubmit={handleSave} className="border border-border p-6">
            <h2 className="text-sm font-medium text-foreground mb-4">openai</h2>
            <div>
              <label htmlFor="apiKey" className="block text-sm text-secondary mb-1">
                api key
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
            <button
              type="submit"
              className="mt-4 bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity duration-100"
            >
              {saved ? "> saved" : "> save"}
            </button>
          </form>
        )}

        {/* GitHub Section */}
        <div className="border border-border p-6">
          <h2 className="text-sm font-medium text-foreground mb-4">github</h2>

          {ghLoading ? (
            <p className="text-sm text-muted">checking connection...</p>
          ) : ghConnected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">
                  connected as <span className="text-accent">{ghUsername}</span>
                </span>
                <button
                  onClick={handleDisconnectGithub}
                  className="text-xs text-secondary hover:text-error transition-colors duration-100"
                >
                  disconnect
                </button>
              </div>

              {/* Enabled Repos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-secondary">repositories</span>
                  <button
                    onClick={handleShowRepoPicker}
                    className="text-xs text-secondary hover:text-foreground transition-colors duration-100"
                  >
                    + add
                  </button>
                </div>

                {enabledRepos.length === 0 ? (
                  <p className="text-xs text-muted">no repositories enabled. add one to start linking.</p>
                ) : (
                  <div className="space-y-1">
                    {enabledRepos.map((repo) => (
                      <div key={repo.id} className="flex items-center justify-between py-1.5 px-2 border border-border">
                        <span className="text-sm text-foreground truncate">{repo.full_name}</span>
                        <button
                          onClick={() => handleRemoveRepo(repo.id)}
                          className="text-xs text-muted hover:text-error transition-colors duration-100 ml-2 shrink-0"
                        >
                          remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Repo Picker */}
                {showRepoPicker && (
                  <div className="mt-3 border border-border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-secondary">select a repository</span>
                      <button
                        onClick={() => { setShowRepoPicker(false); setRepoSearch("") }}
                        className="text-xs text-muted hover:text-foreground"
                      >
                        close
                      </button>
                    </div>
                    <input
                      type="text"
                      value={repoSearch}
                      onChange={(e) => setRepoSearch(e.target.value)}
                      placeholder="search..."
                      className="w-full bg-surface border border-border px-2 py-1.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-foreground mb-2"
                    />
                    <div className="max-h-48 overflow-y-auto space-y-0.5">
                      {filteredRepos.length === 0 ? (
                        <p className="text-xs text-muted py-1">
                          {availableRepos.length === 0 ? "loading..." : "no matching repos"}
                        </p>
                      ) : (
                        filteredRepos.slice(0, 20).map((repo) => (
                          <button
                            key={repo.id}
                            onClick={() => { handleAddRepo(repo); setShowRepoPicker(false); setRepoSearch("") }}
                            className="w-full text-left px-2 py-1.5 text-sm text-foreground hover:bg-surface transition-colors duration-100 truncate"
                          >
                            {repo.full_name}
                            {repo.private && <span className="text-xs text-muted ml-1">(private)</span>}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted mb-3">
                connect your github account to link branches, PRs, and commits to notes.
              </p>
              <button
                onClick={handleConnectGithub}
                className="bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity duration-100"
              >
                &gt; connect github
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
