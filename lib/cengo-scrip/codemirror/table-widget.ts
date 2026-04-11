import { EditorView, ViewPlugin, ViewUpdate, Decoration, WidgetType } from "@codemirror/view"
import { RangeSetBuilder } from "@codemirror/state"
import { generateMarkdownTable } from "../utils/table-generator"

const TABLE_RE = /\\table\[\s*(\d+)\s*,\s*(\d+)\s*\]/g

function markdownTableToDOM(md: string): HTMLTableElement {
  const lines = md.trim().split("\n")
  const table = document.createElement("table")

  // Header row
  const thead = document.createElement("thead")
  const headerRow = document.createElement("tr")
  const headerCells = lines[0].split("|").filter((c) => c.trim() !== "")
  for (const cell of headerCells) {
    const th = document.createElement("th")
    th.textContent = cell.trim()
    headerRow.appendChild(th)
  }
  thead.appendChild(headerRow)
  table.appendChild(thead)

  // Data rows (skip line 1 which is the separator)
  const tbody = document.createElement("tbody")
  for (let i = 2; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const row = document.createElement("tr")
    const cells = lines[i].split("|").filter((c) => c.trim() !== "" || c === " ")
    for (const cell of cells) {
      const td = document.createElement("td")
      td.textContent = cell.trim() || "\u00a0"
      row.appendChild(td)
    }
    tbody.appendChild(row)
  }
  table.appendChild(tbody)

  return table
}

class TableWidget extends WidgetType {
  constructor(
    readonly cols: number,
    readonly rows: number
  ) {
    super()
  }

  eq(other: TableWidget) {
    return this.cols === other.cols && this.rows === other.rows
  }

  toDOM() {
    const wrapper = document.createElement("div")
    wrapper.className = "cm-table-widget"
    const md = generateMarkdownTable(this.cols, this.rows)
    wrapper.appendChild(markdownTableToDOM(md))
    return wrapper
  }

  ignoreEvent() {
    return true
  }
}

function buildDecorations(view: EditorView) {
  const builder = new RangeSetBuilder<Decoration>()

  for (const { from, to } of view.visibleRanges) {
    const text = view.state.doc.sliceString(from, to)
    let match: RegExpExecArray | null
    TABLE_RE.lastIndex = 0

    while ((match = TABLE_RE.exec(text)) !== null) {
      const matchFrom = from + match.index
      const line = view.state.doc.lineAt(matchFrom)
      builder.add(
        line.to,
        line.to,
        Decoration.widget({
          widget: new TableWidget(parseInt(match[1], 10), parseInt(match[2], 10)),
          block: true,
          side: 1,
        })
      )
    }
  }

  return builder.finish()
}

export const tablePreviewPlugin = ViewPlugin.fromClass(
  class {
    decorations = Decoration.none

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view)
    }

    update(update: ViewUpdate) {
      if (update.docChanged) {
        this.decorations = buildDecorations(update.view)
      }
    }
  },
  { decorations: (v) => v.decorations }
)
