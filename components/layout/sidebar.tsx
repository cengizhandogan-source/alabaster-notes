"use client"

import { useState, useMemo } from "react"
import { Note, Folder } from "@/lib/types"
import { SidebarHeader } from "./sidebar-header"
import { NoteList } from "./note-list"
import { LogoutButton } from "@/components/auth/logout-button"
import { ThemeToggle } from "@/components/ui/theme-toggle"

interface SidebarProps {
  notes: Note[]
  folders: Folder[]
  activeNoteId?: string
  isOpen: boolean
  onClose: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function Sidebar({ notes, folders, activeNoteId, isOpen, onClose, isCollapsed, onToggleCollapse }: SidebarProps) {
  const [search, setSearch] = useState("")

  const { filteredNotes, filteredFolders } = useMemo(() => {
    if (!search.trim()) return { filteredNotes: notes, filteredFolders: folders }
    const q = search.toLowerCase()
    const matchedNotes = notes.filter(
      (note) =>
        note.title.toLowerCase().includes(q) ||
        note.content.toLowerCase().includes(q)
    )
    const matchedFolderIds = new Set(folders.filter(f => f.name.toLowerCase().includes(q)).map(f => f.id))
    // Also include folders that contain matching notes
    matchedNotes.forEach(n => { if (n.folder_id) matchedFolderIds.add(n.folder_id) })
    const matchedFolders = folders.filter(f => matchedFolderIds.has(f.id))
    return { filteredNotes: matchedNotes, filteredFolders: matchedFolders }
  }, [notes, folders, search])

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col border-r border-border bg-background h-screen transition-all duration-200 overflow-hidden ${isCollapsed ? "w-0 border-r-0" : "w-[280px]"}`}>
        <SidebarHeader onToggleCollapse={onToggleCollapse} search={search} onSearchChange={setSearch} />
        <NoteList notes={filteredNotes} folders={filteredFolders} allFolders={folders} activeNoteId={activeNoteId} />
        <div className="p-3 border-t border-border flex items-center justify-between">
          <LogoutButton />
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] bg-background border-r border-border flex flex-col">
            <SidebarHeader search={search} onSearchChange={setSearch} />
            <NoteList notes={filteredNotes} folders={filteredFolders} allFolders={folders} activeNoteId={activeNoteId} onNoteClick={onClose} />
            <div className="p-3 border-t border-border flex items-center justify-between">
              <LogoutButton />
              <ThemeToggle />
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
