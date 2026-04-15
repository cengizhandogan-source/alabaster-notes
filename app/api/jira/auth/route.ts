import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 })

  const clientId = process.env.JIRA_CLIENT_ID
  if (!clientId) return Response.json({ error: "Jira not configured" }, { status: 500 })

  // CSRF protection via state parameter
  const state = crypto.randomUUID()
  const cookieStore = await cookies()
  cookieStore.set("jira_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  })

  const params = new URLSearchParams({
    audience: "api.atlassian.com",
    client_id: clientId,
    scope: "read:me read:jira-work read:jira-user offline_access",
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3456"}/api/jira/callback`,
    state,
    response_type: "code",
    prompt: "consent",
  })

  redirect(`https://auth.atlassian.com/authorize?${params}`)
}
