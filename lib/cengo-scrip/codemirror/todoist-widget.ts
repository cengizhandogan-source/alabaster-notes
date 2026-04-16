import { EditorView, Decoration, WidgetType, DecorationSet, keymap } from "@codemirror/view"
import { EditorState, EditorSelection, StateField, Range, Extension } from "@codemirror/state"

const TODOIST_RE = /^::todoist\[(\d+)\]\s*$/gm

type TodoistInfo = {
  from: number
  to: number
  taskId: string
}

type TodoistTaskData = {
  id: string
  content: string
  description: string
  priority: number
  due: { date: string; string: string; is_recurring: boolean } | null
  labels: string[]
  is_completed: boolean
  url: string
}

function parseTodoistDirectives(text: string): TodoistInfo[] {
  const results: TodoistInfo[] = []
  let match: RegExpExecArray | null
  TODOIST_RE.lastIndex = 0

  while ((match = TODOIST_RE.exec(text)) !== null) {
    results.push({
      from: match.index,
      to: match.index + match[0].length,
      taskId: match[1],
    })
  }

  return results
}

const PRIORITY_COLORS: Record<number, string> = {
  4: "#D1453B",
  3: "#EB8909",
  2: "#246FE0",
  1: "var(--muted)",
}

const PRIORITY_LABELS: Record<number, string> = {
  4: "p1",
  3: "p2",
  2: "p3",
  1: "p4",
}

class TodoistWidget extends WidgetType {
  constructor(readonly info: TodoistInfo) {
    super()
  }

  eq(other: TodoistWidget) {
    return this.info.taskId === other.info.taskId
  }

  toDOM() {
    const wrapper = document.createElement("div")
    wrapper.className = "cm-todoist-widget"

    const header = document.createElement("div")
    header.className = "cm-todoist-header"
    header.textContent = `todoist: ${this.info.taskId}`
    wrapper.appendChild(header)

    const loading = document.createElement("div")
    loading.className = "cm-todoist-loading"
    loading.textContent = "loading..."
    wrapper.appendChild(loading)

    fetch(`/api/todoist/tasks/${this.info.taskId}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? "task not found" : "failed to load")
        return res.json()
      })
      .then((task: TodoistTaskData) => {
        loading.remove()

        // Update header with link
        header.textContent = ""
        const link = document.createElement("a")
        link.href = task.url
        link.target = "_blank"
        link.rel = "noopener noreferrer"
        link.className = "cm-todoist-key-link"
        link.textContent = `todoist: ${task.id}`
        header.appendChild(link)

        // Content row with checkbox
        const contentRow = document.createElement("div")
        contentRow.className = "cm-todoist-content"

        const checkbox = document.createElement("input")
        checkbox.type = "checkbox"
        checkbox.className = "cm-todoist-checkbox"
        checkbox.checked = task.is_completed
        checkbox.addEventListener("change", () => {
          // Optimistic update
          contentText.classList.add("cm-todoist-completed")
          checkbox.disabled = true

          fetch(`/api/todoist/tasks/${task.id}/close`, { method: "POST" })
            .then((res) => {
              if (!res.ok) throw new Error("failed")
            })
            .catch(() => {
              // Revert on failure
              contentText.classList.remove("cm-todoist-completed")
              checkbox.checked = false
              checkbox.disabled = false
            })
        })
        contentRow.appendChild(checkbox)

        const contentText = document.createElement("span")
        contentText.textContent = task.content
        if (task.is_completed) contentText.classList.add("cm-todoist-completed")
        contentRow.appendChild(contentText)

        wrapper.appendChild(contentRow)

        // Meta row: priority, due date, labels
        const meta = document.createElement("div")
        meta.className = "cm-todoist-meta"

        // Priority badge
        if (task.priority > 1) {
          const priority = document.createElement("span")
          priority.className = "cm-todoist-priority"
          priority.textContent = PRIORITY_LABELS[task.priority] || `p${5 - task.priority}`
          priority.style.borderColor = PRIORITY_COLORS[task.priority] || "var(--muted)"
          priority.style.color = PRIORITY_COLORS[task.priority] || "var(--muted)"
          meta.appendChild(priority)
        }

        // Due date
        if (task.due) {
          const due = document.createElement("span")
          due.className = "cm-todoist-due"
          due.textContent = task.due.string || task.due.date
          meta.appendChild(due)
        }

        // Labels
        for (const label of task.labels) {
          const tag = document.createElement("span")
          tag.className = "cm-todoist-label"
          tag.textContent = label
          meta.appendChild(tag)
        }

        wrapper.appendChild(meta)
      })
      .catch((err) => {
        loading.textContent = err.message || "failed to load task"
        loading.className = "cm-todoist-error"
        wrapper.classList.add("cm-todoist-errored")
      })

    return wrapper
  }

  ignoreEvent() {
    return true
  }
}

function buildDecorations(state: EditorState): DecorationSet {
  const text = state.doc.toString()
  const directives = parseTodoistDirectives(text)
  const decos: Range<Decoration>[] = []

  for (const d of directives) {
    decos.push(
      Decoration.replace({
        widget: new TodoistWidget(d),
        block: true,
      }).range(d.from, d.to)
    )
  }

  return Decoration.set(decos)
}

const todoistKeymap = keymap.of([
  {
    key: "Space",
    run(view) {
      const { state } = view
      const pos = state.selection.main.head
      const line = state.doc.lineAt(pos)
      const lineText = line.text
      TODOIST_RE.lastIndex = 0
      if (!TODOIST_RE.test(lineText)) return false
      if (line.to < state.doc.length) return false
      view.dispatch({
        changes: { from: line.to, insert: "\n " },
        selection: EditorSelection.cursor(line.to + 2),
      })
      return true
    },
  },
])

export const todoistField: Extension = [
  StateField.define<DecorationSet>({
    create(state) {
      return buildDecorations(state)
    },
    update(deco, tr) {
      if (tr.docChanged) {
        return buildDecorations(tr.state)
      }
      return deco
    },
    provide(field) {
      return EditorView.decorations.from(field)
    },
  }),
  todoistKeymap,
]
