import { createClient } from "@/lib/supabase/server"
import { getGithubToken, listCommits } from "@/lib/github/client"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ owner: string; name: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 })

  const token = await getGithubToken(user.id)
  if (!token) return Response.json({ error: "GitHub not connected" }, { status: 400 })

  const { owner, name } = await params
  const url = new URL(request.url)
  const branch = url.searchParams.get("branch") ?? undefined

  const commits = await listCommits(token, owner, name, branch)

  return Response.json(
    commits.map((c: { sha: string; commit: { message: string; author: { date: string } }; html_url: string; author: { login: string } | null; parents: { sha: string }[] }) => ({
      sha: c.sha.slice(0, 7),
      fullSha: c.sha,
      message: c.commit.message.split("\n")[0],
      url: c.html_url,
      author: c.author?.login ?? "unknown",
      date: c.commit.author.date,
      parents: c.parents.map((p) => p.sha.slice(0, 7)),
    }))
  )
}
