import { createClient } from "@/lib/supabase/server"
import { getGithubUser } from "@/lib/github/client"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")

  if (!code || !state) {
    return Response.json({ error: "missing code or state" }, { status: 400 })
  }

  // Verify CSRF state
  const cookieStore = await cookies()
  const savedState = cookieStore.get("github_oauth_state")?.value
  cookieStore.delete("github_oauth_state")

  if (state !== savedState) {
    return Response.json({ error: "invalid state" }, { status: 403 })
  }

  // Verify user is authenticated
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 })

  // Exchange code for access token
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  })

  const tokenData = await tokenRes.json()
  if (tokenData.error) {
    return Response.json({ error: tokenData.error_description }, { status: 400 })
  }

  // Fetch GitHub user profile
  const githubUser = await getGithubUser(tokenData.access_token)

  // Upsert github connection
  const { error } = await supabase
    .from("github_connections")
    .upsert({
      user_id: user.id,
      github_user_id: githubUser.id,
      github_username: githubUser.login,
      access_token: tokenData.access_token,
      scopes: tokenData.scope || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  redirect("/settings")
}
