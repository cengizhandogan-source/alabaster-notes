"use client"

import { useState, useMemo } from "react"
import { Note, Folder, Tag, NoteTag } from "@/lib/types"
import { SidebarHeader } from "./sidebar-header"
import { TagFilter } from "./tag-filter"
import { NoteList } from "./note-list"
import { LogoutButton } from "@/components/auth/logout-button"
import { ThemeToggle } from "@/components/ui/theme-toggle"

interface SidebarProps {
  notes: Note[]
  folders: Folder[]
  tags: Tag[]
  noteTags: NoteTag[]
  activeNoteId?: string
  isOpen: boolean
  onClose: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function Sidebar({ notes, folders, tags, noteTags, activeNoteId, isOpen, onClose, isCollapsed, onToggleCollapse }: SidebarProps) {
  const [search, setSearch] = useState("")
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])

  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  const { filteredNotes, filteredFolders } = useMemo(() => {
    let matchedNotes = notes

    if (search.trim()) {
      const q = search.toLowerCase()
      matchedNotes = matchedNotes.filter(
        (note) =>
          note.title.toLowerCase().includes(q) ||
          note.content.toLowerCase().includes(q)
      )
    }

    if (selectedTagIds.length > 0) {
      const noteTagMap = new Map<string, Set<string>>()
      for (const nt of noteTags) {
        if (!noteTagMap.has(nt.note_id)) noteTagMap.set(nt.note_id, new Set())
        noteTagMap.get(nt.note_id)!.add(nt.tag_id)
      }
      matchedNotes = matchedNotes.filter((note) => {
        const tags = noteTagMap.get(note.id)
        return tags && selectedTagIds.every((id) => tags.has(id))
      })
    }

    const matchedFolderIds = new Set(folders.filter(f => f.name.toLowerCase().includes(search.toLowerCase())).map(f => f.id))
    matchedNotes.forEach(n => { if (n.folder_id) matchedFolderIds.add(n.folder_id) })
    const matchedFolders = folders.filter(f => matchedFolderIds.has(f.id))
    return { filteredNotes: matchedNotes, filteredFolders: matchedFolders }
  }, [notes, folders, noteTags, search, selectedTagIds])

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col border-r border-border bg-background h-screen transition-all duration-200 ${isCollapsed ? "w-0 border-r-0 overflow-hidden" : "w-[280px]"}`}>
        <SidebarHeader onToggleCollapse={onToggleCollapse} search={search} onSearchChange={setSearch} tags={tags} />
        <TagFilter tags={tags} selectedTagIds={selectedTagIds} onToggleTag={handleToggleTag} />
        <NoteList notes={filteredNotes} folders={filteredFolders} allFolders={folders} activeNoteId={activeNoteId} tags={tags} noteTags={noteTags} />
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
            <SidebarHeader search={search} onSearchChange={setSearch} tags={tags} />
            <TagFilter tags={tags} selectedTagIds={selectedTagIds} onToggleTag={handleToggleTag} />
            <NoteList notes={filteredNotes} folders={filteredFolders} allFolders={folders} activeNoteId={activeNoteId} onNoteClick={onClose} tags={tags} noteTags={noteTags} />
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
