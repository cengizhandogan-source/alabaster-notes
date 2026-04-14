"use client"

import { createContext, useContext, useState, useCallback, useRef } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core"
import { Folder, FolderTreeNode, Note } from "@/lib/types"
import { moveNoteToFolder, reorderNote } from "@/actions/notes"
import { moveFolderToParent, reorderFolder } from "@/actions/folders"
import { getInsertPosition } from "@/lib/position"
import { DragOverlayContent } from "./drag-overlay-content"

type DragType = "note" | "folder"

interface DndState {
  isDragging: boolean
  activeId: string | null
  activeType: DragType | null
  overId: string | null
}

const DndStateContext = createContext<DndState>({
  isDragging: false,
  activeId: null,
  activeType: null,
  overId: null,
})

export const useDndState = () => useContext(DndStateContext)

interface DndProviderProps {
  folderTree: FolderTreeNode[]
  unfiledNotes: Note[]
  allFolders: Folder[]
  allNotes: Note[]
  children: React.ReactNode
}

function isDescendant(folderId: string, potentialAncestorId: string, folders: Folder[]): boolean {
  const folderMap = new Map(folders.map((f) => [f.id, f]))
  let current = folderMap.get(folderId)
  while (current) {
    if (current.id === potentialAncestorId) return true
    if (!current.parent_id) break
    current = folderMap.get(current.parent_id)
  }
  return false
}

function findNoteInTree(tree: FolderTreeNode[], noteId: string): { folderId: string | null; siblings: Note[] } | null {
  for (const node of tree) {
    const found = node.notes.find((n) => n.id === noteId)
    if (found) return { folderId: node.id, siblings: node.notes }
    const deep = findNoteInTree(node.children, noteId)
    if (deep) return deep
  }
  return null
}

function findFolderParent(tree: FolderTreeNode[], folderId: string, parentId: string | null = null): { parentId: string | null; siblings: FolderTreeNode[] } | null {
  for (const node of tree) {
    if (node.id === folderId) return { parentId, siblings: tree }
    const deep = findFolderParent(node.children, folderId, node.id)
    if (deep) return deep
  }
  return null
}

export function DndProvider({ folderTree, unfiledNotes, allFolders, allNotes, children }: DndProviderProps) {
  const [state, setState] = useState<DndState>({
    isDragging: false,
    activeId: null,
    activeType: null,
    overId: null,
  })

  const activeItemRef = useRef<Note | Folder | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    const type = (active.data.current?.type as DragType) ?? "note"
    const item = active.data.current?.item as Note | Folder | null
    activeItemRef.current = item ?? null
    setState({ isDragging: true, activeId: String(active.id), activeType: type, overId: null })
  }, [])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const overId = event.over ? String(event.over.id) : null
    setState((prev) => ({ ...prev, overId }))
  }, [])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    setState({ isDragging: false, activeId: null, activeType: null, overId: null })

    if (!over || active.id === over.id) return

    const activeType = active.data.current?.type as DragType
    const overId = String(over.id)
    const overType = over.data.current?.type as string | undefined

    if (activeType === "note") {
      const noteId = String(active.id)

      // Dropping onto a folder drop zone
      if (overType === "folder-drop") {
        const targetFolderId = over.data.current?.folderId as string | null
        await moveNoteToFolder(noteId, targetFolderId)
        return
      }

      // Dropping onto another note (reorder within same container or move)
      if (overType === "note") {
        const overNote = allNotes.find((n) => n.id === overId)
        const activeNote = allNotes.find((n) => n.id === noteId)
        if (!overNote || !activeNote) return

        if (activeNote.folder_id === overNote.folder_id) {
          // Reorder within same folder
          const siblings = activeNote.folder_id
            ? (findNoteInTree(folderTree, overNote.id)?.siblings ?? [])
            : unfiledNotes
          const filtered = siblings.filter((n) => n.id !== noteId)
          const targetIdx = filtered.findIndex((n) => n.id === overId)
          const pos = getInsertPosition(filtered, targetIdx)
          if (pos > 0) await reorderNote(noteId, pos)
        } else {
          // Move to different folder
          await moveNoteToFolder(noteId, overNote.folder_id)
        }
        return
      }
    }

    if (activeType === "folder") {
      const folderId = String(active.id)

      // Dropping onto a folder drop zone (nest inside)
      if (overType === "folder-drop") {
        const targetParentId = over.data.current?.folderId as string | null

        // Cycle prevention
        if (targetParentId && (targetParentId === folderId || isDescendant(targetParentId, folderId, allFolders))) {
          return
        }

        const targetSiblings = targetParentId
          ? folderTree.find((n) => n.id === targetParentId)?.children ?? []
          : folderTree
        const pos = getInsertPosition(targetSiblings.filter((f) => f.id !== folderId), targetSiblings.length)
        await moveFolderToParent(folderId, targetParentId, pos > 0 ? pos : 1000)
        return
      }

      // Dropping onto another folder (reorder among siblings)
      if (overType === "folder") {
        const targetFolderId = overId

        // Cycle prevention
        if (targetFolderId === folderId || isDescendant(targetFolderId, folderId, allFolders)) {
          return
        }

        const currentInfo = findFolderParent(folderTree, folderId)
        const targetInfo = findFolderParent(folderTree, targetFolderId)

        if (currentInfo && targetInfo && currentInfo.parentId === targetInfo.parentId) {
          // Same parent - reorder
          const filtered = currentInfo.siblings.filter((f) => f.id !== folderId)
          const targetIdx = filtered.findIndex((f) => f.id === targetFolderId)
          const pos = getInsertPosition(filtered, targetIdx)
          if (pos > 0) await reorderFolder(folderId, pos)
        } else {
          // Different parent - move
          const newParentId = targetInfo?.parentId ?? null
          if (newParentId && isDescendant(newParentId, folderId, allFolders)) return
          const siblings = targetInfo?.siblings ?? folderTree
          const targetIdx = siblings.findIndex((f) => f.id === targetFolderId)
          const pos = getInsertPosition(siblings.filter((f) => f.id !== folderId), targetIdx)
          await moveFolderToParent(folderId, newParentId, pos > 0 ? pos : 1000)
        }
        return
      }
    }
  }, [folderTree, unfiledNotes, allFolders, allNotes])

  const handleDragCancel = useCallback(() => {
    setState({ isDragging: false, activeId: null, activeType: null, overId: null })
  }, [])

  return (
    <DndStateContext.Provider value={state}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {children}
        <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
          {state.activeId && activeItemRef.current ? (
            <DragOverlayContent type={state.activeType!} item={activeItemRef.current} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </DndStateContext.Provider>
  )
}
