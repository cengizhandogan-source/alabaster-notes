"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function addRepository(repo: {
  github_repo_id: number
  owner: string
  name: string
  full_name: string
  default_branch: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data, error } = await supabase
    .from("github_repositories")
    .insert({ user_id: user.id, ...repo })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath("/settings")
  revalidatePath("/notes")
  return data
}

export async function removeRepository(repoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Delete links associated with this repo first
  await supabase.from("github_links").delete().eq("repo_id", repoId)

  const { error } = await supabase
    .from("github_repositories")
    .delete()
    .eq("id", repoId)

  if (error) throw new Error(error.message)

  revalidatePath("/settings")
  revalidatePath("/notes")
}

export async function linkGithubEntity(
  target: { noteId?: string; folderId?: string },
  repoId: string,
  entityType: "branch" | "pull_request" | "commit",
  entityRef: string,
  entityTitle?: string,
  entityUrl?: string,
  entityState?: string,
  entityAuthor?: string,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data, error } = await supabase
    .from("github_links")
    .insert({
      user_id: user.id,
      note_id: target.noteId ?? null,
      folder_id: target.folderId ?? null,
      repo_id: repoId,
      entity_type: entityType,
      entity_ref: entityRef,
      entity_title: entityTitle ?? null,
      entity_url: entityUrl ?? null,
      entity_state: entityState ?? null,
      entity_author: entityAuthor ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath("/notes")
  return data
}

export async function unlinkGithubEntity(linkId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { error } = await supabase
    .from("github_links")
    .delete()
    .eq("id", linkId)

  if (error) throw new Error(error.message)
  revalidatePath("/notes")
}
