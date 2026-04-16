import { createClient } from "@/lib/supabase/server"
import { getTodoistToken, getTodayTasks } from "@/lib/todoist/client"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 })

  const token = await getTodoistToken(user.id)
  if (!token) return Response.json({ error: "Todoist not connected" }, { status: 400 })

  try {
    const tasks = await getTodayTasks(token)

    return Response.json(
      tasks.map((task: { id: string; content: string; description: string; priority: number; due: { date: string; string: string; is_recurring: boolean } | null; labels: string[]; project_id: string; is_completed: boolean; url: string }) => ({
        id: task.id,
        content: task.content,
        description: task.description || "",
        priority: task.priority,
        due: task.due || null,
        labels: task.labels || [],
        project_id: task.project_id,
        is_completed: task.is_completed,
        url: task.url,
      }))
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch tasks"
    return Response.json({ error: message }, { status: 500 })
  }
}
