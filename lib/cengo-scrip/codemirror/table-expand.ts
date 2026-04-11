import { EditorView } from "@codemirror/view"
import { generateMarkdownTable } from "../utils/table-generator"

const TABLE_PATTERN = /\/table\[\s*(\d+)\s*,\s*(\d+)\s*\]$/

export const tableExpand = EditorView.inputHandler.of((view, from, to, text) => {
  if (text !== "]") return false

  const line = view.state.doc.lineAt(from)
  const lineText = line.text.slice(0, from - line.from) + "]"
  const match = lineText.match(TABLE_PATTERN)

  if (!match) return false

  const cols = parseInt(match[1], 10)
  const rows = parseInt(match[2], 10)
  const table = generateMarkdownTable(cols, rows)

  const matchStart = line.from + lineText.lastIndexOf(match[0])
  const matchEnd = from + 1 // include the ] we're about to insert

  view.dispatch({
    changes: { from: matchStart, to: matchEnd - 1, insert: table },
  })

  return true
})
