export function generateMarkdownTable(cols: number, rows: number): string {
  cols = Math.max(1, Math.min(20, cols))
  rows = Math.max(1, Math.min(50, rows))

  const header = "| " + Array.from({ length: cols }, (_, i) => `Col ${i + 1}`).join(" | ") + " |"
  const separator = "| " + Array.from({ length: cols }, () => "---").join(" | ") + " |"
  const dataRow = "| " + Array.from({ length: cols }, () => " ").join(" | ") + " |"
  const dataRows = Array.from({ length: rows }, () => dataRow).join("\n")

  return `${header}\n${separator}\n${dataRows}\n`
}

export function expandTableCommands(text: string): string {
  return text.replace(
    /\/table\[\s*(\d+)\s*,\s*(\d+)\s*\]/g,
    (_, cols, rows) => generateMarkdownTable(parseInt(cols, 10), parseInt(rows, 10))
  )
}
