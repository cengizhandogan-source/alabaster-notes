"use client"

import { useState, useMemo } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Note, Folder, FolderTreeNode, Tag, NoteTag, FolderTag } from "@/lib/types"
import { SidebarHeader } from "./sidebar-header"
import { TagFilter } from "./tag-filter"
import { NoteList } from "./note-list"
import { DndProvider } from "./dnd-provider"
import { LogoutButton } from "@/components/auth/logout-button"
import { ThemeToggle } from "@/components/ui/theme-toggle"

interface SidebarProps {
  notes: Note[]
  folders: Folder[]
  folderTree: FolderTreeNode[]
  unfiledNotes: Note[]
  tags: Tag[]
  noteTags: NoteTag[]
  folderTags: FolderTag[]
  activeNoteId?: string
  isOpen: boolean
  onClose: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

function filterTree(
  tree: FolderTreeNode[],
  matchedNoteIds: Set<string>,
  searchLower: string
): FolderTreeNode[] {
  return tree
    .map((node) => {
      const filteredChildren = filterTree(node.children, matchedNoteIds, searchLower)
      const filteredNotes = node.notes.filter((n) => matchedNoteIds.has(n.id))
      const nameMatches = node.name.toLowerCase().includes(searchLower)

      if (filteredChildren.length > 0 || filteredNotes.length > 0 || nameMatches) {
        return {
          ...node,
          children: filteredChildren,
          notes: nameMatches ? node.notes : filteredNotes,
        }
      }
      return null
    })
    .filter(Boolean) as FolderTreeNode[]
}

export function Sidebar({ notes, folders, folderTree, unfiledNotes, tags, noteTags, folderTags, activeNoteId, isOpen, onClose, isCollapsed, onToggleCollapse }: SidebarProps) {
  const [search, setSearch] = useState("")
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])

  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  const { filteredTree, filteredUnfiled } = useMemo(() => {
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
        const nTags = noteTagMap.get(note.id)
        return nTags && selectedTagIds.every((id) => nTags.has(id))
      })
    }

    const matchedNoteIds = new Set(matchedNotes.map((n) => n.id))
    const isFiltering = search.trim() || selectedTagIds.length > 0

    if (!isFiltering) {
      return { filteredTree: folderTree, filteredUnfiled: unfiledNotes }
    }

    const searchLower = search.toLowerCase()
    return {
      filteredTree: filterTree(folderTree, matchedNoteIds, searchLower),
      filteredUnfiled: unfiledNotes.filter((n) => matchedNoteIds.has(n.id)),
    }
  }, [notes, folderTree, unfiledNotes, noteTags, search, selectedTagIds])

  const sidebarContent = (
    <>
      <SidebarHeader onToggleCollapse={onClose} search={search} onSearchChange={setSearch} tags={tags} />
      <TagFilter tags={tags} selectedTagIds={selectedTagIds} onToggleTag={handleToggleTag} />
      <DndProvider folderTree={filteredTree} unfiledNotes={filteredUnfiled} allFolders={folders} allNotes={notes}>
        <NoteList
          folderTree={filteredTree}
          unfiledNotes={filteredUnfiled}
          allFolders={folders}
          activeNoteId={activeNoteId}
          onNoteClick={onClose}
          tags={tags}
          noteTags={noteTags}
          folderTags={folderTags}
        />
      </DndProvider>
      <div className="p-3 border-t border-border flex items-center justify-between safe-bottom">
        <LogoutButton />
        <ThemeToggle />
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col border-r border-border bg-background h-full transition-all duration-200 ${isCollapsed ? "w-0 border-r-0 overflow-hidden" : "w-[280px]"}`}>
        <SidebarHeader onToggleCollapse={onToggleCollapse} search={search} onSearchChange={setSearch} tags={tags} />
        <TagFilter tags={tags} selectedTagIds={selectedTagIds} onToggleTag={handleToggleTag} />
        <DndProvider folderTree={filteredTree} unfiledNotes={filteredUnfiled} allFolders={folders} allNotes={notes}>
          <NoteList
            folderTree={filteredTree}
            unfiledNotes={filteredUnfiled}
            allFolders={folders}
            activeNoteId={activeNoteId}
            tags={tags}
            noteTags={noteTags}
            folderTags={folderTags}
          />
        </DndProvider>
        <div className="p-3 border-t border-border flex items-center justify-between safe-bottom">
          <LogoutButton />
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/50"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute left-0 top-0 bottom-0 w-[280px] max-w-[calc(100vw-48px)] bg-background border-r border-border flex flex-col safe-top"
            >
              {sidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
