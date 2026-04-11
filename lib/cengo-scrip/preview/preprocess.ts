import { generateMarkdownTable } from "../utils/table-generator"
import type { NoteRef } from "../utils/slugify"

export function preprocessCengoScrip(content: string, notes?: NoteRef[]): string {
  // Split on code fences and inline code to avoid processing inside them
  const parts = content.split(/(```[\s\S]*?```|`[^`]+`)/g)

  return parts
    .map((part, i) => {
      // Odd indices are code blocks/inline code — skip them
      if (i % 2 === 1) return part

      // Expand /table[COLS, ROWS] into markdown tables
      part = part.replace(
        /\/table\[\s*(\d+)\s*,\s*(\d+)\s*\]/g,
        (_, cols, rows) => generateMarkdownTable(parseInt(cols, 10), parseInt(rows, 10))
      )

      // Convert @slug to note links
      if (notes) {
        part = part.replace(/@([\w-]+)/g, (match, slug) => {
          const note = notes.find((n) => n.slug === slug)
          if (note) return `[${note.title}](/notes/${note.id})`
          return match
        })
      }

      // Convert /ai[prompt] to fenced code block with cengo-ai info string
      part = part.replace(
        /\/ai\[([^\]]*)\]/g,
        (_, prompt) => `\`\`\`cengo-ai\n${prompt.trim()}\n\`\`\``
      )

      return part
    })
    .join("")
}
