"use client"

import { useEffect, useRef, useState } from "react"

type AccountOption = {
  id: string
  username: string
  displayName: string
  healthStatus: string
}

export type InstagramModalDetail = {
  onPosted: (postId: string) => void
  onCancelled?: () => void
}

export const INSTAGRAM_MODAL_EVENT = "alabaster:open-instagram-modal"

export function InstagramPostModal() {
  const [open, setOpen] = useState(false)
  const [accounts, setAccounts] = useState<AccountOption[]>([])
  const [accountId, setAccountId] = useState("")
  const [caption, setCaption] = useState("")
  const [mediaUrl, setMediaUrl] = useState("")
  const [mediaType, setMediaType] = useState<"image" | "video">("image")
  const [contentType, setContentType] = useState<"feed" | "reels" | "story">("feed")
  const [when, setWhen] = useState<"now" | "schedule">("now")
  const [scheduledFor, setScheduledFor] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const pendingRef = useRef<InstagramModalDetail | null>(null)

  useEffect(() => {
    function handleOpen(e: Event) {
      const detail = (e as CustomEvent<InstagramModalDetail>).detail
      pendingRef.current = detail
      setError(null)
      setCaption("")
      setMediaUrl("")
      setMediaType("image")
      setContentType("feed")
      setWhen("now")
      setScheduledFor("")
      setOpen(true)
    }
    window.addEventListener(INSTAGRAM_MODAL_EVENT, handleOpen)
    return () => window.removeEventListener(INSTAGRAM_MODAL_EVENT, handleOpen)
  }, [])

  useEffect(() => {
    if (!open) return
    setLoadingAccounts(true)
    fetch("/api/zernio/accounts")
      .then((r) => (r.ok ? r.json() : { accounts: [] }))
      .then((data: { accounts?: AccountOption[] }) => {
        const list = data.accounts || []
        setAccounts(list)
        if (list.length > 0) setAccountId((prev) => prev || list[0].id)
      })
      .catch(() => setAccounts([]))
      .finally(() => setLoadingAccounts(false))
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        pendingRef.current?.onCancelled?.()
        pendingRef.current = null
        setOpen(false)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  function handleCancel() {
    pendingRef.current?.onCancelled?.()
    pendingRef.current = null
    setOpen(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!caption.trim()) {
      setError("caption is required")
      return
    }
    if (!accountId) {
      setError("connect an instagram account in settings first")
      return
    }
    if (when === "schedule" && !scheduledFor) {
      setError("pick a date/time to schedule")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {
        caption: caption.trim(),
        accountId,
        contentType,
      }
      if (mediaUrl.trim()) {
        body.mediaUrl = mediaUrl.trim()
        body.mediaType = mediaType
      }
      if (when === "now") body.publishNow = true
      else body.scheduledFor = new Date(scheduledFor).toISOString()

      const res = await fetch("/api/zernio/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `request failed (${res.status})`)

      pendingRef.current?.onPosted(data.id)
      pendingRef.current = null
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to create post")
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 font-mono"
      onClick={handleCancel}
    >
      <div
        className="bg-background border border-border p-6 w-full max-w-md mx-4 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">&gt; post to instagram</h2>
          <button
            onClick={handleCancel}
            className="text-xs text-secondary hover:text-foreground transition-colors duration-100"
          >
            close
          </button>
        </div>

        {loadingAccounts ? (
          <p className="text-sm text-muted">loading accounts...</p>
        ) : accounts.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              no instagram accounts connected. connect one in settings first.
            </p>
            <button
              onClick={handleCancel}
              className="bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity duration-100"
            >
              &gt; ok
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs text-secondary mb-1">account</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-surface border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.displayName}
                    {a.healthStatus !== "connected" ? ` (${a.healthStatus})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-secondary mb-1">caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
                placeholder="write your caption..."
                className="w-full bg-surface border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-foreground resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-secondary mb-1">
                media url <span className="text-muted">(public image/video url, optional)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 bg-surface border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-foreground"
                />
                <select
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value as "image" | "video")}
                  className="bg-surface border border-border px-2 py-2 text-sm text-foreground focus:outline-none focus:border-foreground"
                >
                  <option value="image">image</option>
                  <option value="video">video</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-secondary mb-1">format</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as "feed" | "reels" | "story")}
                className="w-full bg-surface border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground"
              >
                <option value="feed">feed post</option>
                <option value="reels">reel</option>
                <option value="story">story</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-secondary mb-1">when</label>
              <div className="flex gap-2">
                <select
                  value={when}
                  onChange={(e) => setWhen(e.target.value as "now" | "schedule")}
                  className="bg-surface border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground"
                >
                  <option value="now">post now</option>
                  <option value="schedule">schedule</option>
                </select>
                {when === "schedule" && (
                  <input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    className="flex-1 bg-surface border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground"
                  />
                )}
              </div>
            </div>

            {error && <p className="text-xs text-error">{error}</p>}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="text-xs text-secondary hover:text-foreground transition-colors duration-100 px-3 py-2"
                disabled={submitting}
              >
                cancel
              </button>
              <button
                type="submit"
                className="bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity duration-100 disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? "> posting..." : when === "now" ? "> post" : "> schedule"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
