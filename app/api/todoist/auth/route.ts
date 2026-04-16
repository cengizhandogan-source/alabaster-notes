import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 })

  const clientId = process.env.TODOIST_CLIENT_ID
  if (!clientId) return Response.json({ error: "Todoist not configured" }, { status: 500 })

  // CSRF protection via state parameter
  const state = crypto.randomUUID()
  const cookieStore = await cookies()
  cookieStore.set("todoist_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  })

  const params = new URLSearchParams({
    client_id: clientId,
    scope: "data:read_write",
    state,
  })

  redirect(`https://todoist.com/oauth/authorize?${params}`)
}
