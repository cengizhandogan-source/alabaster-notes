"use client"

import { Note, Folder, Tag, NoteTag } from "@/lib/types"
import { Sidebar } from "./sidebar"
import { useSidebar } from "@/hooks/use-sidebar"
import { useParams } from "next/navigation"
import { createContext, useContext } from "react"

// Context to pass sidebar toggle and notes to editor
export const SidebarContext = createContext<{ toggle: () => void; isCollapsed: boolean; toggleCollapse: () => void; notes: Note[]; tags: Tag[]; noteTags: NoteTag[] }>({ toggle: () => {}, isCollapsed: false, toggleCollapse: () => {}, notes: [], tags: [], noteTags: [] })
export const useSidebarContext = () => useContext(SidebarContext)

interface AppShellProps {
  notes: Note[]
  folders: Folder[]
  tags: Tag[]
  noteTags: NoteTag[]
  children: React.ReactNode
}

export function AppShell({ notes, folders, tags, noteTags, children }: AppShellProps) {
  const { isOpen, close, toggle, isCollapsed, toggleCollapse } = useSidebar()
  const params = useParams()
  const activeNoteId = params?.id as string | undefined

  return (
    <SidebarContext.Provider value={{ toggle, isCollapsed, toggleCollapse, notes, tags, noteTags }}>
      <div className="flex flex-col h-screen bg-background">
        {/* macOS titlebar drag region */}
        <div className="h-9 flex-shrink-0 border-b border-border drag-region" />
        <div className="flex flex-1 min-h-0">
          <Sidebar
            notes={notes}
            folders={folders}
            tags={tags}
            noteTags={noteTags}
            activeNoteId={activeNoteId}
            isOpen={isOpen}
            onClose={close}
            isCollapsed={isCollapsed}
            onToggleCollapse={toggleCollapse}
          />
          <main className="flex-1 flex flex-col min-w-0">
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  )
}
