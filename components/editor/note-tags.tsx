"use client"

import { useState } from "react"
import { Tag } from "@/lib/types"
import { addTagToNote, removeTagFromNote } from "@/actions/tags"
import { TagPicker } from "@/components/shared/tag-picker"

interface NoteTagsProps {
  noteId: string
  assignedTagIds: string[]
  allTags: Tag[]
}

export function NoteTags({ noteId, assignedTagIds, allTags }: NoteTagsProps) {
  const [showPicker, setShowPicker] = useState(false)
  const assignedTags = allTags.filter((t) => assignedTagIds.includes(t.id))

  if (allTags.length === 0) return null

  const handleRemove = async (tagId: string) => {
    await removeTagFromNote(noteId, tagId)
  }

  const handleToggle = async (tagId: string, isAssigned: boolean) => {
    if (isAssigned) {
      await removeTagFromNote(noteId, tagId)
    } else {
      await addTagToNote(noteId, tagId)
    }
  }

  return (
    <div className="flex items-center gap-1.5 px-4 py-1.5 border-b border-border overflow-x-auto scrollbar-none">
      {assignedTags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-sm shrink-0"
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
      <div className="relative shrink-0">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="text-xs text-muted hover:text-foreground transition-colors duration-100 px-1"
        >
          +
        </button>
        {showPicker && (
          <div className="absolute left-0 top-full mt-1">
            <TagPicker
              allTags={allTags}
              assignedTagIds={assignedTagIds}
              onToggle={handleToggle}
              onClose={() => setShowPicker(false)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
