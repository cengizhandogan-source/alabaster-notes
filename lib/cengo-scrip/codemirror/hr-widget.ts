import { EditorView, ViewPlugin, ViewUpdate, Decoration, WidgetType } from "@codemirror/view"
import { RangeSetBuilder } from "@codemirror/state"

const HR_RE = /^---$/gm

class HrWidget extends WidgetType {
  eq() {
    return true
  }

  toDOM() {
    const hr = document.createElement("hr")
    hr.className = "cm-hr-widget"
    return hr
  }
}

const hrDecoration = Decoration.replace({ widget: new HrWidget() })

function buildDecorations(view: EditorView) {
  const builder = new RangeSetBuilder<Decoration>()
  const cursor = view.state.selection.main
  const cursorLine = view.state.doc.lineAt(cursor.head).number

  for (const { from, to } of view.visibleRanges) {
    const text = view.state.doc.sliceString(from, to)
    let match: RegExpExecArray | null
    HR_RE.lastIndex = 0

    while ((match = HR_RE.exec(text)) !== null) {
      const matchFrom = from + match.index
      const matchTo = matchFrom + match[0].length
      const matchLine = view.state.doc.lineAt(matchFrom).number

      if (matchLine === cursorLine) continue

      builder.add(matchFrom, matchTo, hrDecoration)
    }
  }

  return builder.finish()
}

export const hrPlugin = ViewPlugin.fromClass(
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
