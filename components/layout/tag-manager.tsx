"use client"

import { useState, useRef, useEffect } from "react"
import { AnimatePresence, motion } from "motion/react"
import { toast } from "sonner"
import { Tag } from "@/lib/types"
import { createTag, updateTag, deleteTag } from "@/actions/tags"

const PRESET_COLORS = [
  "#A78BFA", "#F87171", "#4ADE80", "#FBBF24",
  "#38BDF8", "#FB923C", "#E879F9", "#34D399",
]

interface TagManagerProps {
  tags: Tag[]
  isOpen: boolean
  onClose: () => void
}

export function TagManager({ tags, isOpen, onClose }: TagManagerProps) {
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [isOpen, onClose])

  const handleCreate = async () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    if (tags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("A tag with this name already exists")
      return
    }
    await createTag(trimmed, newColor)
    setNewName("")
    setNewColor(PRESET_COLORS[0])
  }

  const handleUpdate = async (tag: Tag) => {
    const trimmed = editName.trim()
    if (trimmed && (trimmed !== tag.name || editColor !== tag.color)) {
      const duplicate = tags.some(
        (t) => t.id !== tag.id && t.name.toLowerCase() === trimmed.toLowerCase()
      )
      if (duplicate) {
        toast.error("A tag with this name already exists")
        return
      }
      await updateTag(tag.id, trimmed, editColor)
    }
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    await deleteTag(id)
  }

  const startEdit = (tag: Tag) => {
    setEditingId(tag.id)
    setEditName(tag.name)
    setEditColor(tag.color)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -4 }}
          transition={{ duration: 0.12 }}
          className="absolute left-0 top-full z-50 bg-background border border-border shadow-md py-2 min-w-[220px] max-w-[calc(100vw-64px)] max-h-[320px] overflow-y-auto"
        >
      <div className="px-3 py-1 text-xs text-muted">Tags</div>

      {tags.map((tag) => (
        <div key={tag.id} className="px-3 py-1.5">
          {editingId === tag.id ? (
            <div className="space-y-1.5">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value.slice(0, 10))}
                maxLength={10}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUpdate(tag)
                  if (e.key === "Escape") setEditingId(null)
                }}
                className="w-full bg-surface text-foreground text-sm px-1.5 py-0.5 border border-accent focus:outline-none"
                autoFocus
              />
              <div className="flex gap-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setEditColor(c)}
                    className="w-4 h-4 rounded-full border-2 transition-colors duration-100"
                    style={{
                      backgroundColor: c,
                      borderColor: editColor === c ? "var(--foreground)" : "transparent",
                    }}
                  />
                ))}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleUpdate(tag)}
                  className="text-xs text-accent hover:underline"
                >
                  save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-xs text-muted hover:underline"
                >
                  cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: tag.color }}
              />
              <span className="text-sm text-foreground flex-1 truncate">{tag.name}</span>
              <button
                onClick={() => startEdit(tag)}
                className="text-xs text-muted hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-100"
              >
                edit
              </button>
              <button
                onClick={() => handleDelete(tag.id)}
                className="text-xs text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity duration-100"
              >
                del
              </button>
            </div>
          )}
        </div>
      ))}

      <div className="px-3 pt-2 border-t border-border mt-1 space-y-1.5">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value.slice(0, 10))}
          maxLength={10}
          onKeyDown={(e) => { if (e.key === "Enter") handleCreate() }}
          placeholder="new tag..."
          className="w-full bg-surface text-foreground text-sm px-1.5 py-0.5 border border-border focus:border-accent focus:outline-none placeholder:text-muted"
        />
        <div className="flex gap-1">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setNewColor(c)}
              className="w-4 h-4 rounded-full border-2 transition-colors duration-100"
              style={{
                backgroundColor: c,
                borderColor: newColor === c ? "var(--foreground)" : "transparent",
              }}
            />
          ))}
        </div>
        <button
          onClick={handleCreate}
          className="text-xs text-accent hover:underline"
        >
          + create tag
        </button>
      </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
