import { createClient } from "@/lib/supabase/server"
import type {
  ZernioAccount,
  ZernioMediaItem,
  ZernioPlatform,
  ZernioPost,
  ZernioProfile,
} from "./types"

const ZERNIO_API = "https://zernio.com/api/v1"

function apiKey(): string {
  const key = process.env.ZERNIO_API_KEY
  if (!key) throw new Error("Zernio not configured: ZERNIO_API_KEY is missing")
  return key
}

async function zernioFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${ZERNIO_API}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Zernio API ${res.status}: ${body}`)
  }

  if (res.status === 204) return null as T
  return res.json() as Promise<T>
}

export async function getOrCreateZernioProfileId(userId: string, name: string): Promise<string> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("zernio_profiles")
    .select("zernio_profile_id")
    .eq("user_id", userId)
    .single()

  if (data?.zernio_profile_id) return data.zernio_profile_id

  const created = await zernioFetch<{ profile: ZernioProfile }>("/profiles", {
    method: "POST",
    body: JSON.stringify({
      name,
      description: "alabaster-notes user",
    }),
  })

  const profileId = created.profile._id
  if (!profileId) throw new Error("Zernio did not return a profile id")

  const { error } = await supabase
    .from("zernio_profiles")
    .upsert(
      {
        user_id: userId,
        zernio_profile_id: profileId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
  if (error) throw new Error(`Failed to save zernio profile: ${error.message}`)

  return profileId
}

export async function getZernioProfileId(userId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("zernio_profiles")
    .select("zernio_profile_id")
    .eq("user_id", userId)
    .single()
  return data?.zernio_profile_id ?? null
}

export async function deleteLocalZernioProfile(userId: string): Promise<void> {
  const supabase = await createClient()
  await supabase.from("zernio_profiles").delete().eq("user_id", userId)
}

export function getConnectUrl(platform: ZernioPlatform, profileId: string) {
  const params = new URLSearchParams({ profileId })
  return zernioFetch<{ authUrl: string }>(`/connect/${platform}?${params}`)
}

export async function listAccountsForProfile(profileId: string): Promise<ZernioAccount[]> {
  const { accounts } = await zernioFetch<{ accounts: ZernioAccount[] }>("/accounts")
  return (accounts || []).filter((a) => a.profileId === profileId)
}

export async function listInstagramAccountsForUser(userId: string): Promise<ZernioAccount[]> {
  const profileId = await getZernioProfileId(userId)
  if (!profileId) return []
  const accounts = await listAccountsForProfile(profileId)
  return accounts.filter((a) => a.platform === "instagram")
}

export function deleteZernioProfile(zernioProfileId: string) {
  return zernioFetch<unknown>(`/profiles/${zernioProfileId}`, { method: "DELETE" }).catch(() => {
    // Zernio may not expose this; best-effort only.
  })
}

export type CreatePostInput = {
  content: string
  mediaItems?: ZernioMediaItem[]
  accountId: string
  platform: ZernioPlatform
  publishNow?: boolean
  scheduledFor?: string
  platformSpecificData?: Record<string, unknown>
}

export async function createPost(input: CreatePostInput): Promise<ZernioPost> {
  const body: Record<string, unknown> = {
    content: input.content,
    platforms: [
      {
        platform: input.platform,
        accountId: input.accountId,
        ...(input.platformSpecificData ? { platformSpecificData: input.platformSpecificData } : {}),
      },
    ],
  }
  if (input.mediaItems && input.mediaItems.length > 0) body.mediaItems = input.mediaItems
  if (input.publishNow) body.publishNow = true
  if (input.scheduledFor) body.scheduledFor = input.scheduledFor

  const { post } = await zernioFetch<{ post: ZernioPost }>("/posts", {
    method: "POST",
    body: JSON.stringify(body),
  })
  return post
}

export async function getPost(postId: string): Promise<ZernioPost> {
  const { post } = await zernioFetch<{ post: ZernioPost }>(`/posts/${postId}`)
  return post
}
