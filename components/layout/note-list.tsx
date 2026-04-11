"use client"

import { useMemo } from "react"
import { Note, Folder } from "@/lib/types"
import { NoteListItem } from "./note-list-item"
import { FolderItem } from "./folder-item"

interface NoteListProps {
  notes: Note[]
  folders: Folder[]
  allFolders: Folder[]
  activeNoteId?: string
  onNoteClick?: () => void
}

export function NoteList({ notes, folders, allFolders, activeNoteId, onNoteClick }: NoteListProps) {
  const { folderNotes, unfiledNotes } = useMemo(() => {
    const folderNotes = new Map<string, Note[]>()
    const unfiledNotes: Note[] = []

    for (const note of notes) {
      if (note.folder_id) {
        const existing = folderNotes.get(note.folder_id) ?? []
        existing.push(note)
        folderNotes.set(note.folder_id, existing)
      } else {
        unfiledNotes.push(note)
      }
    }

    return { folderNotes, unfiledNotes }
  }, [notes])

  if (folders.length === 0 && notes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-muted text-sm">no notes yet</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {folders.map((folder) => (
        <FolderItem
          key={folder.id}
          folder={folder}
          notes={folderNotes.get(folder.id) ?? []}
          allFolders={allFolders}
          activeNoteId={activeNoteId}
          onNoteClick={onNoteClick}
        />
      ))}
      {unfiledNotes.map((note) => (
        <NoteListItem
          key={note.id}
          note={note}
          isActive={note.id === activeNoteId}
          onClick={onNoteClick}
          folders={allFolders}
        />
      ))}
    </div>
  )
}
