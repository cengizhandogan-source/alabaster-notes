import type { SheetInfo } from "./types"

const SHEET_HEADER_RE = /^::sheet\[([^\]]+)\]\s*$/
const SHEET_END_RE = /^::endsheet\s*$/
const PLOT_RE = /^::plot\[([^\]]+)\]\s*$/

export interface PlotInfo {
  from: number
  to: number
  sheetName: string
  chartType: string
  xCol: string
  yCols: string[]
}

/** Parse all ::sheet[Name]...::endsheet blocks from document text */
export function parseSheets(text: string): SheetInfo[] {
  const lines = text.split("\n")
  const sheets: SheetInfo[] = []
  let i = 0
  let offset = 0

  while (i < lines.length) {
    const line = lines[i]
    const headerMatch = line.match(SHEET_HEADER_RE)

    if (!headerMatch) {
      offset += line.length + 1
      i++
      continue
    }

    const name = headerMatch[1]
    const from = offset
    i++
    offset += line.length + 1

    // Collect data rows until ::endsheet
    const grid: string[][] = []
    while (i < lines.length) {
      const dataLine = lines[i]
      if (SHEET_END_RE.test(dataLine)) {
        const to = offset + dataLine.length
        sheets.push({ name, from, to, grid })
        offset += dataLine.length + 1
        i++
        break
      }
      // Tab-delimited cells
      grid.push(dataLine.split("\t"))
      offset += dataLine.length + 1
      i++
    }
  }

  return sheets
}

/** Parse all ::plot[...] blocks from document text */
export function parsePlots(text: string): PlotInfo[] {
  const lines = text.split("\n")
  const plots: PlotInfo[] = []
  let offset = 0

  for (const line of lines) {
    const match = line.match(PLOT_RE)
    if (match) {
      const parts = match[1].split("|").map((s) => s.trim())
      if (parts.length >= 4) {
        plots.push({
          from: offset,
          to: offset + line.length,
          sheetName: parts[0],
          chartType: parts[1],
          xCol: parts[2],
          yCols: parts[3].split(",").map((s) => s.trim()),
        })
      }
    }
    offset += line.length + 1
  }

  return plots
}

/** Build a cells Record from a grid (for use by the formula engine) */
export function gridToCells(grid: string[][]): Record<string, string> {
  const cells: Record<string, string> = {}
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const col = String.fromCharCode(65 + c)
      const addr = `${col}${r + 1}`
      const val = grid[r][c]
      if (val !== undefined && val !== "") {
        cells[addr] = val
      }
    }
  }
  return cells
}

/** Serialize a cells Record back to tab-delimited grid lines */
export function cellsToGrid(cells: Record<string, string>, cols: number, rows: number): string {
  const lines: string[] = []
  for (let r = 0; r < rows; r++) {
    const row: string[] = []
    for (let c = 0; c < cols; c++) {
      const col = String.fromCharCode(65 + c)
      const addr = `${col}${r + 1}`
      row.push(cells[addr] || "")
    }
    lines.push(row.join("\t"))
  }
  return lines.join("\n")
}
