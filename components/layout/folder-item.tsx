"use client"

import { useState, useRef, useEffect } from "react"
import { Folder, Note } from "@/lib/types"
import { NoteListItem } from "./note-list-item"
import { renameFolder, deleteFolder } from "@/actions/folders"
import { createNote } from "@/actions/notes"

interface FolderItemProps {
  folder: Folder
  notes: Note[]
  allFolders: Folder[]
  activeNoteId?: string
  onNoteClick?: () => void
}

export function FolderItem({ folder, notes, allFolders, activeNoteId, onNoteClick }: FolderItemProps) {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window === "undefined") return true
    const stored = localStorage.getItem(`folder-expanded-${folder.id}`)
    return stored !== null ? stored === "true" : true
  })
  const [isRenaming, setIsRenaming] = useState(false)
  const [name, setName] = useState(folder.name)
  const [showMenu, setShowMenu] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    localStorage.setItem(`folder-expanded-${folder.id}`, String(isExpanded))
  }, [isExpanded, folder.id])

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isRenaming])

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

  const handleRename = async () => {
    const trimmed = name.trim()
    if (trimmed && trimmed !== folder.name) {
      await renameFolder(folder.id, trimmed)
    } else {
      setName(folder.name)
    }
    setIsRenaming(false)
  }

  const handleDelete = async () => {
    if (confirm(`Delete folder "${folder.name}"? Notes inside will be moved to unfiled.`)) {
      await deleteFolder(folder.id)
    }
    setShowMenu(false)
  }

  const handleNewNote = async () => {
    setShowMenu(false)
    await createNote(folder.id)
  }

  return (
    <div>
      <div className="flex items-center gap-1 px-3 py-2 text-sm border-b border-border hover:bg-surface transition-colors duration-100 group">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-muted hover:text-foreground transition-colors duration-100 text-xs w-4 shrink-0"
        >
          {isExpanded ? "▼" : "▶"}
        </button>

        {isRenaming ? (
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename()
              if (e.key === "Escape") { setName(folder.name); setIsRenaming(false) }
            }}
            className="flex-1 bg-surface text-foreground text-sm px-1 py-0 border border-accent focus:outline-none min-w-0"
          />
        ) : (
          <span
            className="flex-1 truncate text-secondary font-medium cursor-pointer"
            onDoubleClick={() => setIsRenaming(true)}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {folder.name}
          </span>
        )}

        <span className="text-xs text-muted">{notes.length}</span>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-muted hover:text-foreground transition-colors duration-100 text-sm px-1 opacity-0 group-hover:opacity-100"
          >
            ...
          </button>
          {showMenu && (
            <div ref={menuRef} className="absolute right-0 top-full z-50 bg-background border border-border shadow-md py-1 min-w-[140px]">
              <button
                onClick={handleNewNote}
                className="w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-surface transition-colors duration-100"
              >
                New note
              </button>
              <button
                onClick={() => { setIsRenaming(true); setShowMenu(false) }}
                className="w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-surface transition-colors duration-100"
              >
                Rename
              </button>
              <button
                onClick={handleDelete}
                className="w-full text-left px-3 py-1.5 text-sm text-red-500 hover:bg-surface transition-colors duration-100"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {isExpanded && notes.length > 0 && (
        <div className="pl-4">
          {notes.map((note) => (
            <NoteListItem
              key={note.id}
              note={note}
              isActive={note.id === activeNoteId}
              onClick={onNoteClick}
              folders={allFolders}
            />
          ))}
        </div>
      )}
    </div>
  )
}
