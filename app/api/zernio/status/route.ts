import { createClient } from "@/lib/supabase/server"
import { listInstagramAccountsForUser } from "@/lib/zernio/client"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 })

  try {
    const accounts = await listInstagramAccountsForUser(user.id)
    return Response.json({
      connected: accounts.length > 0,
      accounts: accounts.map((a) => ({
        id: a._id,
        username: a.username,
        displayName: a.displayName || a.username,
        profileImage: a.profileImage || null,
        healthStatus: a.healthStatus || "connected",
      })),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch zernio status"
    return Response.json({ error: message }, { status: 500 })
  }
}
