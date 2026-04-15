"use client"

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useDroppable } from "@dnd-kit/core"
import { Note, Folder, FolderTreeNode, Tag, NoteTag, FolderTag } from "@/lib/types"
import { NoteListItem } from "./note-list-item"
import { FolderTreeItem } from "./folder-item"
import { useDndState } from "./dnd-provider"
import { Inbox } from "lucide-react"

interface NoteListProps {
  folderTree: FolderTreeNode[]
  unfiledNotes: Note[]
  allFolders: Folder[]
  activeNoteId?: string
  onNoteClick?: () => void
  tags?: Tag[]
  noteTags?: NoteTag[]
  folderTags?: FolderTag[]
}

function resolveNoteTags(noteId: string, tags: Tag[], noteTags: NoteTag[]): Tag[] {
  return noteTags
    .filter((nt) => nt.note_id === noteId)
    .map((nt) => tags.find((t) => t.id === nt.tag_id))
    .filter(Boolean) as Tag[]
}

function UnfiledDropZone() {
  const { setNodeRef, isOver } = useDroppable({
    id: "folder-drop-unfiled",
    data: { type: "folder-drop", folderId: null },
  })
  const dndState = useDndState()

  if (!dndState.isDragging) return null

  return (
    <div
      ref={setNodeRef}
      className={`flex items-center justify-center gap-2 py-3 mx-2 my-1 border border-dashed rounded-sm text-xs text-muted transition-colors duration-100 ${
        isOver ? "border-accent bg-accent/5 text-accent" : "border-border"
      }`}
    >
      <Inbox size={14} />
      Drop here to unfile
    </div>
  )
}

export function NoteList({ folderTree, unfiledNotes, allFolders, activeNoteId, onNoteClick, tags = [], noteTags = [], folderTags = [] }: NoteListProps) {
  const rootFolderIds = folderTree.map((f) => f.id)
  const unfiledNoteIds = unfiledNotes.map((n) => n.id)

  if (folderTree.length === 0 && unfiledNotes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-muted text-sm">no notes yet</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden">
      <SortableContext items={[...rootFolderIds, ...unfiledNoteIds]} strategy={verticalListSortingStrategy}>
        {folderTree.map((node) => (
          <FolderTreeItem
            key={node.id}
            node={node}
            allFolders={allFolders}
            activeNoteId={activeNoteId}
            onNoteClick={onNoteClick}
            tags={tags}
            noteTags={noteTags}
            folderTags={folderTags}
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
      </SortableContext>
      <UnfiledDropZone />
    </div>
  )
}
