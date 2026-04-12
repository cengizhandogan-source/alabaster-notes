"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
])

export async function uploadFile(
  formData: FormData
): Promise<{ url: string; name: string; isImage: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const file = formData.get("file") as File
  if (!file || file.size === 0) throw new Error("No file provided")
  if (file.size > MAX_SIZE) throw new Error("File exceeds 10MB limit")

  const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
  const path = `${user.id}/${crypto.randomUUID()}_${sanitized}`

  const { error } = await supabase.storage
    .from("attachments")
    .upload(path, file)
  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from("attachments").getPublicUrl(path)

  return {
    url: data.publicUrl,
    name: file.name,
    isImage: IMAGE_TYPES.has(file.type),
  }
}
