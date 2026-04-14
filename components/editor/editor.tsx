"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Note, Tag, GithubRepository } from "@/lib/types"
import { updateNote, deleteNote } from "@/actions/notes"
import { uploadAndGetMarkdown } from "@/lib/upload"
import { useAutoSave } from "@/hooks/use-auto-save"
import { EditorToolbar } from "./editor-toolbar"
import { MarkdownEditor } from "./markdown-editor"
import type { NoteRef } from "@/lib/cengo-scrip/utils/slugify"

interface EditorProps {
  note: Note
  notes?: NoteRef[]
  onToggleSidebar?: () => void
  isSidebarCollapsed?: boolean
  onExpandSidebar?: () => void
  allTags?: Tag[]
  noteTagIds?: string[]
  githubRepos?: GithubRepository[]
  githubConnected?: boolean
}

export function Editor({ note, notes, onToggleSidebar, isSidebarCollapsed, onExpandSidebar, allTags = [], noteTagIds = [], githubRepos = [], githubConnected = false }: EditorProps) {
  const router = useRouter()
  const onNavigateNote = useCallback((id: string) => router.push(`/notes/${id}`), [router])
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)

  const titleRef = useRef(title)
  const contentRef = useRef(content)
  titleRef.current = title
  contentRef.current = content

  // Reset state only when switching to a different note
  useEffect(() => {
    setTitle(note.title)
    setContent(note.content)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id])

  const saveFn = useCallback(async () => {
    await updateNote(note.id, titleRef.current, contentRef.current)
  }, [note.id])

  const { status, trigger, flush } = useAutoSave(saveFn)

  // Trigger auto-save on changes
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    trigger()
  }

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    trigger()
  }

  // Cmd+S to force save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        flush()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [flush])

  // Flush on unmount
  const flushRef = useRef(flush)
  flushRef.current = flush
  useEffect(() => {
    return () => flushRef.current()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleUploadFile = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*,.pdf,.csv,.doc,.docx,.xls,.xlsx,.txt,.zip"
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const markdown = await uploadAndGetMarkdown(file)
        const separator = contentRef.current.length > 0 ? "\n\n" : ""
        handleContentChange(contentRef.current + separator + markdown)
      } catch {
        // Upload failed silently — drag-drop/paste have inline error handling
      }
    }
    input.click()
  }

  const handleDelete = async () => {
    if (confirm("delete this note?")) {
      await deleteNote(note.id)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      <EditorToolbar
        title={title}
        onTitleChange={handleTitleChange}
        status={status}
        onDelete={handleDelete}
        onUploadFile={handleUploadFile}
        onToggleSidebar={onToggleSidebar}
        isSidebarCollapsed={isSidebarCollapsed}
        onExpandSidebar={onExpandSidebar}
        noteKey={note.note_key}
      />
      <MarkdownEditor content={content} onChange={handleContentChange} notes={notes} onNavigateNote={onNavigateNote} githubRepos={githubRepos} />
    </div>
  )
}
