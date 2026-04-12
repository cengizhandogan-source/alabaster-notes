"use client"

import { useMemo } from "react"
import { Note } from "@/lib/types"
import { Editor } from "./editor"
import { useSidebarContext } from "@/components/layout/app-shell"
import { toNoteRefs } from "@/lib/cengo-scrip/utils/slugify"

export function NoteEditor({ note }: { note: Note }) {
  const { toggle, isCollapsed, toggleCollapse, notes, tags, noteTags } = useSidebarContext()
  const noteRefs = useMemo(() => toNoteRefs(notes), [notes])
  const noteTagIds = useMemo(() => noteTags.filter((nt) => nt.note_id === note.id).map((nt) => nt.tag_id), [noteTags, note.id])
  return <Editor note={note} notes={noteRefs} onToggleSidebar={toggle} isSidebarCollapsed={isCollapsed} onExpandSidebar={toggleCollapse} allTags={tags} noteTagIds={noteTagIds} />
}
