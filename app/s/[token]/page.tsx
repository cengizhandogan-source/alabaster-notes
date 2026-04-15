import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { SharedNoteViewer } from "@/components/editor/shared-note-viewer"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  const supabase = await createClient()
  const { data } = await supabase.rpc("get_shared_note", { p_token: token })
  const note = data?.[0]

  return {
    title: note?.title ? `${note.title} — Alabaster Notes` : "Shared Note — Alabaster Notes",
    description: "A shared note on Alabaster Notes",
  }
}

export default async function SharedNotePage({ params }: Props) {
  const { token } = await params
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("get_shared_note", { p_token: token })
  const note = data?.[0]

  if (error || !note) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col py-6 px-4">
        <header className="mb-4 pb-4 border-b border-border">
          {note.title && (
            <h1 className="text-lg font-medium text-foreground">{note.title}</h1>
          )}
          <p className="text-xs text-muted mt-1">
            shared note &middot; read only
          </p>
        </header>

        <SharedNoteViewer content={note.content} />

        <footer className="mt-8 pt-4 border-t border-border text-center">
          <a
            href="/"
            className="text-xs text-muted hover:text-secondary transition-colors duration-100"
          >
            alabaster notes
          </a>
        </footer>
      </div>
    </div>
  )
}
