import { createClient } from "@/lib/supabase/server"
import { getTodoistToken, createTask } from "@/lib/todoist/client"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 })

  const token = await getTodoistToken(user.id)
  if (!token) return Response.json({ error: "Todoist not connected" }, { status: 400 })

  const body = await request.json()
  const { content, due_string, priority, labels } = body

  if (!content) {
    return Response.json({ error: "content is required" }, { status: 400 })
  }

  try {
    const task = await createTask(token, content, { due_string, priority, labels })

    return Response.json({
      id: task.id,
      content: task.content,
      url: task.url,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create task"
    return Response.json({ error: message }, { status: 500 })
  }
}
