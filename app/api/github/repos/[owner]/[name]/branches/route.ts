import { createClient } from "@/lib/supabase/server"
import { getGithubToken, listBranches } from "@/lib/github/client"

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
  const branches = await listBranches(token, owner, name)

  return Response.json(
    branches.map((b: { name: string }) => ({ name: b.name }))
  )
}
