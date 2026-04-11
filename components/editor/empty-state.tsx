"use client"

import { useSidebarContext } from "@/components/layout/app-shell"

export function EmptyState() {
  const { isCollapsed, toggleCollapse } = useSidebarContext()

  return (
    <div className="flex-1 flex flex-col bg-background">
      {isCollapsed && (
        <div className="hidden lg:block p-2 border-b border-border">
          <button
            onClick={toggleCollapse}
            className="text-secondary hover:text-foreground transition-colors duration-100 text-sm"
            title="Expand sidebar"
          >
            »
          </button>
        </div>
      )}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted text-sm">
            {">"} select a note or create a new one
            <span className="inline-block w-2 h-4 bg-muted ml-1 animate-blink" />
          </p>
        </div>
      </div>
    </div>
  )
}
