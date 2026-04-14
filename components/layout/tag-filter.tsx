"use client"

import { Tag } from "@/lib/types"

interface TagFilterProps {
  tags: Tag[]
  selectedTagIds: string[]
  onToggleTag: (tagId: string) => void
}

export function TagFilter({ tags, selectedTagIds, onToggleTag }: TagFilterProps) {
  if (tags.length === 0) return null

  return (
    <div className="px-3 py-2 border-b border-border flex gap-1.5 overflow-x-auto scrollbar-none">
      {tags.map((tag) => {
        const isSelected = selectedTagIds.includes(tag.id)
        return (
          <button
            key={tag.id}
            onClick={() => onToggleTag(tag.id)}
            className="shrink-0 text-xs px-2.5 py-1 rounded-sm border transition-colors duration-100"
            style={{
              borderColor: isSelected ? tag.color : undefined,
              backgroundColor: isSelected ? tag.color + "20" : undefined,
              color: isSelected ? tag.color : undefined,
            }}
          >
            {tag.name}
          </button>
        )
      })}
    </div>
  )
}
