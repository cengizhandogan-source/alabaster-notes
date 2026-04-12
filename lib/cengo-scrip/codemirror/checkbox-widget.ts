import { EditorView, ViewPlugin, ViewUpdate, Decoration, WidgetType } from "@codemirror/view"
import { RangeSetBuilder } from "@codemirror/state"

const CHECKBOX_RE = /- \[([ x])\]/g

class CheckboxWidget extends WidgetType {
  constructor(
    readonly checked: boolean,
    readonly charPos: number
  ) {
    super()
  }

  eq(other: CheckboxWidget) {
    return this.checked === other.checked && this.charPos === other.charPos
  }

  toDOM(view: EditorView) {
    const input = document.createElement("input")
    input.type = "checkbox"
    input.checked = this.checked
    input.className = "cm-checkbox-widget"
    input.addEventListener("mousedown", (e) => {
      e.preventDefault()
      view.dispatch({
        changes: {
          from: this.charPos,
          to: this.charPos + 1,
          insert: this.checked ? " " : "x",
        },
      })
    })
    return input
  }

  ignoreEvent() {
    return false
  }
}

function buildDecorations(view: EditorView) {
  const builder = new RangeSetBuilder<Decoration>()
  const cursor = view.state.selection.main
  const cursorLine = view.state.doc.lineAt(cursor.head).number

  for (const { from, to } of view.visibleRanges) {
    const text = view.state.doc.sliceString(from, to)
    let match: RegExpExecArray | null
    CHECKBOX_RE.lastIndex = 0

    while ((match = CHECKBOX_RE.exec(text)) !== null) {
      const matchFrom = from + match.index
      const matchTo = matchFrom + match[0].length
      const matchLine = view.state.doc.lineAt(matchFrom).number

      // Show raw text when cursor is on the same line
      if (matchLine === cursorLine) continue

      const checked = match[1] === "x"
      // charPos points to the space or 'x' between the brackets
      const charPos = matchFrom + 3

      builder.add(
        matchFrom,
        matchTo,
        Decoration.replace({ widget: new CheckboxWidget(checked, charPos) })
      )
    }
  }

  return builder.finish()
}

export const checkboxPlugin = ViewPlugin.fromClass(
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
