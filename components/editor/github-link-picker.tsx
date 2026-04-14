"use client"

import { useState } from "react"
import { GithubRepository } from "@/lib/types"
import { linkGithubEntity } from "@/actions/github"

interface GithubLinkPickerProps {
  noteId: string
  repositories: GithubRepository[]
  onClose: () => void
}

type Step = "repo" | "type" | "entity"
type EntityType = "branch" | "pull_request" | "commit"

interface EntityOption {
  ref: string
  title?: string
  url?: string
  state?: string
  author?: string
}

export function GithubLinkPicker({ noteId, repositories, onClose }: GithubLinkPickerProps) {
  const [step, setStep] = useState<Step>("repo")
  const [selectedRepo, setSelectedRepo] = useState<GithubRepository | null>(null)
  const [selectedType, setSelectedType] = useState<EntityType | null>(null)
  const [entities, setEntities] = useState<EntityOption[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")

  const handleSelectRepo = (repo: GithubRepository) => {
    setSelectedRepo(repo)
    setStep("type")
  }

  const handleSelectType = async (type: EntityType) => {
    if (!selectedRepo) return
    setSelectedType(type)
    setStep("entity")
    setLoading(true)

    try {
      const endpoint =
        type === "branch" ? "branches" :
        type === "pull_request" ? "pulls" :
        "commits"

      const res = await fetch(`/api/github/repos/${selectedRepo.owner}/${selectedRepo.name}/${endpoint}`)
      if (!res.ok) throw new Error("Failed to fetch")

      const data = await res.json()

      const mapped: EntityOption[] = data.map((item: Record<string, string>) => {
        if (type === "branch") {
          return { ref: item.name }
        } else if (type === "pull_request") {
          return { ref: `#${item.number}`, title: item.title, url: item.url, state: item.state, author: item.author }
        } else {
          return { ref: item.sha, title: item.message, url: item.url, author: item.author }
        }
      })

      setEntities(mapped)
    } catch {
      setEntities([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectEntity = async (entity: EntityOption) => {
    if (!selectedRepo || !selectedType) return
    await linkGithubEntity(
      { noteId },
      selectedRepo.id,
      selectedType,
      entity.ref,
      entity.title,
      entity.url,
      entity.state,
      entity.author,
    )
    onClose()
  }

  const filtered = entities.filter((e) =>
    `${e.ref} ${e.title || ""}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="mx-3 lg:mx-4 mb-2 border border-border p-3 bg-background">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-secondary">
          {step === "repo" && "select repository"}
          {step === "type" && `${selectedRepo?.full_name} > select type`}
          {step === "entity" && `${selectedRepo?.full_name} > ${selectedType}`}
        </span>
        <div className="flex gap-2">
          {step !== "repo" && (
            <button
              onClick={() => {
                if (step === "entity") { setStep("type"); setSearch(""); setEntities([]) }
                else { setStep("repo"); setSelectedRepo(null) }
              }}
              className="text-xs text-muted hover:text-foreground"
            >
              back
            </button>
          )}
          <button onClick={onClose} className="text-xs text-muted hover:text-foreground">
            close
          </button>
        </div>
      </div>

      {step === "repo" && (
        <div className="space-y-0.5 max-h-40 overflow-y-auto">
          {repositories.length === 0 ? (
            <p className="text-xs text-muted">no repositories enabled. add repos in settings.</p>
          ) : (
            repositories.map((repo) => (
              <button
                key={repo.id}
                onClick={() => handleSelectRepo(repo)}
                className="w-full text-left px-2 py-1.5 text-sm text-foreground hover:bg-surface transition-colors duration-100 truncate"
              >
                {repo.full_name}
              </button>
            ))
          )}
        </div>
      )}

      {step === "type" && (
        <div className="space-y-0.5">
          {(["branch", "pull_request", "commit"] as EntityType[]).map((type) => (
            <button
              key={type}
              onClick={() => handleSelectType(type)}
              className="w-full text-left px-2 py-1.5 text-sm text-foreground hover:bg-surface transition-colors duration-100"
            >
              {type === "pull_request" ? "pull request" : type}
            </button>
          ))}
        </div>
      )}

      {step === "entity" && (
        <div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="search..."
            className="w-full bg-surface border border-border px-2 py-1.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-foreground mb-2"
          />
          <div className="space-y-0.5 max-h-48 overflow-y-auto">
            {loading ? (
              <p className="text-xs text-muted py-1">loading...</p>
            ) : filtered.length === 0 ? (
              <p className="text-xs text-muted py-1">no results</p>
            ) : (
              filtered.slice(0, 30).map((entity) => (
                <button
                  key={entity.ref}
                  onClick={() => handleSelectEntity(entity)}
                  className="w-full text-left px-2 py-1.5 text-sm text-foreground hover:bg-surface transition-colors duration-100"
                >
                  <span className="text-accent">{entity.ref}</span>
                  {entity.title && <span className="text-muted ml-2">{entity.title}</span>}
                  {entity.state && <span className="text-muted ml-1">[{entity.state}]</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
