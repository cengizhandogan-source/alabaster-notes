import { EditorView, Decoration, WidgetType, DecorationSet } from "@codemirror/view"
import { EditorState, StateField, StateEffect, Range } from "@codemirror/state"
import { readOnlyFacet } from "../facets"

const tableSyncEffect = StateEffect.define<null>()

const SEPARATOR_RE = /^\s*\|(\s*[-:]+\s*\|)+\s*$/

function parseCells(line: string): string[] {
  return line
    .split("|")
    .slice(1, -1)
    .map((c) => c.trim())
}

function cellsToRow(cells: string[]): string {
  return "| " + cells.map((c) => c || " ").join(" | ") + " |"
}

interface TableInfo {
  from: number
  to: number
  headers: string[]
  rows: string[][]
}

function findMarkdownTables(state: EditorState): TableInfo[] {
  const tables: TableInfo[] = []
  let i = 1
  const lineCount = state.doc.lines

  while (i <= lineCount) {
    const line = state.doc.line(i)
    if (!line.text.trimStart().startsWith("|")) {
      i++
      continue
    }

    // Need at least a separator line after the header
    if (i + 1 > lineCount) {
      i++
      continue
    }
    const sep = state.doc.line(i + 1)
    if (!SEPARATOR_RE.test(sep.text)) {
      i++
      continue
    }

    // Collect data rows
    let end = i + 1
    while (end < lineCount) {
      const next = state.doc.line(end + 1)
      if (!next.text.trimStart().startsWith("|")) break
      end++
    }

    const headers = parseCells(line.text)
    const rows: string[][] = []
    for (let r = i + 2; r <= end; r++) {
      rows.push(parseCells(state.doc.line(r).text))
    }

    tables.push({
      from: line.from,
      to: state.doc.line(end).to,
      headers,
      rows,
    })

    i = end + 1
  }

  return tables
}

class EditableTableWidget extends WidgetType {
  constructor(
    readonly headers: string[],
    readonly rows: string[][],
    readonly tableFrom: number,
    readonly tableTo: number
  ) {
    super()
  }

  eq(other: EditableTableWidget) {
    return (
      JSON.stringify(this.headers) === JSON.stringify(other.headers) &&
      JSON.stringify(this.rows) === JSON.stringify(other.rows)
    )
  }

  toDOM(view: EditorView) {
    const ro = view.state.facet(readOnlyFacet)
    const wrapper = document.createElement("div")
    wrapper.className = "cm-table-edit-widget"

    const table = document.createElement("table")

    // Header
    const thead = document.createElement("thead")
    const headerRow = document.createElement("tr")
    for (const h of this.headers) {
      const th = document.createElement("th")
      if (!ro) th.contentEditable = "true"
      th.textContent = h
      headerRow.appendChild(th)
    }
    thead.appendChild(headerRow)
    table.appendChild(thead)

    // Body
    const tbody = document.createElement("tbody")
    for (const row of this.rows) {
      const tr = document.createElement("tr")
      for (let ci = 0; ci < this.headers.length; ci++) {
        const td = document.createElement("td")
        if (!ro) td.contentEditable = "true"
        td.textContent = row[ci] || ""
        tr.appendChild(td)
      }
      tbody.appendChild(tr)
    }
    table.appendChild(tbody)

    wrapper.appendChild(table)

    if (ro) return wrapper

    // Capture from/to at widget creation time
    const tableFrom = this.tableFrom
    const tableTo = this.tableTo

    // Stop all key events from reaching CodeMirror keymaps
    wrapper.addEventListener("keydown", (e) => {
      e.stopPropagation()

      if (e.key === "Tab") {
        e.preventDefault()
        const cells = Array.from(wrapper.querySelectorAll("th, td")) as HTMLElement[]
        const current = document.activeElement as HTMLElement
        const idx = cells.indexOf(current)
        if (idx === -1) return
        const next = e.shiftKey ? cells[idx - 1] : cells[idx + 1]
        if (next) {
          next.focus()
          const range = document.createRange()
          range.selectNodeContents(next)
          const sel = window.getSelection()
          sel?.removeAllRanges()
          sel?.addRange(range)
        }
      }

      if (e.key === "Escape") {
        e.preventDefault()
        syncTable()
        // Move CM6 cursor after the table
        view.focus()
        const pos = Math.min(tableTo + 1, view.state.doc.length)
        view.dispatch({ selection: { anchor: pos } })
      }
    })

    const syncTable = () => {
      // Validate range still looks like a markdown table
      if (tableFrom >= view.state.doc.length || tableTo > view.state.doc.length) return
      const currentText = view.state.doc.sliceString(tableFrom, tableTo)
      const firstLine = currentText.split("\n")[0]
      if (!firstLine?.trimStart().startsWith("|")) return

      // Read current cell values from DOM
      const ths = Array.from(wrapper.querySelectorAll("thead th"))
      const trs = Array.from(wrapper.querySelectorAll("tbody tr"))

      const newHeaders = ths.map((th) => th.textContent?.trim() || " ")
      const newRows = trs.map((tr) => {
        const cells = Array.from(tr.querySelectorAll("td"))
        return cells.map((td) => td.textContent?.trim() || " ")
      })

      // Generate new markdown
      const headerLine = cellsToRow(newHeaders)
      const sepLine = "| " + newHeaders.map(() => "---").join(" | ") + " |"
      const rowLines = newRows.map((r) => cellsToRow(r))
      const newMarkdown = [headerLine, sepLine, ...rowLines].join("\n")

      if (newMarkdown === currentText) return

      view.dispatch({
        changes: { from: tableFrom, to: tableTo, insert: newMarkdown },
        effects: tableSyncEffect.of(null),
      })
    }

    // Sync when focus leaves the table entirely
    wrapper.addEventListener("focusout", (e) => {
      const related = (e as FocusEvent).relatedTarget as Node | null
      if (related && wrapper.contains(related)) return
      syncTable()
    })

    return wrapper
  }

  ignoreEvent() {
    return true
  }
}

function buildDecorations(state: EditorState): DecorationSet {
  const tables = findMarkdownTables(state)
  const decos: Range<Decoration>[] = []

  for (const t of tables) {
    decos.push(
      Decoration.replace({
        widget: new EditableTableWidget(t.headers, t.rows, t.from, t.to),
        block: true,
      }).range(t.from, t.to)
    )
  }

  return Decoration.set(decos)
}

export const editableTableField = StateField.define<DecorationSet>({
  create(state) {
    return buildDecorations(state)
  },
  update(deco, tr) {
    if (tr.docChanged) {
      return buildDecorations(tr.state)
    }
    return deco
  },
  provide(field) {
    return EditorView.decorations.from(field)
  },
})
