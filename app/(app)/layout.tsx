import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { Toaster } from "sonner"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const [{ data: notes }, { data: folders }, { data: tags }, { data: noteTags }] = await Promise.all([
    supabase.from("notes").select("*").order("updated_at", { ascending: false }),
    supabase.from("folders").select("*").order("name", { ascending: true }),
    supabase.from("tags").select("*").order("name", { ascending: true }),
    supabase.from("note_tags").select("*"),
  ])

  return (
    <>
      <Toaster position="bottom-right" theme="dark" />
      <AppShell notes={notes ?? []} folders={folders ?? []} tags={tags ?? []} noteTags={noteTags ?? []}>{children}</AppShell>
    </>
  )
}
