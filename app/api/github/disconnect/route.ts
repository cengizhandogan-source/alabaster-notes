import { createClient } from "@/lib/supabase/server"

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 })

  // Delete all GitHub data for the user
  await supabase.from("github_repositories").delete().eq("user_id", user.id)
  await supabase.from("github_connections").delete().eq("user_id", user.id)

  return Response.json({ ok: true })
}
