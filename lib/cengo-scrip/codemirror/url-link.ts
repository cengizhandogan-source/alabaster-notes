import { EditorView, ViewPlugin, ViewUpdate, Decoration, WidgetType } from "@codemirror/view"
import { RangeSetBuilder } from "@codemirror/state"

const BARE_URL_RE = /(?<![(\[!])https?:\/\/[^\s<>\[\]"'`)\]]+[^\s<>\[\]"'`.,;:!?)\]]/g
const MD_LINK_RE = /(?<!!)\[([^\[\]]*)\]\((https?:\/\/[^)]+)\)/g

class BareUrlWidget extends WidgetType {
  constructor(readonly url: string) {
    super()
  }

  eq(other: BareUrlWidget) {
    return this.url === other.url
  }

  toDOM() {
    const link = document.createElement("a")
    link.className = "cm-url-link-widget"
    link.textContent = this.url
    link.href = this.url
    link.target = "_blank"
    link.rel = "noopener noreferrer"
    return link
  }

  ignoreEvent() {
    return true
  }
}

class MdLinkWidget extends WidgetType {
  constructor(
    readonly text: string,
    readonly url: string
  ) {
    super()
  }

  eq(other: MdLinkWidget) {
    return this.text === other.text && this.url === other.url
  }

  toDOM() {
    const link = document.createElement("a")
    link.className = "cm-url-link-widget"
    link.textContent = this.text
    link.href = this.url
    link.target = "_blank"
    link.rel = "noopener noreferrer"
    return link
  }

  ignoreEvent() {
    return true
  }
}

function buildDecorations(view: EditorView) {
  const cursor = view.state.selection.main
  const entries: Array<{ from: number; to: number; deco: Decoration }> = []

  for (const { from, to } of view.visibleRanges) {
    const text = view.state.doc.sliceString(from, to)
    const mdRanges: Array<[number, number]> = []
    let match: RegExpExecArray | null

    // Markdown links first (more specific)
    MD_LINK_RE.lastIndex = 0
    while ((match = MD_LINK_RE.exec(text)) !== null) {
      const matchFrom = from + match.index
      const matchTo = matchFrom + match[0].length
      if (cursor.from <= matchTo && cursor.to >= matchFrom) continue
      mdRanges.push([matchFrom, matchTo])
      entries.push({
        from: matchFrom,
        to: matchTo,
        deco: Decoration.replace({ widget: new MdLinkWidget(match[1], match[2]) }),
      })
    }

    // Bare URLs, skipping any inside markdown links
    BARE_URL_RE.lastIndex = 0
    while ((match = BARE_URL_RE.exec(text)) !== null) {
      const matchFrom = from + match.index
      const matchTo = matchFrom + match[0].length
      if (cursor.from <= matchTo && cursor.to >= matchFrom) continue
      const insideMdLink = mdRanges.some(
        ([mdFrom, mdTo]) => matchFrom >= mdFrom && matchTo <= mdTo
      )
      if (insideMdLink) continue
      entries.push({
        from: matchFrom,
        to: matchTo,
        deco: Decoration.replace({ widget: new BareUrlWidget(match[0]) }),
      })
    }
  }

  entries.sort((a, b) => a.from - b.from || a.to - b.to)
  const builder = new RangeSetBuilder<Decoration>()
  for (const e of entries) {
    builder.add(e.from, e.to, e.deco)
  }
  return builder.finish()
}

export const urlLinkPlugin = ViewPlugin.fromClass(
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
