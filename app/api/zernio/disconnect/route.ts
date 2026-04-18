import { createClient } from "@/lib/supabase/server"
import { deleteLocalZernioProfile, deleteZernioProfile, getZernioProfileId } from "@/lib/zernio/client"

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 })

  const profileId = await getZernioProfileId(user.id)
  if (profileId) {
    await deleteZernioProfile(profileId)
  }
  await deleteLocalZernioProfile(user.id)

  return Response.json({ ok: true })
}
