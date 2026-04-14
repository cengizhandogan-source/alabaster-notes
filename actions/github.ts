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

  const { error } = await supabase
    .from("github_repositories")
    .delete()
    .eq("id", repoId)

  if (error) throw new Error(error.message)

  revalidatePath("/settings")
  revalidatePath("/notes")
}

