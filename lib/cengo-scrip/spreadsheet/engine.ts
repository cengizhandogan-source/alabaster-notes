import type { CellValue, FormulaNode } from "./types"
import { letterToCol, colToLetter } from "./types"
import { functions } from "./functions"

// ── Tokenizer ──────────────────────────────────────────────

type TokenType = "number" | "string" | "ident" | "cell" | "op" | "paren" | "comma" | "colon"

interface Token {
  type: TokenType
  value: string
}

const CELL_RE = /^[A-Z]{1,3}\d{1,5}$/

function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < input.length) {
    const ch = input[i]

    // Whitespace
    if (ch === " " || ch === "\t") {
      i++
      continue
    }

    // String literal
    if (ch === '"') {
      let str = ""
      i++
      while (i < input.length && input[i] !== '"') {
        if (input[i] === "\\" && i + 1 < input.length) {
          i++
          str += input[i]
        } else {
          str += input[i]
        }
        i++
      }
      i++ // closing quote
      tokens.push({ type: "string", value: str })
      continue
    }

    // Number (including decimals)
    if ((ch >= "0" && ch <= "9") || (ch === "." && i + 1 < input.length && input[i + 1] >= "0" && input[i + 1] <= "9")) {
      let num = ""
      while (i < input.length && ((input[i] >= "0" && input[i] <= "9") || input[i] === ".")) {
        num += input[i]
        i++
      }
      tokens.push({ type: "number", value: num })
      continue
    }

    // Identifiers and cell references (A-Z letters followed by optional digits)
    if ((ch >= "A" && ch <= "Z") || (ch >= "a" && ch <= "z") || ch === "_") {
      let word = ""
      while (i < input.length && ((input[i] >= "A" && input[i] <= "Z") || (input[i] >= "a" && input[i] <= "z") || (input[i] >= "0" && input[i] <= "9") || input[i] === "_")) {
        word += input[i]
        i++
      }
      const upper = word.toUpperCase()
      if (CELL_RE.test(upper)) {
        tokens.push({ type: "cell", value: upper })
      } else if (upper === "TRUE") {
        tokens.push({ type: "ident", value: "TRUE" })
      } else if (upper === "FALSE") {
        tokens.push({ type: "ident", value: "FALSE" })
      } else {
        tokens.push({ type: "ident", value: upper })
      }
      continue
    }

    // Multi-char operators
    if (i + 1 < input.length) {
      const two = input[i] + input[i + 1]
      if (two === ">=" || two === "<=" || two === "==" || two === "!=") {
        tokens.push({ type: "op", value: two })
        i += 2
        continue
      }
    }

    // Single-char operators
    if ("+-*/%^><".includes(ch)) {
      tokens.push({ type: "op", value: ch })
      i++
      continue
    }

    // Parentheses
    if (ch === "(" || ch === ")") {
      tokens.push({ type: "paren", value: ch })
      i++
      continue
    }

    // Comma
    if (ch === ",") {
      tokens.push({ type: "comma", value: "," })
      i++
      continue
    }

    // Colon (for ranges)
    if (ch === ":") {
      tokens.push({ type: "colon", value: ":" })
      i++
      continue
    }

    // Skip unknown characters
    i++
  }

  return tokens
}

// ── Parser ─────────────────────────────────────────────────

class Parser {
  private pos = 0
  constructor(private tokens: Token[]) {}

  private peek(): Token | undefined {
    return this.tokens[this.pos]
  }

  private advance(): Token {
    return this.tokens[this.pos++]
  }

  private expect(type: TokenType, value?: string): Token {
    const t = this.advance()
    if (!t || t.type !== type || (value && t.value !== value)) {
      throw new Error(`Expected ${type}${value ? ` '${value}'` : ""}, got ${t?.value ?? "EOF"}`)
    }
    return t
  }

  parse(): FormulaNode {
    const node = this.parseExpr()
    return node
  }

  private parseExpr(): FormulaNode {
    let left = this.parseComparison()
    while (this.peek()?.type === "op" && (this.peek()!.value === "+" || this.peek()!.value === "-")) {
      const op = this.advance().value
      const right = this.parseComparison()
      left = { type: "binary", op, left, right }
    }
    return left
  }

