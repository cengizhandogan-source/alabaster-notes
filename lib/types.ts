export type Note = {
  id: string
  user_id: string
  title: string
  content: string
  folder_id: string | null
  position: number
  note_key: string | null
  created_at: string
  updated_at: string
}

export type Folder = {
  id: string
  user_id: string
  name: string
  parent_id: string | null
  position: number
  created_at: string
  updated_at: string
}

export type FolderTreeNode = Folder & {
  children: FolderTreeNode[]
  notes: Note[]
}

export type Tag = {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export type NoteTag = {
  note_id: string
  tag_id: string
}

export type FolderTag = {
  folder_id: string
  tag_id: string
}

export type NoteShare = {
  id: string
  note_id: string
  user_id: string
  share_token: string
  created_at: string
}

export type GithubConnection = {
  id: string
  user_id: string
  github_user_id: number
  github_username: string
  scopes: string | null
  created_at: string
  updated_at: string
}

export type GithubRepository = {
  id: string
  user_id: string
  github_repo_id: number
  owner: string
  name: string
  full_name: string
  default_branch: string
  created_at: string
}

