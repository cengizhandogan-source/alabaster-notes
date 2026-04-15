"use client"

import { useEffect, useRef } from "react"
import { EditorState } from "@codemirror/state"
import { EditorView } from "@codemirror/view"
import { markdown } from "@codemirror/lang-markdown"
import { syntaxHighlighting, HighlightStyle } from "@codemirror/language"
import { tags } from "@lezer/highlight"
import { cengoScripExtension } from "@/lib/cengo-scrip"

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

const viewerTheme = EditorView.theme(
  {
    "&": {
      height: "100%",
      fontSize: "14px",
      backgroundColor: "transparent",
    },
    ".cm-content": {
      fontFamily: "var(--font-jetbrains-mono), monospace",
      padding: "16px",
    },
    ".cm-cursor": {
      display: "none !important",
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
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
      backgroundColor: "transparent !important",
    },
  },
  { dark: false }
)

interface SharedNoteViewerProps {
  content: string
}

export function SharedNoteViewer({ content }: SharedNoteViewerProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editorRef.current) return

    const state = EditorState.create({
      doc: content,
      extensions: [
        viewerTheme,
        EditorView.lineWrapping,
        EditorState.readOnly.of(true),
        EditorView.editable.of(false),
        markdown(),
        markdownHighlight,
        cengoScripExtension({ readOnly: true }),
      ],
    })

    const view = new EditorView({
      state,
      parent: editorRef.current,
    })

    return () => view.destroy()
  }, [content])

  return <div ref={editorRef} className="flex-1 overflow-auto" />
}
