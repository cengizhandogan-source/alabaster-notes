import { Folder, Note, FolderTreeNode } from "./types"

export function buildFolderTree(folders: Folder[], notes: Note[]): { tree: FolderTreeNode[]; unfiledNotes: Note[] } {
  const childrenMap = new Map<string | null, Folder[]>()
  const notesMap = new Map<string | null, Note[]>()

  for (const folder of folders) {
    const key = folder.parent_id ?? "__root__"
    const list = childrenMap.get(key) ?? []
    list.push(folder)
    childrenMap.set(key, list)
  }

  for (const note of notes) {
    const key = note.folder_id ?? "__unfiled__"
    const list = notesMap.get(key) ?? []
    list.push(note)
    notesMap.set(key, list)
  }

  function build(parentId: string | null): FolderTreeNode[] {
    const key = parentId ?? "__root__"
    const children = childrenMap.get(key) ?? []
    return children
      .sort((a, b) => a.position - b.position)
      .map((folder) => ({
        ...folder,
        children: build(folder.id),
        notes: (notesMap.get(folder.id) ?? []).sort((a, b) => a.position - b.position),
      }))
  }

  return {
    tree: build(null),
    unfiledNotes: (notesMap.get("__unfiled__") ?? []).sort((a, b) => a.position - b.position),
  }
}
