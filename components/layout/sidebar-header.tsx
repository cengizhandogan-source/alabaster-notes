"use client"

import { useState } from "react"
import Image from "next/image"
import { createNote } from "@/actions/notes"
import { createFolder } from "@/actions/folders"
import { Tag } from "@/lib/types"
import { TagManager } from "./tag-manager"
import { FolderPlus } from "lucide-react"

interface SidebarHeaderProps {
  onToggleCollapse?: () => void
  search: string
  onSearchChange: (value: string) => void
  tags?: Tag[]
}

export function SidebarHeader({ onToggleCollapse, search, onSearchChange, tags = [] }: SidebarHeaderProps) {
  const [showTagManager, setShowTagManager] = useState(false)

  const handleNewNote = async () => {
    await createNote()
  }

  const handleNewFolder = async () => {
    await createFolder()
  }

  return (
    <div className="p-3 border-b border-border space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Alabaster Notes" width={28} height={28} />
          <span className="text-sm font-medium text-foreground">Alabaster Notes</span>
        </div>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="text-secondary hover:text-foreground transition-colors duration-100 text-sm"
            title="Collapse sidebar"
          >
            «
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
      <div className="flex-1 relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted text-sm">
          {">"}
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="search..."
          className="w-full bg-surface text-foreground text-sm pl-6 pr-2 py-2 border border-border focus:border-accent focus:outline-none placeholder:text-muted"
        />
      </div>
      <div className="relative">
        <button
          onClick={() => setShowTagManager(!showTagManager)}
          className="text-secondary hover:text-foreground transition-colors duration-100 text-sm px-2.5 py-1.5 border border-border hover:border-accent"
          title="Manage tags"
        >
          #
        </button>
        <TagManager tags={tags} isOpen={showTagManager} onClose={() => setShowTagManager(false)} />
      </div>
      <button
        onClick={handleNewFolder}
        className="text-secondary hover:text-foreground transition-colors duration-100 text-sm px-2.5 py-1.5 border border-border hover:border-accent"
        title="New folder"
      >
        <FolderPlus size={15} />
      </button>
      <button
        onClick={handleNewNote}
        className="text-secondary hover:text-foreground transition-colors duration-100 text-lg px-2.5 py-1.5 border border-border hover:border-accent"
        title="New note"
      >
        +
      </button>
    </div>
    </div>
  )
}
