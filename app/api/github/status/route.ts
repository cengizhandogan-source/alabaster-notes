import { createClient } from "@/lib/supabase/server"
import { getGithubConnection } from "@/lib/github/client"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 })

  const connection = await getGithubConnection(user.id)

  return Response.json({
    connected: !!connection,
    username: connection?.github_username ?? null,
  })
}