  private parseComparison(): FormulaNode {
    let left = this.parseTerm()
    while (this.peek()?.type === "op" && [">", "<", ">=", "<=", "==", "!="].includes(this.peek()!.value)) {
      const op = this.advance().value
      const right = this.parseTerm()
      left = { type: "binary", op, left, right }
    }
    return left
  }

  private parseTerm(): FormulaNode {
    let left = this.parseFactor()
    while (this.peek()?.type === "op" && (this.peek()!.value === "*" || this.peek()!.value === "/" || this.peek()!.value === "%")) {
      const op = this.advance().value
      const right = this.parseFactor()
      left = { type: "binary", op, left, right }
    }
    return left
  }

  private parseFactor(): FormulaNode {
    let left = this.parseUnary()
    while (this.peek()?.type === "op" && this.peek()!.value === "^") {
      this.advance()
      const right = this.parseUnary()
      left = { type: "binary", op: "^", left, right }
    }
    return left
  }

  private parseUnary(): FormulaNode {
    if (this.peek()?.type === "op" && this.peek()!.value === "-") {
      this.advance()
      const operand = this.parseUnary()
      return { type: "unary", op: "-", operand }
    }
    return this.parseCall()
  }

  private parseCall(): FormulaNode {
    const t = this.peek()

    // Function call: IDENT followed by (
    if (t?.type === "ident" && this.tokens[this.pos + 1]?.value === "(") {
      const name = this.advance().value
      this.expect("paren", "(")
      const args: FormulaNode[] = []
      if (this.peek()?.value !== ")") {
        args.push(this.parseExpr())
        while (this.peek()?.type === "comma") {
          this.advance()
          args.push(this.parseExpr())
        }
      }
      this.expect("paren", ")")
      return { type: "call", name, args }
    }

    return this.parseAtom()
  }

  private parseAtom(): FormulaNode {
    const t = this.peek()

    if (!t) throw new Error("Unexpected end of formula")

    // Number
    if (t.type === "number") {
      this.advance()
      return { type: "number", value: parseFloat(t.value) }
    }

    // String
    if (t.type === "string") {
      this.advance()
      return { type: "string", value: t.value }
    }

    // Boolean
    if (t.type === "ident" && (t.value === "TRUE" || t.value === "FALSE")) {
      this.advance()
      return { type: "boolean", value: t.value === "TRUE" }
    }

    // Cell reference (may be followed by : for range)
    if (t.type === "cell") {
      this.advance()
      if (this.peek()?.type === "colon") {
        this.advance() // consume :
        const endCell = this.expect("cell")
        const startMatch = t.value.match(/^([A-Z]+)(\d+)$/)!
        const endMatch = endCell.value.match(/^([A-Z]+)(\d+)$/)!
        return {
          type: "range",
          start: { col: letterToCol(startMatch[1]), row: parseInt(startMatch[2], 10) - 1 },
          end: { col: letterToCol(endMatch[1]), row: parseInt(endMatch[2], 10) - 1 },
        }
      }
      const m = t.value.match(/^([A-Z]+)(\d+)$/)!
      return { type: "cell", ref: { col: letterToCol(m[1]), row: parseInt(m[2], 10) - 1 } }
    }

    // Parenthesized expression
    if (t.type === "paren" && t.value === "(") {
      this.advance()
      const expr = this.parseExpr()
      this.expect("paren", ")")
      return expr
    }

    throw new Error(`Unexpected token: ${t.value}`)
  }
}

// ── Evaluator ──────────────────────────────────────────────

