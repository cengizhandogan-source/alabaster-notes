import { EditorView, ViewPlugin, ViewUpdate, Decoration, WidgetType } from "@codemirror/view"
import { Facet, RangeSetBuilder } from "@codemirror/state"
import type { NoteRef } from "../utils/slugify"

const NOTE_LINK_RE = /@([\w-]+)/g

export const notesListFacet = Facet.define<NoteRef[], NoteRef[]>({
  combine: (values) => values.flat(),
})

export const noteNavigateFacet = Facet.define<(id: string) => void, (id: string) => void>({
  combine: (values) => values[0] ?? (() => {}),
})

class NoteLinkWidget extends WidgetType {
  constructor(
    readonly noteRef: NoteRef,
    readonly navigate: (id: string) => void
  ) {
    super()
  }

  eq(other: NoteLinkWidget) {
    return this.noteRef.id === other.noteRef.id
  }

  toDOM() {
    const link = document.createElement("a")
    link.className = "cm-note-link-widget"
    link.textContent = `@${this.noteRef.title}`
    link.href = `/notes/${this.noteRef.id}`
    link.addEventListener("click", (e) => {
      e.preventDefault()
      this.navigate(this.noteRef.id)
    })
    return link
  }

  ignoreEvent() {
    return true
  }
}

const brokenLinkMark = Decoration.mark({ class: "cm-note-link-broken" })

function buildDecorations(view: EditorView) {
  const builder = new RangeSetBuilder<Decoration>()
  const cursor = view.state.selection.main
  const notes = view.state.facet(notesListFacet)
  const navigate = view.state.facet(noteNavigateFacet)

  for (const { from, to } of view.visibleRanges) {
    const text = view.state.doc.sliceString(from, to)
    let match: RegExpExecArray | null
    NOTE_LINK_RE.lastIndex = 0

    while ((match = NOTE_LINK_RE.exec(text)) !== null) {
      const matchFrom = from + match.index
      const matchTo = matchFrom + match[0].length

      // Show raw text when cursor is inside
      if (cursor.from <= matchTo && cursor.to >= matchFrom) continue

      const slug = match[1]
      const noteRef = notes.find((n) => n.slug === slug)

      if (noteRef) {
        builder.add(
          matchFrom,
          matchTo,
          Decoration.replace({ widget: new NoteLinkWidget(noteRef, navigate) })
        )
      } else {
        builder.add(matchFrom, matchTo, brokenLinkMark)
      }
    }
  }

  return builder.finish()
}

export const noteLinkPlugin = ViewPlugin.fromClass(
  class {
    decorations = Decoration.none

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view)
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.selectionSet) {
        this.decorations = buildDecorations(update.view)
      }
    }
  },
  { decorations: (v) => v.decorations }
)
