export type ZernioPlatform =
  | "instagram"
  | "twitter"
  | "facebook"
  | "linkedin"
  | "tiktok"
  | "youtube"
  | "pinterest"
  | "reddit"
  | "bluesky"
  | "threads"
  | "googlebusiness"
  | "telegram"
  | "snapchat"
  | "whatsapp"
  | "discord"

export type ZernioProfileRow = {
  id: string
  user_id: string
  zernio_profile_id: string
  created_at: string
  updated_at: string
}

export type ZernioProfile = {
  _id: string
  name: string
  description?: string
  color?: string
  isDefault?: boolean
}

export type ZernioAccount = {
  _id: string
  platform: ZernioPlatform
  username: string
  displayName?: string
  profileImage?: string
  createdAt?: string
  healthStatus?: "connected" | "disconnected" | "warning"
  profileId: string
}

export type ZernioMediaItem = {
  type: "image" | "video"
  url: string
}

export type ZernioPostPlatform = {
  platform: ZernioPlatform
  accountId: string
  status?: "pending" | "published" | "failed"
  platformSpecificData?: Record<string, unknown>
}

export type ZernioPost = {
  _id: string
  content: string
  status: "draft" | "scheduled" | "published" | "failed"
  scheduledFor: string | null
  publishedAt: string | null
  mediaItems?: ZernioMediaItem[]
  platforms: ZernioPostPlatform[]
}
