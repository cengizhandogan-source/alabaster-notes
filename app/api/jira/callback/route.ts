import { createClient } from "@/lib/supabase/server"
import { getJiraUser } from "@/lib/jira/client"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const error = url.searchParams.get("error")

  if (error) {
    return Response.json({ error: url.searchParams.get("error_description") || error }, { status: 400 })
  }

  if (!code || !state) {
    return Response.json({ error: "missing code or state" }, { status: 400 })
  }

  // Verify CSRF state
  const cookieStore = await cookies()
  const savedState = cookieStore.get("jira_oauth_state")?.value
  cookieStore.delete("jira_oauth_state")

  if (state !== savedState) {
    return Response.json({ error: "invalid state" }, { status: 403 })
  }

  // Verify user is authenticated
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 })

  const clientId = process.env.JIRA_CLIENT_ID
  const clientSecret = process.env.JIRA_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return Response.json({ error: "Jira not configured" }, { status: 500 })
  }

  // Exchange code for access token
  const tokenRes = await fetch("https://auth.atlassian.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3456"}/api/jira/callback`,
    }),
  })

  const tokenData = await tokenRes.json()
  if (tokenData.error) {
    return Response.json({ error: tokenData.error_description || tokenData.error }, { status: 400 })
  }

  const tokenExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()

  // Fetch accessible Jira Cloud sites
  const resourcesRes = await fetch("https://api.atlassian.com/oauth/token/accessible-resources", {
    headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: "application/json" },
  })
  const resources = await resourcesRes.json()

  // Find the first Jira site
  const jiraSite = resources.find((r: { scopes: string[] }) =>
    r.scopes?.some((s: string) => s.includes("jira"))
  ) || resources[0]

  if (!jiraSite) {
    return Response.json({ error: "No accessible Jira site found" }, { status: 400 })
  }

  // Fetch Atlassian user profile
  const atlassianUser = await getJiraUser(tokenData.access_token)

  // Upsert jira connection
  const { error: dbError } = await supabase
    .from("jira_connections")
    .upsert({
      user_id: user.id,
      atlassian_account_id: atlassianUser.account_id,
      email: atlassianUser.email || null,
      display_name: atlassianUser.name || atlassianUser.nickname || "Unknown",
      cloud_id: jiraSite.id,
      cloud_name: jiraSite.name,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expires_at: tokenExpiresAt,
      scopes: tokenData.scope || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" })

  if (dbError) {
    return Response.json({ error: dbError.message }, { status: 500 })
  }

  redirect("/settings")
}
