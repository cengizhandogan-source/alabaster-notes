"use client"

import { useState, useRef, useEffect } from "react"
import { AnimatePresence, motion } from "motion/react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import Link from "next/link"
import { Note, Folder, Tag } from "@/lib/types"
import { moveNoteToFolder } from "@/actions/notes"
import { GripVertical, FileText } from "lucide-react"

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function NoteListItem({
  note,
  isActive,
  onClick,
  folders,
  tags,
  depth = 0,
}: {
  note: Note
  isActive: boolean
  onClick?: () => void
  folders?: Folder[]
  tags?: Tag[]
  depth?: number
}) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const preview = note.content.slice(0, 60).replace(/\n/g, " ") || "empty note"

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: note.id,
    data: { type: "note", item: note },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  useEffect(() => {
    if (!showMenu) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showMenu])

  const handleMove = async (folderId: string | null) => {
    setShowMenu(false)
    await moveNoteToFolder(note.id, folderId)
  }

  const indent = Math.min(depth, 5)

  return (
    <div ref={setNodeRef} style={style} className={`relative group ${showMenu ? "z-50" : ""}`}>
      <div className="flex">
        <div
          className="flex items-center justify-center shrink-0 text-muted hover:text-foreground cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 [@media(pointer:coarse)]:opacity-100 transition-opacity duration-100"
          style={{ width: "20px", marginLeft: `${indent * 16}px` }}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={12} />
        </div>
        <Link
          href={`/notes/${note.id}`}
          onClick={onClick}
          className={`block flex-1 p-2 pr-3 border-b border-border transition-colors duration-100 hover:bg-surface ${
            isActive
              ? "bg-surface border-l-2 border-l-accent"
              : "border-l-2 border-l-transparent"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <FileText size={13} className="text-muted shrink-0" />
            <span className="text-sm font-medium truncate">
              {note.title || <span className="text-muted">Untitled</span>}
            </span>
          </div>
          <div className="flex items-center justify-between mt-0.5 ml-[19px]">
            <span className="text-xs text-muted truncate flex-1">{preview}</span>
            <span className="text-xs text-muted ml-2 whitespace-nowrap">
              {timeAgo(note.updated_at)}
            </span>
          </div>
          {tags && tags.length > 0 && (
            <div className="flex gap-1 mt-1 ml-[19px] flex-wrap max-h-[36px] overflow-hidden">
              {tags.map((tag) => (
                <span
                  key={tag.id}
                  className="text-[11px] px-1.5 py-0.5 rounded-sm"
                  style={{ backgroundColor: tag.color + "20", color: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </Link>
      </div>

      {folders && folders.length > 0 && (
        <div className="absolute right-2 top-2">
          <button
            onClick={(e) => { e.preventDefault(); setShowMenu(!showMenu) }}
            className="text-muted hover:text-foreground transition-colors duration-100 text-sm p-2 opacity-0 group-hover:opacity-100 [@media(pointer:coarse)]:opacity-100"
          >
            ...
          </button>
          <AnimatePresence>
            {showMenu && (
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 top-full z-50 bg-background border border-border shadow-md py-1 min-w-[160px]"
              >
                <div className="px-3 py-1 text-xs text-muted">Move to</div>
                {note.folder_id && (
                  <button
                    onClick={() => handleMove(null)}
                    className="w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-surface transition-colors duration-100"
                  >
                    Unfiled
                  </button>
                )}
                {folders.filter(f => f.id !== note.folder_id).map(folder => (
                  <button
                    key={folder.id}
                    onClick={() => handleMove(folder.id)}
                    className="w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-surface transition-colors duration-100 truncate"
                  >
                    {folder.name}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
