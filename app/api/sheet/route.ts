import { createClient } from "@/lib/supabase/server"
import { parseSheets, gridToCells } from "@/lib/cengo-scrip/spreadsheet/parser"
import { evaluateSheet } from "@/lib/cengo-scrip/spreadsheet/engine"
import { slugify } from "@/lib/cengo-scrip/utils/slugify"

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 })
  }

  const url = new URL(request.url)
  const slug = url.searchParams.get("slug")
  const sheetName = url.searchParams.get("sheet")

  if (!slug || !sheetName) {
    return Response.json({ error: "slug and sheet params required" }, { status: 400 })
  }

  // Fetch all notes for the user and find by slug
  const { data: notes, error } = await supabase
    .from("notes")
    .select("id, title, content")
    .eq("user_id", user.id)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const note = notes?.find((n) => slugify(n.title) === slug)
  if (!note) {
    return Response.json({ error: `Note "${slug}" not found` }, { status: 404 })
  }

  // Parse sheets from the note content
  const sheets = parseSheets(note.content || "")
  const sheet = sheets.find((s) => s.name === sheetName)

  if (!sheet) {
    return Response.json({ error: `Sheet "${sheetName}" not found in note "${slug}"` }, { status: 404 })
  }

  const cells = gridToCells(sheet.grid)
  const computed = evaluateSheet(cells)

  return Response.json({ cells: computed })
}
