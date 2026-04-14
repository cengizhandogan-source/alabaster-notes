export interface CellRef {
  col: number // 0-indexed (A=0, B=1, ...)
  row: number // 0-indexed
}

export interface CellRange {
  start: CellRef
  end: CellRef
}

export interface CrossNoteRef {
  slug: string
  sheetName: string
  cell: CellRef
}

export type CellValue = number | string | boolean

export interface SheetData {
  name: string
  cols: number
  rows: number
  /** Raw cell text indexed by "A1", "B2", etc. */
  cells: Record<string, string>
  /** Computed values after formula evaluation */
  computed: Record<string, CellValue>
}

export interface SheetInfo {
  name: string
  from: number
  to: number
  grid: string[][] // rows x cols of raw cell text
}

// Formula AST node types
export type FormulaNode =
  | { type: "number"; value: number }
  | { type: "string"; value: string }
  | { type: "boolean"; value: boolean }
  | { type: "cell"; ref: CellRef }
  | { type: "range"; start: CellRef; end: CellRef }
  | { type: "crossref"; slug: string; sheet: string; ref: CellRef }
  | { type: "call"; name: string; args: FormulaNode[] }
  | { type: "binary"; op: string; left: FormulaNode; right: FormulaNode }
  | { type: "unary"; op: string; operand: FormulaNode }

export type CellResolver = (addr: string) => CellValue | undefined

/** Convert 0-indexed column to letter(s): 0→A, 1→B, 25→Z, 26→AA */
export function colToLetter(col: number): string {
  let s = ""
  let c = col
  do {
    s = String.fromCharCode(65 + (c % 26)) + s
    c = Math.floor(c / 26) - 1
  } while (c >= 0)
  return s
}

/** Convert column letter(s) to 0-indexed number: A→0, B→1, Z→25, AA→26 */
export function letterToCol(letters: string): number {
  let n = 0
  for (let i = 0; i < letters.length; i++) {
    n = n * 26 + (letters.charCodeAt(i) - 64)
  }
  return n - 1
}

/** Convert CellRef to address string like "A1" (1-indexed row for display) */
export function refToAddr(ref: CellRef): string {
  return colToLetter(ref.col) + (ref.row + 1)
}

/** Parse address string like "A1" to CellRef (row becomes 0-indexed) */
export function addrToRef(addr: string): CellRef | null {
  const m = addr.match(/^([A-Z]+)(\d+)$/)
  if (!m) return null
  return { col: letterToCol(m[1]), row: parseInt(m[2], 10) - 1 }
}
