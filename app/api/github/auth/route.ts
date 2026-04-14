import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 })

  const clientId = process.env.GITHUB_CLIENT_ID
  if (!clientId) return Response.json({ error: "GitHub not configured" }, { status: 500 })

  // CSRF protection via state parameter
  const state = crypto.randomUUID()
  const cookieStore = await cookies()
  cookieStore.set("github_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  })

  const params = new URLSearchParams({
    client_id: clientId,
    scope: "repo read:user",
    state,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3456"}/api/github/callback`,
  })

  redirect(`https://github.com/login/oauth/authorize?${params}`)
}
