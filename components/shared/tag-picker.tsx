"use client"

import { useRef, useEffect } from "react"
import { Tag } from "@/lib/types"

interface TagPickerProps {
  allTags: Tag[]
  assignedTagIds: string[]
  onToggle: (tagId: string, isAssigned: boolean) => void
  onClose: () => void
}

export function TagPicker({ allTags, assignedTagIds, onToggle, onClose }: TagPickerProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [onClose])

  if (allTags.length === 0) return null

  return (
    <div ref={ref} className="absolute z-50 bg-background border border-border shadow-md py-1 min-w-[160px] max-h-[200px] overflow-y-auto">
      {allTags.map((tag) => {
        const isAssigned = assignedTagIds.includes(tag.id)
        return (
          <button
            key={tag.id}
            onClick={() => onToggle(tag.id, isAssigned)}
            className="w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-surface transition-colors duration-100 flex items-center gap-2"
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: tag.color }}
            />
            <span className="truncate flex-1">{tag.name}</span>
            {isAssigned && <span className="text-xs text-muted">✓</span>}
          </button>
        )
      })}
    </div>
  )
}
