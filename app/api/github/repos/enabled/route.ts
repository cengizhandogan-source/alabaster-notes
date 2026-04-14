import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 })

  const { data } = await supabase
    .from("github_repositories")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })

  return Response.json(data ?? [])
}
