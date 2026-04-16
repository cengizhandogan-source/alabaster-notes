import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 })

  const { data } = await supabase
    .from("todoist_connections")
    .select("display_name, email")
    .eq("user_id", user.id)
    .single()

  if (!data) {
    return Response.json({ connected: false })
  }

  return Response.json({
    connected: true,
    displayName: data.display_name,
    email: data.email,
  })
}
