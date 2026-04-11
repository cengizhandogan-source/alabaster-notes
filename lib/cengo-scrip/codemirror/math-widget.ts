import { EditorView, ViewPlugin, ViewUpdate, Decoration, WidgetType } from "@codemirror/view"
import { RangeSetBuilder } from "@codemirror/state"
import katex from "katex"

const MATH_RE = /(?<!\$)\$(?!\$)(?!\s)(.+?)(?<!\s)\$(?!\$)/g

class MathWidget extends WidgetType {
  constructor(readonly tex: string) {
    super()
  }

  eq(other: MathWidget) {
    return this.tex === other.tex
  }

  toDOM() {
    const span = document.createElement("span")
    span.className = "cm-math-widget"
    try {
      span.innerHTML = katex.renderToString(this.tex, {
        throwOnError: false,
        displayMode: false,
      })
    } catch {
      span.textContent = this.tex
      span.classList.add("cm-math-widget-error")
    }
    return span
  }

  ignoreEvent() {
    return false
  }
}

function buildDecorations(view: EditorView) {
  const builder = new RangeSetBuilder<Decoration>()
  const cursor = view.state.selection.main

  for (const { from, to } of view.visibleRanges) {
    const text = view.state.doc.sliceString(from, to)
    let match: RegExpExecArray | null
    MATH_RE.lastIndex = 0

    while ((match = MATH_RE.exec(text)) !== null) {
      const matchFrom = from + match.index
      const matchTo = matchFrom + match[0].length

      // Show raw text when cursor is inside the match
      if (cursor.from <= matchTo && cursor.to >= matchFrom) continue

      builder.add(
        matchFrom,
        matchTo,
        Decoration.replace({ widget: new MathWidget(match[1]) })
      )
    }
  }

  return builder.finish()
}

export const mathPreviewPlugin = ViewPlugin.fromClass(
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
