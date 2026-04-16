import { createClient } from "@/lib/supabase/server"
import { getTodoistUser } from "@/lib/todoist/client"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const error = url.searchParams.get("error")

  if (error) {
    return Response.json({ error }, { status: 400 })
  }

  if (!code || !state) {
    return Response.json({ error: "missing code or state" }, { status: 400 })
  }

  // Verify CSRF state
  const cookieStore = await cookies()
  const savedState = cookieStore.get("todoist_oauth_state")?.value
  cookieStore.delete("todoist_oauth_state")

  if (state !== savedState) {
    return Response.json({ error: "invalid state" }, { status: 403 })
  }

  // Verify user is authenticated
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 })

  const clientId = process.env.TODOIST_CLIENT_ID
  const clientSecret = process.env.TODOIST_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return Response.json({ error: "Todoist not configured" }, { status: 500 })
  }

  // Exchange code for access token
  const tokenRes = await fetch("https://todoist.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  })

  const tokenData = await tokenRes.json()
  if (tokenData.error) {
    return Response.json({ error: tokenData.error }, { status: 400 })
  }

  // Fetch Todoist user profile
  const todoistUser = await getTodoistUser(tokenData.access_token)

  // Upsert todoist connection
  const { error: dbError } = await supabase
    .from("todoist_connections")
    .upsert({
      user_id: user.id,
      todoist_user_id: String(todoistUser.id),
      email: todoistUser.email || null,
      display_name: todoistUser.full_name || todoistUser.email || "Unknown",
      access_token: tokenData.access_token,
      scopes: tokenData.token_type || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" })

  if (dbError) {
    return Response.json({ error: dbError.message }, { status: 500 })
  }

  redirect("/settings")
}