function evaluate(node: FormulaNode, cells: Record<string, string>, visited: Set<string>): CellValue {
  switch (node.type) {
    case "number":
      return node.value
    case "string":
      return node.value
    case "boolean":
      return node.value

    case "cell": {
      const addr = colToLetter(node.ref.col) + (node.ref.row + 1)
      if (visited.has(addr)) throw new Error("#REF! Circular reference")
      visited.add(addr)
      const raw = cells[addr]
      if (raw === undefined || raw === "") return 0
      if (raw.startsWith("=")) {
        return evaluateFormula(raw.slice(1), cells, visited)
      }
      const num = Number(raw)
      return isNaN(num) ? raw : num
    }

    case "range": {
      // Ranges are expanded by function calls — should not be evaluated directly
      // Return array of values for the range
      throw new Error("Range cannot be used outside a function")
    }

    case "crossref":
      // Cross-note references handled at a higher level
      throw new Error("#XREF! Cross-note references not yet resolved")

    case "call": {
      const fn = functions[node.name]
      if (!fn) throw new Error(`Unknown function: ${node.name}`)

      // Expand range arguments into individual cell values
      const args: CellValue[] = []
      for (const arg of node.args) {
        if (arg.type === "range") {
          const minCol = Math.min(arg.start.col, arg.end.col)
          const maxCol = Math.max(arg.start.col, arg.end.col)
          const minRow = Math.min(arg.start.row, arg.end.row)
          const maxRow = Math.max(arg.start.row, arg.end.row)
          for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
              const a = colToLetter(c) + (r + 1)
              if (visited.has(a)) throw new Error("#REF! Circular reference")
              const cellVisited = new Set(visited)
              cellVisited.add(a)
              const raw = cells[a]
              if (raw === undefined || raw === "") {
                args.push(0)
              } else if (raw.startsWith("=")) {
                args.push(evaluateFormula(raw.slice(1), cells, cellVisited))
              } else {
                const num = Number(raw)
                args.push(isNaN(num) ? raw : num)
              }
            }
          }
        } else {
          args.push(evaluate(arg, cells, new Set(visited)))
        }
      }
      return fn(args)
    }

    case "binary": {
      const left = evaluate(node.left, cells, new Set(visited))
      const right = evaluate(node.right, cells, new Set(visited))
      const l = typeof left === "number" ? left : Number(left)
      const r = typeof right === "number" ? right : Number(right)

      switch (node.op) {
        case "+":
          // String concatenation if either side is string
          if (typeof left === "string" || typeof right === "string") return String(left) + String(right)
          return l + r
        case "-": return l - r
        case "*": return l * r
        case "/": return r === 0 ? Infinity : l / r
        case "%": return r === 0 ? 0 : l % r
        case "^": return Math.pow(l, r)
        case ">": return l > r
        case "<": return l < r
        case ">=": return l >= r
        case "<=": return l <= r
        case "==": return left === right
        case "!=": return left !== right
        default: throw new Error(`Unknown operator: ${node.op}`)
      }
    }

    case "unary": {
      const operand = evaluate(node.operand, cells, visited)
      if (node.op === "-") return -(typeof operand === "number" ? operand : Number(operand))
      throw new Error(`Unknown unary operator: ${node.op}`)
    }
  }
}

function evaluateFormula(formula: string, cells: Record<string, string>, visited: Set<string>): CellValue {
  const tokens = tokenize(formula)
  if (tokens.length === 0) return 0
  const parser = new Parser(tokens)
  const ast = parser.parse()
  return evaluate(ast, cells, visited)
}

/** Evaluate a single cell, resolving formulas recursively */
export function evaluateCell(addr: string, cells: Record<string, string>): CellValue {
  const raw = cells[addr]
  if (raw === undefined || raw === "") return ""
  if (!raw.startsWith("=")) {
    const num = Number(raw)
    return isNaN(num) ? raw : num
  }
  const visited = new Set<string>()
  visited.add(addr)
  return evaluateFormula(raw.slice(1), cells, visited)
}

/** Evaluate all cells in a sheet, returning computed values */
export function evaluateSheet(cells: Record<string, string>): Record<string, CellValue> {
  const computed: Record<string, CellValue> = {}
  for (const addr of Object.keys(cells)) {
    try {
      computed[addr] = evaluateCell(addr, cells)
    } catch (e) {
      computed[addr] = e instanceof Error ? e.message : "#ERR!"
    }
  }
  return computed
}
