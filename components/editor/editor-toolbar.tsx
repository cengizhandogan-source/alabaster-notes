"use client"

interface EditorToolbarProps {
  title: string
  onTitleChange: (title: string) => void
  status: "idle" | "saving" | "saved" | "error"
  onDelete: () => void
  onTogglePreview: () => void
  showPreview: boolean
  onToggleSidebar?: () => void
  isSidebarCollapsed?: boolean
  onExpandSidebar?: () => void
}

export function EditorToolbar({
  title,
  onTitleChange,
  status,
  onDelete,
  onTogglePreview,
  showPreview,
  onToggleSidebar,
  isSidebarCollapsed,
  onExpandSidebar,
}: EditorToolbarProps) {
  const statusText = {
    idle: "",
    saving: "saving...",
    saved: "saved",
    error: "error saving",
  }

  const statusColor = {
    idle: "text-muted",
    saving: "text-secondary",
    saved: "text-success",
    error: "text-error",
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-background">
      {/* Mobile hamburger */}
      {onToggleSidebar && (
        <button
          onClick={onToggleSidebar}
          className="lg:hidden text-secondary hover:text-foreground transition-colors duration-100"
        >
          |||
        </button>
      )}

      {/* Desktop expand sidebar */}
      {isSidebarCollapsed && onExpandSidebar && (
        <button
          onClick={onExpandSidebar}
          className="hidden lg:block text-secondary hover:text-foreground transition-colors duration-100 text-sm"
          title="Expand sidebar"
        >
          »
        </button>
      )}

      {/* Title input */}
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Untitled"
        className="flex-1 bg-transparent text-foreground text-lg font-medium focus:outline-none placeholder:text-muted"
      />

      {/* Status */}
      <span className={`text-xs ${statusColor[status]} whitespace-nowrap`}>
        {statusText[status]}
      </span>

      {/* Preview toggle */}
      <button
        onClick={onTogglePreview}
        className={`text-xs px-2 py-1 border border-border transition-colors duration-100 ${
          showPreview
            ? "bg-surface text-accent"
            : "text-secondary hover:text-foreground"
        }`}
      >
        {showPreview ? "> edit" : "> preview"}
      </button>

      {/* Delete */}
      <button
        onClick={onDelete}
        className="text-xs text-secondary hover:text-error transition-colors duration-100"
      >
        delete
      </button>
    </div>
  )
}
