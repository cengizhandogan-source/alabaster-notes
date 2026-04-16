import { createClient } from "@/lib/supabase/server"

const TODOIST_API = "https://api.todoist.com/rest/v2"

async function todoistFetch(token: string, endpoint: string, options?: RequestInit) {
  const res = await fetch(`${TODOIST_API}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Todoist API ${res.status}: ${body}`)
  }

  // Some endpoints (like close) return 204 with no body
  if (res.status === 204) return null

  return res.json()
}

export async function getTodoistToken(userId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("todoist_connections")
    .select("access_token")
    .eq("user_id", userId)
    .single()

  if (!data) return null
  return data.access_token
}

export async function getTodoistConnection(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("todoist_connections")
    .select("id, user_id, todoist_user_id, email, display_name, scopes, created_at, updated_at")
    .eq("user_id", userId)
    .single()

  return data
}

export function getTask(token: string, taskId: string) {
  return todoistFetch(token, `/tasks/${taskId}`)
}

export function getTodayTasks(token: string) {
  return todoistFetch(token, `/tasks?filter=today`)
}

export function createTask(token: string, content: string, options?: { due_string?: string; priority?: number; labels?: string[] }) {
  return todoistFetch(token, "/tasks", {
    method: "POST",
    body: JSON.stringify({ content, ...options }),
  })
}

export function closeTask(token: string, taskId: string) {
  return todoistFetch(token, `/tasks/${taskId}/close`, { method: "POST" })
}

export function getTodoistUser(token: string) {
  return fetch("https://api.todoist.com/sync/v9/user", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then((res) => {
    if (!res.ok) throw new Error(`Todoist user API ${res.status}`)
    return res.json()
  })
}
