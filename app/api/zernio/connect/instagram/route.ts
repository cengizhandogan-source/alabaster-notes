import { createClient } from "@/lib/supabase/server"
import { getConnectUrl, getOrCreateZernioProfileId } from "@/lib/zernio/client"
import { redirect } from "next/navigation"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(connectPageHtml("you must be signed in to alabaster-notes first."), {
      status: 401,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    })
  }

  let authUrl: string
  try {
    const profileName = user.email || `alabaster-${user.id.slice(0, 8)}`
    const profileId = await getOrCreateZernioProfileId(user.id, profileName)
    const res = await getConnectUrl("instagram", profileId)
    if (!res?.authUrl) throw new Error("Zernio did not return an authUrl")
    authUrl = res.authUrl
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to start Instagram connect flow"
    return new Response(connectPageHtml(message), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    })
  }

  redirect(authUrl)
}

function connectPageHtml(message: string) {
  const safe = message.replace(/</g, "&lt;").replace(/>/g, "&gt;")
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>connect instagram</title>
<style>body{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,monospace;background:#0b0b0b;color:#e8e8e8;padding:24px;line-height:1.5}button{background:#e8e8e8;color:#0b0b0b;border:0;padding:8px 14px;font-family:inherit;font-size:13px;cursor:pointer}</style>
</head><body>
<p>${safe}</p>
<button onclick="window.close()">close</button>
</body></html>`
}
