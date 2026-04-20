"use client"

import { useEffect, useRef } from "react"
import { EditorState } from "@codemirror/state"
import { EditorView, keymap, placeholder } from "@codemirror/view"
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands"
import { markdown } from "@codemirror/lang-markdown"
import { syntaxHighlighting, HighlightStyle } from "@codemirror/language"
import { tags } from "@lezer/highlight"
import { searchKeymap } from "@codemirror/search"
import { cengoScripExtension } from "@/lib/cengo-scrip"
import type { NoteRef } from "@/lib/cengo-scrip/utils/slugify"
import type { GithubRepository } from "@/lib/types"

const markdownHighlight = syntaxHighlighting(
  HighlightStyle.define([
    { tag: tags.strong, fontWeight: "bold" },
    { tag: tags.emphasis, fontStyle: "italic" },
    { tag: tags.strikethrough, textDecoration: "line-through" },
    { tag: tags.heading1, fontSize: "1.5em", fontWeight: "500" },
    { tag: tags.heading2, fontSize: "1.25em", fontWeight: "500" },
    { tag: tags.heading3, fontSize: "1.125em", fontWeight: "500" },
    { tag: tags.link, color: "var(--accent)" },
    { tag: tags.url, color: "var(--muted)" },
    { tag: tags.monospace, color: "var(--accent)", backgroundColor: "var(--surface)" },
  ])
)

// CSS variables are used so the theme adapts to dark/light mode automatically
const alabasterTheme = EditorView.theme(
  {
    "&": {
      height: "100%",
      fontSize: "14px",
      backgroundColor: "transparent",
    },
    ".cm-content": {
      fontFamily: "var(--font-jetbrains-mono), monospace",
      padding: "16px",
      caretColor: "var(--foreground)",
    },
    ".cm-cursor": {
      borderLeftColor: "var(--foreground)",
    },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
      backgroundColor: "var(--surface) !important",
    },
    ".cm-gutters": {
      display: "none",
    },
    "&.cm-focused": {
      outline: "none",
    },
    ".cm-line": {
      color: "var(--foreground)",
    },
    ".cm-activeLine": {
      backgroundColor: "transparent",
    },
  },
  { dark: false }
) // We handle dark/light via CSS variables

interface MarkdownEditorProps {
  content: string
  onChange: (content: string) => void
  notes?: NoteRef[]
  onNavigateNote?: (noteId: string) => void
  githubRepos?: GithubRepository[]
}

export function MarkdownEditor({ content, onChange, notes, onNavigateNote, githubRepos }: MarkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!editorRef.current) return

    const state = EditorState.create({
      doc: content,
      extensions: [
        alabasterTheme,
        EditorView.lineWrapping,
        history(),
        markdown(),
        markdownHighlight,
        cengoScripExtension({
          notes,
          onNavigate: onNavigateNote,
          repos: githubRepos?.map((r) => ({ owner: r.owner, name: r.name, full_name: r.full_name, default_branch: r.default_branch })),
        }),
        placeholder("> start writing..."),
        keymap.of([
          { key: "Tab", run: (view) => { view.dispatch(view.state.replaceSelection("  ")); return true } },
          ...defaultKeymap, ...historyKeymap, ...searchKeymap,
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString())
          }
        }),
      ],
    })

    const view = new EditorView({
      state,
      parent: editorRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
    }
    // Only create the editor once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update content from outside (when switching notes)
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const currentContent = view.state.doc.toString()
    if (currentContent !== content) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentContent.length,
          insert: content,
        },
      })
    }
  }, [content])

  return (
    <div ref={editorRef} className="flex-1 overflow-auto" />
  )
}
