"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Note, Folder } from "@/lib/types"
import { moveNoteToFolder } from "@/actions/notes"

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
}: {
  note: Note
  isActive: boolean
  onClick?: () => void
  folders?: Folder[]
}) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const preview = note.content.slice(0, 60).replace(/\n/g, " ") || "empty note"

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

  return (
    <div className="relative group">
      <Link
        href={`/notes/${note.id}`}
        onClick={onClick}
        className={`block p-3 border-b border-border transition-colors duration-100 hover:bg-surface ${
          isActive
            ? "bg-surface border-l-2 border-l-accent"
            : "border-l-2 border-l-transparent"
        }`}
      >
        <div className="text-sm font-medium truncate">
          {note.title || <span className="text-muted">Untitled</span>}
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-muted truncate flex-1">{preview}</span>
          <span className="text-xs text-muted ml-2 whitespace-nowrap">
            {timeAgo(note.updated_at)}
          </span>
        </div>
      </Link>

      {folders && folders.length > 0 && (
        <div className="absolute right-2 top-2">
          <button
            onClick={(e) => { e.preventDefault(); setShowMenu(!showMenu) }}
            className="text-muted hover:text-foreground transition-colors duration-100 text-sm px-1 opacity-0 group-hover:opacity-100"
          >
            ...
          </button>
          {showMenu && (
            <div ref={menuRef} className="absolute right-0 top-full z-50 bg-background border border-border shadow-md py-1 min-w-[160px]">
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
            </div>
          )}
        </div>
      )}
    </div>
  )
}
