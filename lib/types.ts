export type Note = {
  id: string
  user_id: string
  title: string
  content: string
  folder_id: string | null
  created_at: string
  updated_at: string
}

export type Folder = {
  id: string
  user_id: string
  name: string
  created_at: string
  updated_at: string
}
