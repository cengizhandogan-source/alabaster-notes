"use client"

import { useState } from "react"

interface EditorToolbarProps {
  title: string
  onTitleChange: (title: string) => void
  status: "idle" | "saving" | "saved" | "error"
  onDelete: () => void
  onUploadFile?: () => void
  onToggleSidebar?: () => void
  isSidebarCollapsed?: boolean
  onExpandSidebar?: () => void
  noteKey?: string | null
  isShared?: boolean
  shareToken?: string | null
  onShare?: () => void
  onUnshare?: () => void
}

export function EditorToolbar({
  title,
  onTitleChange,
  status,
  onDelete,
  onUploadFile,
  onToggleSidebar,
  isSidebarCollapsed,
  onExpandSidebar,
  noteKey,
  isShared,
  shareToken,
  onShare,
  onUnshare,
}: EditorToolbarProps) {
  const [showSharePopover, setShowSharePopover] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = shareToken ? `${typeof window !== "undefined" ? window.location.origin : ""}/s/${shareToken}` : ""

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  const statusText = {
    idle: "",
    saving: "saving...",
    saved: "saved",
    error: "error saving",
  }

  const statusColor = {
    idle: "text-muted",
    saving: "text-secondary",
    saved: "text-success",
    error: "text-error",
  }

  return (
    <div className="flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 border-b border-border bg-background safe-right">
      {/* Mobile hamburger */}
      {onToggleSidebar && (
        <button
          onClick={onToggleSidebar}
          className="lg:hidden text-secondary hover:text-foreground transition-colors duration-100 p-2 -ml-2"
        >
          |||
        </button>
      )}

      {/* Desktop expand sidebar */}
      {isSidebarCollapsed && onExpandSidebar && (
        <button
          onClick={onExpandSidebar}
          className="hidden lg:block text-secondary hover:text-foreground transition-colors duration-100 text-sm"
          title="Expand sidebar"
        >
          »
        </button>
      )}

      {/* Note key */}
      {noteKey && (
        <span className="text-xs text-muted bg-surface px-1.5 py-0.5 border border-border shrink-0">
          {noteKey}
        </span>
      )}

      {/* Title input */}
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Untitled"
        className="flex-1 bg-transparent text-foreground text-base lg:text-lg font-medium focus:outline-none placeholder:text-muted"
      />

      {/* Status */}
      <span className={`text-xs ${statusColor[status]} whitespace-nowrap`}>
        {statusText[status]}
      </span>

      {/* Share */}
      <div className="relative">
        <button
          onClick={() => setShowSharePopover(!showSharePopover)}
          className={`text-xs transition-colors duration-100 p-1.5 ${isShared ? "text-accent hover:text-foreground" : "text-secondary hover:text-foreground"}`}
          title={isShared ? "Manage share link" : "Share note"}
        >
          share
        </button>
        {showSharePopover && (
          <div className="absolute right-0 top-full mt-1 bg-background border border-border p-3 z-50 min-w-[260px]">
            {isShared && shareToken ? (
              <div className="space-y-2">
                <p className="text-xs text-muted">anyone with this link can view</p>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 text-xs bg-surface border border-border px-2 py-1 text-foreground font-mono"
                  />
                  <button
                    onClick={handleCopy}
                    className="text-xs text-secondary hover:text-foreground transition-colors duration-100 px-2 py-1 border border-border"
                  >
                    {copied ? "copied" : "copy"}
                  </button>
                </div>
                <button
                  onClick={() => {
                    onUnshare?.()
                    setShowSharePopover(false)
                  }}
                  className="text-xs text-error hover:text-foreground transition-colors duration-100"
                >
                  unshare
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted">create a public read-only link</p>
                <button
                  onClick={() => {
                    onShare?.()
                  }}
                  className="text-xs text-secondary hover:text-foreground transition-colors duration-100 border border-border px-2 py-1"
                >
                  create share link
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Attach file */}
      {onUploadFile && (
        <button
          onClick={onUploadFile}
          className="text-xs text-secondary hover:text-foreground transition-colors duration-100 p-1.5"
          title="Attach file"
        >
          attach
        </button>
      )}

      {/* Delete */}
      <button
        onClick={onDelete}
        className="text-xs text-secondary hover:text-error transition-colors duration-100 p-1.5"
      >
        delete
      </button>

      {/* Settings */}
      <a
        href="/settings"
        className="text-xs text-secondary hover:text-accent transition-colors duration-100 p-1.5"
        title="Settings"
      >
        settings
      </a>

      {/* Commands page */}
      <a
        href="/commands"
        target="_blank"
        className="text-xs text-secondary hover:text-accent transition-colors duration-100 p-1.5"
        title="View commands"
      >
        cmds
      </a>
    </div>
  )
}
