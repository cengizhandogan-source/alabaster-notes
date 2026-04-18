import { createClient } from "@/lib/supabase/server"
import { createPost, listInstagramAccountsForUser } from "@/lib/zernio/client"

type CreatePostBody = {
  caption: string
  mediaUrl?: string
  mediaType?: "image" | "video"
  accountId: string
  publishNow?: boolean
  scheduledFor?: string
  contentType?: "feed" | "reels" | "story"
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 })

  let body: CreatePostBody
  try {
    body = (await request.json()) as CreatePostBody
  } catch {
    return Response.json({ error: "invalid json body" }, { status: 400 })
  }

  if (!body.caption || !body.accountId) {
    return Response.json({ error: "caption and accountId are required" }, { status: 400 })
  }

  const allowedAccounts = await listInstagramAccountsForUser(user.id)
  const account = allowedAccounts.find((a) => a._id === body.accountId)
  if (!account) {
    return Response.json({ error: "account not connected for this user" }, { status: 403 })
  }

  const mediaItems =
    body.mediaUrl && body.mediaUrl.trim().length > 0
      ? [{ type: body.mediaType || "image", url: body.mediaUrl.trim() }]
      : undefined

  const platformSpecificData =
    body.contentType && body.contentType !== "feed"
      ? { contentType: body.contentType, shareToFeed: true }
      : undefined

  try {
    const post = await createPost({
      content: body.caption,
      mediaItems,
      accountId: body.accountId,
      platform: "instagram",
      publishNow: body.publishNow,
      scheduledFor: body.scheduledFor,
      platformSpecificData,
    })

    return Response.json({ id: post._id, status: post.status })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create post"
    return Response.json({ error: message }, { status: 500 })
  }
}
