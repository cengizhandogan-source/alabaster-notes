"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createTag(name: string, color: string) {
  if (name.length > 10) throw new Error("Tag name must be 10 characters or less")

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data, error } = await supabase
    .from("tags")
    .insert({ user_id: user.id, name, color })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath("/notes")
  return data
}

export async function updateTag(id: string, name: string, color: string) {
  if (name.length > 10) throw new Error("Tag name must be 10 characters or less")

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { error } = await supabase
    .from("tags")
    .update({ name, color })
    .eq("id", id)

  if (error) throw new Error(error.message)
  revalidatePath("/notes")
}

export async function deleteTag(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { error } = await supabase
    .from("tags")
    .delete()
    .eq("id", id)

  if (error) throw new Error(error.message)
  revalidatePath("/notes")
}

export async function addTagToNote(noteId: string, tagId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { error } = await supabase
    .from("note_tags")
    .insert({ note_id: noteId, tag_id: tagId })

  if (error) throw new Error(error.message)
  revalidatePath("/notes")
}

export async function removeTagFromNote(noteId: string, tagId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { error } = await supabase
    .from("note_tags")
    .delete()
    .eq("note_id", noteId)
    .eq("tag_id", tagId)

  if (error) throw new Error(error.message)
  revalidatePath("/notes")
}

export async function addTagToFolder(folderId: string, tagId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { error } = await supabase
    .from("folder_tags")
    .insert({ folder_id: folderId, tag_id: tagId })

  if (error) throw new Error(error.message)
  revalidatePath("/notes")
}

export async function removeTagFromFolder(folderId: string, tagId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { error } = await supabase
    .from("folder_tags")
    .delete()
    .eq("folder_id", folderId)
    .eq("tag_id", tagId)

  if (error) throw new Error(error.message)
  revalidatePath("/notes")
}
