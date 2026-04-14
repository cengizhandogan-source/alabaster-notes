import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { Toaster } from "sonner"
import { buildFolderTree } from "@/lib/build-folder-tree"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const [{ data: notes }, { data: folders }, { data: tags }, { data: noteTags }, { data: folderTags }, { data: githubRepos }, { data: githubConnection }] = await Promise.all([
    supabase.from("notes").select("*").order("position", { ascending: true }),
    supabase.from("folders").select("*").order("position", { ascending: true }),
    supabase.from("tags").select("*").order("name", { ascending: true }),
    supabase.from("note_tags").select("*"),
    supabase.from("folder_tags").select("*"),
    supabase.from("github_repositories").select("*"),
    supabase.from("github_connections").select("id, user_id, github_user_id, github_username, scopes, created_at, updated_at"),
  ])

  const { tree: folderTree, unfiledNotes } = buildFolderTree(folders ?? [], notes ?? [])

  return (
    <>
      <Toaster position="bottom-right" theme="dark" />
      <AppShell
        notes={notes ?? []}
        folders={folders ?? []}
        folderTree={folderTree}
        unfiledNotes={unfiledNotes}
        tags={tags ?? []}
        noteTags={noteTags ?? []}
        folderTags={folderTags ?? []}
        githubRepos={githubRepos ?? []}
        githubConnected={!!githubConnection}
      >
        {children}
      </AppShell>
    </>
  )
}
