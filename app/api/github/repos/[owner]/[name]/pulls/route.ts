import { createClient } from "@/lib/supabase/server"
import { getGithubToken, listPullRequests } from "@/lib/github/client"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ owner: string; name: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 })

  const token = await getGithubToken(user.id)
  if (!token) return Response.json({ error: "GitHub not connected" }, { status: 400 })

  const { owner, name } = await params
  const pulls = await listPullRequests(token, owner, name)

  return Response.json(
    pulls.map((p: { number: number; title: string; state: string; html_url: string; user: { login: string }; merged_at: string | null }) => ({
      number: p.number,
      title: p.title,
      state: p.merged_at ? "merged" : p.state,
      url: p.html_url,
      author: p.user.login,
    }))
  )
}
