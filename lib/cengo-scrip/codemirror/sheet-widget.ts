import { EditorView, Decoration, WidgetType, DecorationSet } from "@codemirror/view"
import { EditorState, StateField, StateEffect, Range, Facet } from "@codemirror/state"
import { parseSheets, gridToCells, cellsToGrid } from "../spreadsheet/parser"
import { colToLetter, type SheetData } from "../spreadsheet/types"
import { evaluateCell } from "../spreadsheet/engine"

const sheetSyncEffect = StateEffect.define<null>()
export const sheetDataReceivedEffect = StateEffect.define<null>()

export const sheetDataFacet = Facet.define<SheetData[], SheetData[]>({
  combine: (values) => values.flat(),
})

interface ParsedSheet {
  name: string
  from: number
  to: number
  grid: string[][]
  cols: number
  rows: number
}

function findSheets(state: EditorState): ParsedSheet[] {
  const text = state.doc.toString()
  const infos = parseSheets(text)
  return infos.map((info) => {
    const cols = Math.max(1, ...info.grid.map((r) => r.length))
    return { ...info, cols, rows: info.grid.length || 1 }
  })
}

class SheetWidget extends WidgetType {
  constructor(
    readonly name: string,
    readonly grid: string[][],
    readonly cols: number,
    readonly rows: number,
    readonly sheetFrom: number,
    readonly sheetTo: number
  ) {
    super()
  }

  eq(other: SheetWidget) {
    return (
      this.name === other.name &&
      this.sheetFrom === other.sheetFrom &&
      JSON.stringify(this.grid) === JSON.stringify(other.grid)
    )
  }

