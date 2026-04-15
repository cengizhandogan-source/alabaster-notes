import { EditorView, ViewPlugin, ViewUpdate, Decoration } from "@codemirror/view"
import { RangeSetBuilder } from "@codemirror/state"
import { readOnlyFacet } from "../facets"

const BOLD_RE = /\*\*(?!\s)(.+?)(?<!\s)\*\*/g
const ITALIC_RE = /(?<!\*)\*(?!\*|\s)(.+?)(?<!\s|\*)\*(?!\*)/g
const STRIKE_RE = /~~(?!\s)(.+?)(?<!\s)~~/g
const HEADING_RE = /^(#{1,3})\s/gm

interface MarkerRange {
  from: number
  to: number
}

function buildDecorations(view: EditorView) {
  const isReadOnly = view.state.facet(readOnlyFacet)
  const cursor = view.state.selection.main
  const markers: MarkerRange[] = []

  for (const { from, to } of view.visibleRanges) {
    const text = view.state.doc.sliceString(from, to)

    // Bold: **text** — process first so italic doesn't partial-match
    BOLD_RE.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = BOLD_RE.exec(text)) !== null) {
      const matchFrom = from + match.index
      const matchTo = matchFrom + match[0].length
      if (!isReadOnly && cursor.from <= matchTo && cursor.to >= matchFrom) continue
      markers.push({ from: matchFrom, to: matchFrom + 2 })
      markers.push({ from: matchTo - 2, to: matchTo })
    }

    // Italic: *text*
    ITALIC_RE.lastIndex = 0
    while ((match = ITALIC_RE.exec(text)) !== null) {
      const matchFrom = from + match.index
      const matchTo = matchFrom + match[0].length
      if (!isReadOnly && cursor.from <= matchTo && cursor.to >= matchFrom) continue
      // Skip if this * is part of a ** bold marker already handled
      const openChar = text[match.index - 1]
      const closeChar = text[match.index + match[0].length]
      if (openChar === "*" || closeChar === "*") continue
      markers.push({ from: matchFrom, to: matchFrom + 1 })
      markers.push({ from: matchTo - 1, to: matchTo })
    }

    // Strikethrough: ~~text~~
    STRIKE_RE.lastIndex = 0
    while ((match = STRIKE_RE.exec(text)) !== null) {
      const matchFrom = from + match.index
      const matchTo = matchFrom + match[0].length
      if (!isReadOnly && cursor.from <= matchTo && cursor.to >= matchFrom) continue
      markers.push({ from: matchFrom, to: matchFrom + 2 })
      markers.push({ from: matchTo - 2, to: matchTo })
    }

    // Headings: # , ## , ###
    HEADING_RE.lastIndex = 0
    while ((match = HEADING_RE.exec(text)) !== null) {
      const matchFrom = from + match.index
      const matchTo = matchFrom + match[0].length
      const line = view.state.doc.lineAt(matchFrom)
      const cursorLine = view.state.doc.lineAt(cursor.from)
      if (!isReadOnly && line.number === cursorLine.number) continue
      markers.push({ from: matchFrom, to: matchTo })
    }
  }

  // RangeSetBuilder requires sorted, non-overlapping ranges
  markers.sort((a, b) => a.from - b.from || a.to - b.to)

  const builder = new RangeSetBuilder<Decoration>()
  for (const m of markers) {
    builder.add(m.from, m.to, Decoration.replace({}))
  }
  return builder.finish()
}

export const inlineFormatPlugin = ViewPlugin.fromClass(
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
