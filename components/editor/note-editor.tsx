"use client"

import { useMemo } from "react"
import { Note } from "@/lib/types"
import { Editor } from "./editor"
import { useSidebarContext } from "@/components/layout/app-shell"
import { toNoteRefs } from "@/lib/cengo-scrip/utils/slugify"

export function NoteEditor({ note }: { note: Note }) {
  const { toggle, isCollapsed, toggleCollapse, notes } = useSidebarContext()
  const noteRefs = useMemo(() => toNoteRefs(notes), [notes])
  return <Editor note={note} notes={noteRefs} onToggleSidebar={toggle} isSidebarCollapsed={isCollapsed} onExpandSidebar={toggleCollapse} />
}
