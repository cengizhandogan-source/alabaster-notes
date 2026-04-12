"use client"

import { useMemo } from "react"
import { Note, Folder, Tag, NoteTag } from "@/lib/types"
import { NoteListItem } from "./note-list-item"
import { FolderItem } from "./folder-item"

interface NoteListProps {
  notes: Note[]
  folders: Folder[]
  allFolders: Folder[]
  activeNoteId?: string
  onNoteClick?: () => void
  tags?: Tag[]
  noteTags?: NoteTag[]
}

function resolveNoteTags(noteId: string, tags: Tag[], noteTags: NoteTag[]): Tag[] {
  return noteTags
    .filter((nt) => nt.note_id === noteId)
    .map((nt) => tags.find((t) => t.id === nt.tag_id))
    .filter(Boolean) as Tag[]
}

export function NoteList({ notes, folders, allFolders, activeNoteId, onNoteClick, tags = [], noteTags = [] }: NoteListProps) {
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
          tags={tags}
          noteTags={noteTags}
        />
      ))}
      {unfiledNotes.map((note) => (
        <NoteListItem
          key={note.id}
          note={note}
          isActive={note.id === activeNoteId}
          onClick={onNoteClick}
          folders={allFolders}
          tags={resolveNoteTags(note.id, tags, noteTags)}
        />
      ))}
    </div>
  )
}
