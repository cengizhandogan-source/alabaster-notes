"use client"

import { useState } from "react"
import { GithubLink, GithubRepository } from "@/lib/types"
import { unlinkGithubEntity } from "@/actions/github"
import { GithubLinkPicker } from "./github-link-picker"

interface GithubPanelProps {
  noteId: string
  links: GithubLink[]
  repositories: GithubRepository[]
  isConnected: boolean
}

const typeLabel: Record<string, string> = {
  branch: "branch",
  pull_request: "pr",
  commit: "commit",
}

const stateColor: Record<string, string> = {
  open: "text-success",
  merged: "text-accent",
  closed: "text-error",
}

export function GithubPanel({ noteId, links, repositories, isConnected }: GithubPanelProps) {
  const [expanded, setExpanded] = useState(links.length > 0)
  const [showPicker, setShowPicker] = useState(false)

  if (!isConnected && links.length === 0) return null

  const branchCount = links.filter((l) => l.entity_type === "branch").length
  const prCount = links.filter((l) => l.entity_type === "pull_request").length
  const commitCount = links.filter((l) => l.entity_type === "commit").length

  const summary = [
    branchCount > 0 && `${branchCount} branch${branchCount > 1 ? "es" : ""}`,
    prCount > 0 && `${prCount} pr${prCount > 1 ? "s" : ""}`,
    commitCount > 0 && `${commitCount} commit${commitCount > 1 ? "s" : ""}`,
  ].filter(Boolean).join(", ")

  const handleUnlink = async (linkId: string) => {
    await unlinkGithubEntity(linkId)
  }

  return (
    <div className="border-b border-border bg-background">
      <div className="flex items-center gap-2 px-3 lg:px-4 py-1.5">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-secondary hover:text-foreground transition-colors duration-100"
        >
          {expanded ? "v" : ">"} dev{summary ? `: ${summary}` : ""}
        </button>
        <div className="flex-1" />
        {isConnected && (
          <button
            onClick={() => setShowPicker(true)}
            className="text-xs text-secondary hover:text-foreground transition-colors duration-100"
          >
            link
          </button>
        )}
      </div>

      {expanded && links.length > 0 && (
        <div className="px-3 lg:px-4 pb-2 space-y-1">
          {links.map((link) => (
            <div key={link.id} className="flex items-center gap-2 text-xs group">
              <span className="text-muted">[{typeLabel[link.entity_type]}]</span>
              {link.entity_url ? (
                <a
                  href={link.entity_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-accent transition-colors duration-100 truncate"
                >
                  {link.entity_ref}
                  {link.entity_title && ` — ${link.entity_title}`}
                </a>
              ) : (
                <span className="text-foreground truncate">
                  {link.entity_ref}
                  {link.entity_title && ` — ${link.entity_title}`}
                </span>
              )}
              {link.entity_state && (
                <span className={`${stateColor[link.entity_state] || "text-muted"} shrink-0`}>
                  [{link.entity_state}]
                </span>
              )}
              <button
                onClick={() => handleUnlink(link.id)}
                className="text-muted hover:text-error transition-colors duration-100 opacity-0 group-hover:opacity-100 shrink-0"
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}

      {showPicker && (
        <GithubLinkPicker
          noteId={noteId}
          repositories={repositories}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}
