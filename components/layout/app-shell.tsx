"use client"

import { Note, Folder, FolderTreeNode, Tag, NoteTag, FolderTag, GithubRepository } from "@/lib/types"
import { Sidebar } from "./sidebar"
import { useSidebar } from "@/hooks/use-sidebar"
import { useParams } from "next/navigation"
import { createContext, useContext, useEffect, useState } from "react"

declare global {
  interface Window {
    electronAPI?: {
      platform: string
      getSettings: () => Promise<Record<string, string>>
      saveSettings: (settings: Record<string, string>) => Promise<boolean>
    }
  }
}

export const SidebarContext = createContext<{
  toggle: () => void
  isCollapsed: boolean
  toggleCollapse: () => void
  notes: Note[]
  folders: Folder[]
  tags: Tag[]
  noteTags: NoteTag[]
  folderTags: FolderTag[]
  githubRepos: GithubRepository[]
  githubConnected: boolean
}>({
  toggle: () => {},
  isCollapsed: false,
  toggleCollapse: () => {},
  notes: [],
  folders: [],
  tags: [],
  noteTags: [],
  folderTags: [],

  githubRepos: [],
  githubConnected: false,
})
export const useSidebarContext = () => useContext(SidebarContext)

interface AppShellProps {
  notes: Note[]
  folders: Folder[]
  folderTree: FolderTreeNode[]
  unfiledNotes: Note[]
  tags: Tag[]
  noteTags: NoteTag[]
  folderTags: FolderTag[]
  githubRepos: GithubRepository[]
  githubConnected: boolean
  children: React.ReactNode
}

export function AppShell({ notes, folders, folderTree, unfiledNotes, tags, noteTags, folderTags, githubRepos, githubConnected, children }: AppShellProps) {
  const { isOpen, close, toggle, isCollapsed, toggleCollapse } = useSidebar()
  const params = useParams()
  const activeNoteId = params?.id as string | undefined
  const [isElectron, setIsElectron] = useState(false)

  useEffect(() => {
    if (window.electronAPI) setIsElectron(true)
  }, [])

  return (
    <SidebarContext.Provider value={{ toggle, isCollapsed, toggleCollapse, notes, folders, tags, noteTags, folderTags, githubRepos, githubConnected }}>
      <div className="flex flex-col h-screen bg-background safe-top safe-left safe-right">
        {isElectron && <div className="h-9 flex-shrink-0 border-b border-border drag-region" />}
        <div className="flex flex-1 min-h-0">
          <Sidebar
            notes={notes}
            folders={folders}
            folderTree={folderTree}
            unfiledNotes={unfiledNotes}
            tags={tags}
            noteTags={noteTags}
            folderTags={folderTags}
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
