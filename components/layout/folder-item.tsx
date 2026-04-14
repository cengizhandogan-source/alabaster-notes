"use client"

import { useState, useRef, useEffect } from "react"
import { AnimatePresence, motion } from "motion/react"
import { useSortable } from "@dnd-kit/sortable"
import { useDroppable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { FolderTreeNode, Folder, Tag, NoteTag, FolderTag } from "@/lib/types"
import { NoteListItem } from "./note-list-item"
import { renameFolder, deleteFolder, createFolder } from "@/actions/folders"
import { createNote } from "@/actions/notes"
import { addTagToFolder, removeTagFromFolder } from "@/actions/tags"
import { TagPicker } from "@/components/shared/tag-picker"
import { useDndState } from "./dnd-provider"
import { ChevronRight, Folder as FolderIcon, FolderOpen, GripVertical } from "lucide-react"

interface FolderTreeItemProps {
  node: FolderTreeNode
  allFolders: Folder[]
  activeNoteId?: string
  onNoteClick?: () => void
  tags?: Tag[]
  noteTags?: NoteTag[]
  folderTags?: FolderTag[]
  depth?: number
}

export function FolderTreeItem({ node, allFolders, activeNoteId, onNoteClick, tags = [], noteTags = [], folderTags = [], depth = 0 }: FolderTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window === "undefined") return true
    const stored = localStorage.getItem(`folder-expanded-${node.id}`)
    return stored !== null ? stored === "true" : true
  })
  const [isRenaming, setIsRenaming] = useState(false)
  const [name, setName] = useState(node.name)
  const [showMenu, setShowMenu] = useState(false)
  const [showTagPicker, setShowTagPicker] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const dndState = useDndState()

  const folderTagIds = (folderTags ?? []).filter((ft) => ft.folder_id === node.id).map((ft) => ft.tag_id)
  const assignedTags = tags.filter((t) => folderTagIds.includes(t.id))

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: node.id,
    data: { type: "folder", item: node },
  })

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `folder-drop-${node.id}`,
    data: { type: "folder-drop", folderId: node.id },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  }

  useEffect(() => {
    localStorage.setItem(`folder-expanded-${node.id}`, String(isExpanded))
  }, [isExpanded, node.id])

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isRenaming])

  useEffect(() => {
    if (!showMenu) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showMenu])

  // Auto-expand when dragging over
  useEffect(() => {
    if (isOver && !isExpanded && dndState.isDragging) {
      const timer = setTimeout(() => setIsExpanded(true), 500)
      return () => clearTimeout(timer)
    }
  }, [isOver, isExpanded, dndState.isDragging])

  const handleRename = async () => {
    const trimmed = name.trim()
    if (trimmed && trimmed !== node.name) {
      await renameFolder(node.id, trimmed)
    } else {
      setName(node.name)
    }
    setIsRenaming(false)
  }

  const handleDelete = async () => {
    if (confirm(`Delete folder "${node.name}"? Notes inside will be moved to unfiled.`)) {
      await deleteFolder(node.id)
    }
    setShowMenu(false)
  }

  const handleNewNote = async () => {
    setShowMenu(false)
    await createNote(node.id)
  }

  const handleNewSubfolder = async () => {
    setShowMenu(false)
    await createFolder(node.id)
  }

  const handleTagToggle = async (tagId: string, isAssigned: boolean) => {
    if (isAssigned) {
      await removeTagFromFolder(node.id, tagId)
    } else {
      await addTagToFolder(node.id, tagId)
    }
  }

  const totalItems = node.notes.length + node.children.length
  const indent = Math.min(depth, 5)
  const childNoteIds = node.notes.map((n) => n.id)
  const childFolderIds = node.children.map((f) => f.id)

  return (
    <div ref={setSortableRef} style={style}>
      <div
        ref={setDroppableRef}
        className={`flex items-center gap-1 py-2 text-sm border-b border-border hover:bg-surface transition-colors duration-100 group ${
          isOver && dndState.isDragging ? "ring-1 ring-accent/50 bg-accent/5" : ""
        }`}
        style={{ paddingLeft: `${indent * 16 + 8}px`, paddingRight: "12px" }}
      >
        <div
          className="text-muted hover:text-foreground transition-colors duration-100 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 [@media(pointer:coarse)]:opacity-100 shrink-0"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={12} />
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-muted hover:text-foreground transition-colors duration-100 shrink-0 flex items-center justify-center"
        >
          <ChevronRight
            size={14}
            className={`transition-transform duration-150 ${isExpanded ? "rotate-90" : ""}`}
          />
        </button>

        <span className="text-muted shrink-0">
          {isExpanded ? <FolderOpen size={14} /> : <FolderIcon size={14} />}
        </span>

        {isRenaming ? (
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename()
              if (e.key === "Escape") { setName(node.name); setIsRenaming(false) }
            }}
            className="flex-1 bg-surface text-foreground text-sm px-1 py-0 border border-accent focus:outline-none min-w-0"
          />
        ) : (
          <span
            className="flex-1 truncate text-secondary font-medium cursor-pointer text-[13px]"
            onDoubleClick={() => setIsRenaming(true)}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {node.name}
          </span>
        )}

        {assignedTags.length > 0 && (
          <div className="flex gap-0.5 shrink-0">
            {assignedTags.map((tag) => (
              <span
                key={tag.id}
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: tag.color }}
                title={tag.name}
              />
            ))}
          </div>
        )}

        <span className="text-xs text-muted">{totalItems}</span>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-muted hover:text-foreground transition-colors duration-100 text-sm p-2 opacity-0 group-hover:opacity-100 [@media(pointer:coarse)]:opacity-100"
          >
            ...
          </button>
          <AnimatePresence>
            {showMenu && (
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 top-full z-50 bg-background border border-border shadow-md py-1 min-w-[140px]"
              >
                <button
                  onClick={handleNewNote}
                  className="w-full text-left px-3 py-2.5 text-sm text-foreground hover:bg-surface transition-colors duration-100"
                >
                  New note
                </button>
                <button
                  onClick={handleNewSubfolder}
                  className="w-full text-left px-3 py-2.5 text-sm text-foreground hover:bg-surface transition-colors duration-100"
                >
                  New subfolder
                </button>
                <button
                  onClick={() => { setShowMenu(false); setShowTagPicker(true) }}
                  className="w-full text-left px-3 py-2.5 text-sm text-foreground hover:bg-surface transition-colors duration-100"
                >
                  Tags
                </button>
                <button
                  onClick={() => { setIsRenaming(true); setShowMenu(false) }}
                  className="w-full text-left px-3 py-2.5 text-sm text-foreground hover:bg-surface transition-colors duration-100"
                >
                  Rename
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-3 py-2.5 text-sm text-red-500 hover:bg-surface transition-colors duration-100"
                >
                  Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          {showTagPicker && (
            <div className="absolute right-0 top-full mt-1 z-50">
              <TagPicker
                allTags={tags}
                assignedTagIds={folderTagIds}
                onToggle={handleTagToggle}
                onClose={() => setShowTagPicker(false)}
              />
            </div>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (node.children.length > 0 || node.notes.length > 0) && (
          <motion.div
            key="folder-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <SortableContext items={[...childFolderIds, ...childNoteIds]} strategy={verticalListSortingStrategy}>
              {node.children.map((child) => (
                <FolderTreeItem
                  key={child.id}
                  node={child}
                  allFolders={allFolders}
                  activeNoteId={activeNoteId}
                  onNoteClick={onNoteClick}
                  tags={tags}
                  noteTags={noteTags}
                  folderTags={folderTags}
                  depth={depth + 1}
                />
              ))}
              {node.notes.map((note) => (
                <NoteListItem
                  key={note.id}
                  note={note}
                  isActive={note.id === activeNoteId}
                  onClick={onNoteClick}
                  folders={allFolders}
                  tags={noteTags.filter((nt) => nt.note_id === note.id).map((nt) => tags.find((t) => t.id === nt.tag_id)).filter(Boolean) as Tag[]}
                  depth={depth + 1}
                />
              ))}
            </SortableContext>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
