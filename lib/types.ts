export type Note = {
  id: string
  user_id: string
  title: string
  content: string
  folder_id: string | null
  position: number
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
