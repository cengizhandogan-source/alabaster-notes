"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createNote(folderId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Get max position among siblings
  let query = supabase.from("notes").select("position").eq("user_id", user.id)
  if (folderId) {
    query = query.eq("folder_id", folderId)
  } else {
    query = query.is("folder_id", null)
  }
  const { data: siblings } = await query.order("position", { ascending: false }).limit(1)
  const position = (siblings?.[0]?.position ?? 0) + 1000

  const { data, error } = await supabase
    .from("notes")
    .insert({ user_id: user.id, title: "", content: "", folder_id: folderId ?? null, position })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath("/notes")
  redirect(`/notes/${data.id}`)
}

export async function moveNoteToFolder(noteId: string, folderId: string | null, position?: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // If no position given, append to end
  if (position === undefined) {
    let query = supabase.from("notes").select("position").eq("user_id", user.id)
    if (folderId) {
      query = query.eq("folder_id", folderId)
    } else {
      query = query.is("folder_id", null)
    }
    const { data: siblings } = await query.order("position", { ascending: false }).limit(1)
    position = (siblings?.[0]?.position ?? 0) + 1000
  }

  const { error } = await supabase
    .from("notes")
    .update({ folder_id: folderId, position })
    .eq("id", noteId)

  if (error) throw new Error(error.message)
  revalidatePath("/notes")
}

export async function reorderNote(noteId: string, position: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { error } = await supabase
    .from("notes")
    .update({ position })
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
