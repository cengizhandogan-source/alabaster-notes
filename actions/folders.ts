"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createFolder() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { error } = await supabase
    .from("folders")
    .insert({ user_id: user.id, name: "New Folder" })

  if (error) throw new Error(error.message)
  revalidatePath("/notes")
}

export async function renameFolder(id: string, name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { error } = await supabase
    .from("folders")
    .update({ name })
    .eq("id", id)

  if (error) throw new Error(error.message)
  revalidatePath("/notes")
}

export async function deleteFolder(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { error } = await supabase
    .from("folders")
    .delete()
    .eq("id", id)

  if (error) throw new Error(error.message)
  revalidatePath("/notes")
}
