"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createFolder(parentId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Get max position among siblings
  let query = supabase.from("folders").select("position").eq("user_id", user.id)
  if (parentId) {
    query = query.eq("parent_id", parentId)
  } else {
    query = query.is("parent_id", null)
  }
  const { data: siblings } = await query.order("position", { ascending: false }).limit(1)
  const position = (siblings?.[0]?.position ?? 0) + 1000

  const { error } = await supabase
    .from("folders")
    .insert({ user_id: user.id, name: "New Folder", parent_id: parentId ?? null, position })

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

export async function moveFolderToParent(folderId: string, parentId: string | null, position: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { error } = await supabase
    .from("folders")
    .update({ parent_id: parentId, position })
    .eq("id", folderId)

  if (error) throw new Error(error.message)
  revalidatePath("/notes")
}

export async function reorderFolder(folderId: string, position: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { error } = await supabase
    .from("folders")
    .update({ position })
    .eq("id", folderId)

  if (error) throw new Error(error.message)
  revalidatePath("/notes")
}
