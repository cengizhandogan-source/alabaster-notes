import { createClient } from "@/lib/supabase/server"
import { getPost } from "@/lib/zernio/client"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 })

  const { postId } = await params

  try {
    const post = await getPost(postId)
    const ig = post.platforms.find((p) => p.platform === "instagram")
    const firstMedia = post.mediaItems?.[0]
    return Response.json({
      id: post._id,
      caption: post.content,
      status: post.status,
      platformStatus: ig?.status || null,
      scheduledFor: post.scheduledFor,
      publishedAt: post.publishedAt,
      media: firstMedia ? { type: firstMedia.type, url: firstMedia.url } : null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch post"
    const status = message.includes("404") ? 404 : 500
    return Response.json({ error: message }, { status })
  }
}
