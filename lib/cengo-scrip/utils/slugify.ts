import type { Note } from "@/lib/types"

export type NoteRef = {
  id: string
  title: string
  slug: string
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export function toNoteRefs(notes: Note[]): NoteRef[] {
  return notes
    .filter((n) => n.title.trim() !== "")
    .map((n) => ({ id: n.id, title: n.title, slug: slugify(n.title) }))
}
