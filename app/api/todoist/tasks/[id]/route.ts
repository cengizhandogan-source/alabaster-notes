import { createClient } from "@/lib/supabase/server"
import { getTodoistToken, getTask } from "@/lib/todoist/client"

export async function GET(
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
    const task = await getTask(token, id)

    return Response.json({
      id: task.id,
      content: task.content,
      description: task.description || "",
      priority: task.priority,
      due: task.due || null,
      labels: task.labels || [],
      project_id: task.project_id,
      is_completed: task.is_completed,
      url: task.url,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch task"
    const status = message.includes("404") ? 404 : 500
    return Response.json({ error: message }, { status })
  }
}
