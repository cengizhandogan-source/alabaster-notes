import { EditorView, Decoration, WidgetType, DecorationSet, keymap } from "@codemirror/view"
import { EditorState, EditorSelection, StateField, Range, Extension } from "@codemirror/state"

const TODOIST_TODAY_RE = /^::todoist-today\[\]\s*$/gm

type TodoistTodayInfo = {
  from: number
  to: number
}

type TodoistTaskData = {
  id: string
  content: string
  priority: number
  due: { date: string; string: string; is_recurring: boolean } | null
  labels: string[]
  is_completed: boolean
  url: string
}

function parseTodoistTodayDirectives(text: string): TodoistTodayInfo[] {
  const results: TodoistTodayInfo[] = []
  let match: RegExpExecArray | null
  TODOIST_TODAY_RE.lastIndex = 0

  while ((match = TODOIST_TODAY_RE.exec(text)) !== null) {
    results.push({
      from: match.index,
      to: match.index + match[0].length,
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

class TodoistTodayWidget extends WidgetType {
  eq() {
    return true
  }

  toDOM() {
    const wrapper = document.createElement("div")
    wrapper.className = "cm-todoist-today-widget"

    const headerRow = document.createElement("div")
    headerRow.className = "cm-todoist-today-header"

    const headerText = document.createElement("span")
    headerText.textContent = "todoist: today"
    headerRow.appendChild(headerText)

    const refreshBtn = document.createElement("button")
    refreshBtn.className = "cm-todoist-today-refresh"
    refreshBtn.textContent = "[refresh]"
    refreshBtn.addEventListener("click", () => {
      loadTasks()
    })
    headerRow.appendChild(refreshBtn)

    wrapper.appendChild(headerRow)

    const body = document.createElement("div")
    body.className = "cm-todoist-today-body"
    wrapper.appendChild(body)

    const loadTasks = () => {
      body.innerHTML = ""
      const loading = document.createElement("div")
      loading.className = "cm-todoist-loading"
      loading.textContent = "loading..."
      body.appendChild(loading)

      fetch("/api/todoist/tasks/today")
        .then((res) => {
          if (!res.ok) throw new Error("failed to load")
          return res.json()
        })
        .then((tasks: TodoistTaskData[]) => {
          body.innerHTML = ""

          if (tasks.length === 0) {
            const empty = document.createElement("div")
            empty.className = "cm-todoist-today-empty"
            empty.textContent = "no tasks due today"
            body.appendChild(empty)
            return
          }

          for (const task of tasks) {
            const row = document.createElement("div")
            row.className = "cm-todoist-today-row"

            const checkbox = document.createElement("input")
            checkbox.type = "checkbox"
            checkbox.className = "cm-todoist-checkbox"
            checkbox.checked = task.is_completed
            checkbox.addEventListener("change", () => {
              contentText.classList.add("cm-todoist-completed")
              checkbox.disabled = true
              row.style.opacity = "0.5"

              fetch(`/api/todoist/tasks/${task.id}/close`, { method: "POST" })
                .then((res) => {
                  if (!res.ok) throw new Error("failed")
                })
                .catch(() => {
                  contentText.classList.remove("cm-todoist-completed")
                  checkbox.checked = false
                  checkbox.disabled = false
                  row.style.opacity = "1"
                })
            })
            row.appendChild(checkbox)

            const contentText = document.createElement("span")
            contentText.className = "cm-todoist-today-content"
            contentText.textContent = task.content
            if (task.is_completed) contentText.classList.add("cm-todoist-completed")
            row.appendChild(contentText)

            // Priority dot
            if (task.priority > 1) {
              const dot = document.createElement("span")
              dot.className = "cm-todoist-today-priority"
              dot.style.color = PRIORITY_COLORS[task.priority] || "var(--muted)"
              dot.textContent = "\u25CF"
              row.appendChild(dot)
            }

            // Due time if present
            if (task.due?.string && task.due.string !== task.due.date) {
              const time = document.createElement("span")
              time.className = "cm-todoist-today-time"
              time.textContent = task.due.string
              row.appendChild(time)
            }

            body.appendChild(row)
          }
        })
        .catch((err) => {
          body.innerHTML = ""
          const error = document.createElement("div")
          error.className = "cm-todoist-error"
          error.textContent = err.message || "failed to load tasks"
          body.appendChild(error)
          wrapper.classList.add("cm-todoist-errored")
        })
    }

    loadTasks()

    return wrapper
  }

  ignoreEvent() {
    return true
  }
}

function buildDecorations(state: EditorState): DecorationSet {
  const text = state.doc.toString()
  const directives = parseTodoistTodayDirectives(text)
  const decos: Range<Decoration>[] = []

  for (const d of directives) {
    decos.push(
      Decoration.replace({
        widget: new TodoistTodayWidget(),
        block: true,
      }).range(d.from, d.to)
    )
  }

  return Decoration.set(decos)
}

const todoistTodayKeymap = keymap.of([
  {
    key: "Space",
    run(view) {
      const { state } = view
      const pos = state.selection.main.head
      const line = state.doc.lineAt(pos)
      const lineText = line.text
      TODOIST_TODAY_RE.lastIndex = 0
      if (!TODOIST_TODAY_RE.test(lineText)) return false
      if (line.to < state.doc.length) return false
      view.dispatch({
        changes: { from: line.to, insert: "\n " },
        selection: EditorSelection.cursor(line.to + 2),
      })
      return true
    },
  },
])

export const todoistTodayField: Extension = [
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
  todoistTodayKeymap,
]