  toDOM(view: EditorView) {
    const wrapper = document.createElement("div")
    wrapper.className = "cm-sheet-widget"

    // Header bar with sheet name
    const header = document.createElement("div")
    header.className = "cm-sheet-header"
    const nameLabel = document.createElement("span")
    nameLabel.className = "cm-sheet-name"
    nameLabel.textContent = this.name
    header.appendChild(nameLabel)

    const controls = document.createElement("span")
    controls.className = "cm-sheet-controls"

    const addColBtn = document.createElement("button")
    addColBtn.className = "cm-sheet-add-btn"
    addColBtn.textContent = "+ Col"
    addColBtn.title = "Add column"
    controls.appendChild(addColBtn)

    const addRowBtn = document.createElement("button")
    addRowBtn.className = "cm-sheet-add-btn"
    addRowBtn.textContent = "+ Row"
    addRowBtn.title = "Add row"
    controls.appendChild(addRowBtn)

    header.appendChild(controls)
    wrapper.appendChild(header)

    // Formula bar
    const formulaBar = document.createElement("div")
    formulaBar.className = "cm-sheet-formula-bar"
    const cellLabel = document.createElement("span")
    cellLabel.className = "cm-sheet-cell-label"
    cellLabel.textContent = "A1"
    formulaBar.appendChild(cellLabel)
    const formulaInput = document.createElement("span")
    formulaInput.className = "cm-sheet-formula-input"
    formulaInput.textContent = ""
    formulaBar.appendChild(formulaInput)
    wrapper.appendChild(formulaBar)

    // Build the grid table
    const table = document.createElement("table")
    table.className = "cm-sheet-grid"

    let currentCols = this.cols
    let currentRows = this.rows

    // Normalize grid to have consistent dimensions
    const gridCopy = this.grid.map((r) => {
      const row = [...r]
      while (row.length < currentCols) row.push("")
      return row
    })
    while (gridCopy.length < currentRows) {
      gridCopy.push(new Array(currentCols).fill(""))
    }

    // Compute cell values for display
    const cells = gridToCells(gridCopy)
    const computed: Record<string, string> = {}
    for (const addr of Object.keys(cells)) {
      const raw = cells[addr]
      if (raw.startsWith("=")) {
        try {
          const result = evaluateCell(addr, cells)
          computed[addr] = typeof result === "number" ? (Number.isInteger(result) ? String(result) : result.toFixed(4).replace(/\.?0+$/, "")) : String(result)
        } catch {
          computed[addr] = "#ERR!"
        }
      } else {
        computed[addr] = raw
      }
    }

    // Column header row
    const colHeaderRow = document.createElement("tr")
    const cornerTh = document.createElement("th")
    cornerTh.className = "cm-sheet-corner"
    colHeaderRow.appendChild(cornerTh)
    for (let c = 0; c < currentCols; c++) {
      const th = document.createElement("th")
      th.className = "cm-sheet-col-header"
      th.textContent = colToLetter(c)
      colHeaderRow.appendChild(th)
    }
    const thead = document.createElement("thead")
    thead.appendChild(colHeaderRow)
    table.appendChild(thead)

    // Data rows
    const tbody = document.createElement("tbody")
    for (let r = 0; r < currentRows; r++) {
      const tr = document.createElement("tr")
      // Row header
      const rowTh = document.createElement("th")
      rowTh.className = "cm-sheet-row-header"
      rowTh.textContent = String(r + 1)
      tr.appendChild(rowTh)

      for (let c = 0; c < currentCols; c++) {
        const td = document.createElement("td")
        td.contentEditable = "true"
        td.dataset.row = String(r)
        td.dataset.col = String(c)
        const addr = colToLetter(c) + (r + 1)
        const raw = gridCopy[r]?.[c] || ""
        // Show computed value by default, raw formula on focus
        td.textContent = computed[addr] ?? raw
        td.dataset.raw = raw

        td.addEventListener("focus", () => {
          td.textContent = td.dataset.raw || ""
          cellLabel.textContent = addr
          formulaInput.textContent = td.dataset.raw || ""
          td.classList.add("cm-sheet-cell-active")
        })

        td.addEventListener("blur", () => {
          const newRaw = td.textContent?.trim() ?? ""
          td.dataset.raw = newRaw
          // Recompute this cell
          const updatedCells = readCells()
          if (newRaw.startsWith("=")) {
            try {
              const result = evaluateCell(addr, updatedCells)
              td.textContent = typeof result === "number" ? (Number.isInteger(result) ? String(result) : result.toFixed(4).replace(/\.?0+$/, "")) : String(result)
            } catch {
              td.textContent = "#ERR!"
            }
          } else {
            td.textContent = newRaw
          }
          td.classList.remove("cm-sheet-cell-active")
        })

        td.addEventListener("input", () => {
          formulaInput.textContent = td.textContent || ""
        })

        tr.appendChild(td)
      }
      tbody.appendChild(tr)
    }
    table.appendChild(tbody)
    wrapper.appendChild(table)

    const sheetFrom = this.sheetFrom
    const sheetTo = this.sheetTo
    const sheetName = this.name

    const readCells = (): Record<string, string> => {
      const result: Record<string, string> = {}
      const tds = Array.from(tbody.querySelectorAll("td")) as HTMLElement[]
      for (const td of tds) {
        const r = parseInt(td.dataset.row!, 10)
        const c = parseInt(td.dataset.col!, 10)
        const addr = colToLetter(c) + (r + 1)
        const raw = td.dataset.raw || ""
        if (raw !== "") result[addr] = raw
      }
      return result
    }

    const syncSheet = () => {
      if (sheetFrom >= view.state.doc.length || sheetTo > view.state.doc.length) return
      const currentText = view.state.doc.sliceString(sheetFrom, sheetTo)
      if (!currentText.startsWith("::sheet[")) return

      const updatedCells = readCells()
      const gridLines = cellsToGrid(updatedCells, currentCols, currentRows)
      const newText = `::sheet[${sheetName}]\n${gridLines}\n::endsheet`

      if (newText === currentText) return
      view.dispatch({
        changes: { from: sheetFrom, to: sheetTo, insert: newText },
        effects: sheetSyncEffect.of(null),
      })
    }

    const rebuildComputed = () => {
      const updatedCells = readCells()
      const tds = Array.from(tbody.querySelectorAll("td")) as HTMLElement[]
      for (const td of tds) {
        if (td === document.activeElement) continue
        const r = parseInt(td.dataset.row!, 10)
        const c = parseInt(td.dataset.col!, 10)
        const addr = colToLetter(c) + (r + 1)
        const raw = td.dataset.raw || ""
        if (raw.startsWith("=")) {
          try {
            const result = evaluateCell(addr, updatedCells)
            td.textContent = typeof result === "number" ? (Number.isInteger(result) ? String(result) : result.toFixed(4).replace(/\.?0+$/, "")) : String(result)
          } catch {
            td.textContent = "#ERR!"
          }
        }
      }
    }

    // Add column
    addColBtn.addEventListener("click", (e) => {
      e.preventDefault()
      currentCols++
      // Add column header
      const th = document.createElement("th")
      th.className = "cm-sheet-col-header"
      th.textContent = colToLetter(currentCols - 1)
      colHeaderRow.appendChild(th)
      // Add cell to each row
      const trs = Array.from(tbody.querySelectorAll("tr"))
      for (let r = 0; r < trs.length; r++) {
        const td = document.createElement("td")
        td.contentEditable = "true"
        td.dataset.row = String(r)
        td.dataset.col = String(currentCols - 1)
        td.dataset.raw = ""
        const addr = colToLetter(currentCols - 1) + (r + 1)
        td.addEventListener("focus", () => {
          td.textContent = td.dataset.raw || ""
          cellLabel.textContent = addr
          formulaInput.textContent = td.dataset.raw || ""
          td.classList.add("cm-sheet-cell-active")
        })
        td.addEventListener("blur", () => {
          const newRaw = td.textContent?.trim() ?? ""
          td.dataset.raw = newRaw
          const updatedCells = readCells()
          if (newRaw.startsWith("=")) {
            try {
              const result = evaluateCell(addr, updatedCells)
              td.textContent = typeof result === "number" ? (Number.isInteger(result) ? String(result) : result.toFixed(4).replace(/\.?0+$/, "")) : String(result)
            } catch {
              td.textContent = "#ERR!"
            }
          } else {
            td.textContent = newRaw
          }
          td.classList.remove("cm-sheet-cell-active")
        })
        td.addEventListener("input", () => {
          formulaInput.textContent = td.textContent || ""
        })
        trs[r].appendChild(td)
      }
      syncSheet()
    })

    // Add row
    addRowBtn.addEventListener("click", (e) => {
      e.preventDefault()
      currentRows++
      const tr = document.createElement("tr")
      const rowTh = document.createElement("th")
      rowTh.className = "cm-sheet-row-header"
      rowTh.textContent = String(currentRows)
      tr.appendChild(rowTh)
      for (let c = 0; c < currentCols; c++) {
        const td = document.createElement("td")
        td.contentEditable = "true"
        td.dataset.row = String(currentRows - 1)
        td.dataset.col = String(c)
        td.dataset.raw = ""
        const addr = colToLetter(c) + currentRows
        td.addEventListener("focus", () => {
          td.textContent = td.dataset.raw || ""
          cellLabel.textContent = addr
          formulaInput.textContent = td.dataset.raw || ""
          td.classList.add("cm-sheet-cell-active")
        })
        td.addEventListener("blur", () => {
          const newRaw = td.textContent?.trim() ?? ""
          td.dataset.raw = newRaw
          const updatedCells = readCells()
          if (newRaw.startsWith("=")) {
            try {
              const result = evaluateCell(addr, updatedCells)
              td.textContent = typeof result === "number" ? (Number.isInteger(result) ? String(result) : result.toFixed(4).replace(/\.?0+$/, "")) : String(result)
            } catch {
              td.textContent = "#ERR!"
            }
          } else {
            td.textContent = newRaw
          }
          td.classList.remove("cm-sheet-cell-active")
        })
        td.addEventListener("input", () => {
          formulaInput.textContent = td.textContent || ""
        })
        tr.appendChild(td)
      }
      tbody.appendChild(tr)
      syncSheet()
    })

    // Keyboard navigation
    wrapper.addEventListener("keydown", (e) => {
      e.stopPropagation()

      if (e.key === "Tab") {
        e.preventDefault()
        const cells = Array.from(wrapper.querySelectorAll("td")) as HTMLElement[]
        const current = document.activeElement as HTMLElement
        const idx = cells.indexOf(current)
        if (idx === -1) return
        const next = e.shiftKey ? cells[idx - 1] : cells[idx + 1]
        if (next) {
          next.focus()
          const range = document.createRange()
          range.selectNodeContents(next)
          window.getSelection()?.removeAllRanges()
          window.getSelection()?.addRange(range)
        }
      }

      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        const current = document.activeElement as HTMLElement
        if (!current?.dataset.row) return
        const r = parseInt(current.dataset.row, 10)
        const c = parseInt(current.dataset.col!, 10)
        // Move down one row
        const nextRow = r + 1
        const target = wrapper.querySelector(`td[data-row="${nextRow}"][data-col="${c}"]`) as HTMLElement
        if (target) {
          current.blur()
          rebuildComputed()
          target.focus()
          const range = document.createRange()
          range.selectNodeContents(target)
          window.getSelection()?.removeAllRanges()
          window.getSelection()?.addRange(range)
        }
      }

      if (e.key === "Escape") {
        e.preventDefault()
        syncSheet()
        rebuildComputed()
        view.focus()
        const pos = Math.min(sheetTo + 1, view.state.doc.length)
        view.dispatch({ selection: { anchor: pos } })
      }
    })

    // Sync when focus leaves the sheet entirely
    wrapper.addEventListener("focusout", (e) => {
      const related = (e as FocusEvent).relatedTarget as Node | null
      if (related && wrapper.contains(related)) return
      syncSheet()
      rebuildComputed()
    })

    return wrapper
  }

  ignoreEvent() {
    return true
  }
}

function buildDecorations(state: EditorState): DecorationSet {
  const sheets = findSheets(state)
  const decos: Range<Decoration>[] = []

  for (const s of sheets) {
    decos.push(
      Decoration.replace({
        widget: new SheetWidget(s.name, s.grid, s.cols, s.rows, s.from, s.to),
        block: true,
      }).range(s.from, s.to)
    )
  }

  return Decoration.set(decos)
}

export const sheetField = StateField.define<DecorationSet>({
  create(state) {
    return buildDecorations(state)
  },
  update(deco, tr) {
    if (tr.docChanged || tr.effects.some((e) => e.is(sheetDataReceivedEffect))) {
      return buildDecorations(tr.state)
    }
    return deco
  },
  provide(field) {
    return EditorView.decorations.from(field)
  },
})
