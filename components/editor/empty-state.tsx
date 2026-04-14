"use client"

import { useSidebarContext } from "@/components/layout/app-shell"

export function EmptyState() {
  const { isCollapsed, toggleCollapse } = useSidebarContext()

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 border-b border-border bg-background safe-right">
        {isCollapsed && (
          <button
            onClick={toggleCollapse}
            className="hidden lg:block text-secondary hover:text-foreground transition-colors duration-100 text-sm"
            title="Expand sidebar"
          >
            »
          </button>
        )}
        <div className="flex-1" />
        <a
          href="/settings"
          className="text-xs text-secondary hover:text-accent transition-colors duration-100 p-1.5"
          title="Settings"
        >
          settings
        </a>
        <a
          href="/commands"
          target="_blank"
          className="text-xs text-secondary hover:text-accent transition-colors duration-100 p-1.5"
          title="View commands"
        >
          cmds
        </a>
      </div>
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
