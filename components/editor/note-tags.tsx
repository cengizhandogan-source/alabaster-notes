"use client"

import { Tag } from "@/lib/types"
import { removeTagFromNote } from "@/actions/tags"

interface NoteTagsProps {
  noteId: string
  assignedTagIds: string[]
  allTags: Tag[]
}

export function NoteTags({ noteId, assignedTagIds, allTags }: NoteTagsProps) {
  const assignedTags = allTags.filter((t) => assignedTagIds.includes(t.id))

  const handleRemove = async (tagId: string) => {
    await removeTagFromNote(noteId, tagId)
  }

  if (assignedTags.length === 0) return null

  return (
    <div className="flex items-center gap-1.5 px-4 py-1.5 border-b border-border flex-wrap overflow-hidden">
      {assignedTags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-sm"
          style={{ backgroundColor: tag.color + "20", color: tag.color }}
        >
          {tag.name}
          <button
            onClick={() => handleRemove(tag.id)}
            className="hover:opacity-70 text-[10px] leading-none"
          >
            x
          </button>
        </span>
      ))}
    </div>
  )
}
