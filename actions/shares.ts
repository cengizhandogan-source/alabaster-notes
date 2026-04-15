"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createShare(noteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data, error } = await supabase
    .from("note_shares")
    .insert({ note_id: noteId, user_id: user.id })
    .select("share_token")
    .single()

  if (error) throw new Error(error.message)

  revalidatePath("/notes")
  return data.share_token as string
}

export async function deleteShare(noteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { error } = await supabase
    .from("note_shares")
    .delete()
    .eq("note_id", noteId)

  if (error) throw new Error(error.message)
  revalidatePath("/notes")
}

export async function getShare(noteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data } = await supabase
    .from("note_shares")
    .select("*")
    .eq("note_id", noteId)
    .single()

  return data
}
