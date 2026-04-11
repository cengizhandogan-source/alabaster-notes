"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createNote(folderId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data, error } = await supabase
    .from("notes")
    .insert({ user_id: user.id, title: "", content: "", folder_id: folderId ?? null })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath("/notes")
  redirect(`/notes/${data.id}`)
}

export async function moveNoteToFolder(noteId: string, folderId: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { error } = await supabase
    .from("notes")
    .update({ folder_id: folderId })
    .eq("id", noteId)

  if (error) throw new Error(error.message)
  revalidatePath("/notes")
}

export async function updateNote(id: string, title: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { error } = await supabase
    .from("notes")
    .update({ title, content })
    .eq("id", id)

  if (error) throw new Error(error.message)
  revalidatePath("/notes")
}

export async function deleteNote(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", id)

  if (error) throw new Error(error.message)
  revalidatePath("/notes")
  redirect("/notes")
}
