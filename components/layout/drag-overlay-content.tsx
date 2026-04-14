"use client"

import { Folder as FolderIcon, FileText } from "lucide-react"
import { Note, Folder } from "@/lib/types"

interface DragOverlayContentProps {
  type: "note" | "folder"
  item: Note | Folder
}

export function DragOverlayContent({ type, item }: DragOverlayContentProps) {
  if (type === "folder") {
    const folder = item as Folder
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-background border border-accent/50 shadow-lg rounded-sm text-sm opacity-90 max-w-[240px]">
        <FolderIcon size={14} className="text-muted shrink-0" />
        <span className="truncate font-medium">{folder.name}</span>
      </div>
    )
  }

  const note = item as Note
  return (
    <div className="px-3 py-2 bg-background border border-accent/50 shadow-lg rounded-sm text-sm opacity-90 max-w-[240px]">
      <div className="flex items-center gap-2">
        <FileText size={14} className="text-muted shrink-0" />
        <span className="truncate font-medium">{note.title || "Untitled"}</span>
      </div>
      <div className="text-xs text-muted truncate mt-0.5">
        {note.content.slice(0, 40).replace(/\n/g, " ") || "empty note"}
      </div>
    </div>
  )
}
