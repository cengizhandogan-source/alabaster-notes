import { createClient } from "@/lib/supabase/server"
import { getTodoistToken, closeTask } from "@/lib/todoist/client"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 })

  const token = await getTodoistToken(user.id)
  if (!token) return Response.json({ error: "Todoist not connected" }, { status: 400 })

  const { id } = await params

  try {
    await closeTask(token, id)
    return Response.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to close task"
    return Response.json({ error: message }, { status: 500 })
  }
}
