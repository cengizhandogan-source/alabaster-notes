import { createClient } from "@/lib/supabase/server"
import { getGithubToken, listRepos } from "@/lib/github/client"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 })

  const token = await getGithubToken(user.id)
  if (!token) return Response.json({ error: "GitHub not connected" }, { status: 400 })

  const repos = await listRepos(token)

  return Response.json(
    repos.map((r: { id: number; full_name: string; name: string; owner: { login: string }; default_branch: string; private: boolean }) => ({
      id: r.id,
      full_name: r.full_name,
      name: r.name,
      owner: r.owner.login,
      default_branch: r.default_branch,
      private: r.private,
    }))
  )
}
