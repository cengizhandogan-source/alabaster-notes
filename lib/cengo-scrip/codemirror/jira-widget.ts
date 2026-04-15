import { EditorView, Decoration, WidgetType, DecorationSet, keymap } from "@codemirror/view"
import { EditorState, EditorSelection, StateField, Range, Extension } from "@codemirror/state"

const JIRA_RE = /^::jira\[([A-Z][A-Z0-9]+-\d+)\]\s*$/gm

type JiraInfo = {
  from: number
  to: number
  issueKey: string
}

type JiraIssueData = {
  key: string
  summary: string
  status: { name: string; categoryColor: string }
  assignee: { displayName: string; avatarUrl: string } | null
  priority: { name: string; iconUrl: string } | null
  issueType: { name: string; iconUrl: string } | null
  url: string
}

function parseJiraDirectives(text: string): JiraInfo[] {
  const results: JiraInfo[] = []
  let match: RegExpExecArray | null
  JIRA_RE.lastIndex = 0

  while ((match = JIRA_RE.exec(text)) !== null) {
    results.push({
      from: match.index,
      to: match.index + match[0].length,
      issueKey: match[1],
    })
  }

  return results
}

const STATUS_COLORS: Record<string, string> = {
  "blue-gray": "var(--muted)",
  blue: "#4393FF",
  yellow: "#F5A623",
  green: "#36B37E",
  "medium-gray": "var(--muted)",
}

class JiraWidget extends WidgetType {
  constructor(readonly info: JiraInfo) {
    super()
  }

  eq(other: JiraWidget) {
    return this.info.issueKey === other.info.issueKey
  }

  toDOM() {
    const wrapper = document.createElement("div")
    wrapper.className = "cm-jira-widget"

    const header = document.createElement("div")
    header.className = "cm-jira-header"
    header.textContent = `jira: ${this.info.issueKey}`
    wrapper.appendChild(header)

    const loading = document.createElement("div")
    loading.className = "cm-jira-loading"
    loading.textContent = "loading..."
    wrapper.appendChild(loading)

    fetch(`/api/jira/issues/${this.info.issueKey}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? "issue not found" : "failed to load")
        return res.json()
      })
      .then((issue: JiraIssueData) => {
        loading.remove()

        // Update header with link
        header.textContent = ""
        const link = document.createElement("a")
        link.href = issue.url
        link.target = "_blank"
        link.rel = "noopener noreferrer"
        link.className = "cm-jira-key-link"
        link.textContent = issue.key
        header.appendChild(link)

        // Summary
        const summary = document.createElement("div")
        summary.className = "cm-jira-summary"
        summary.textContent = issue.summary
        wrapper.appendChild(summary)

        // Meta row: status, type, priority, assignee
        const meta = document.createElement("div")
        meta.className = "cm-jira-meta"

        // Status badge
        const status = document.createElement("span")
        status.className = "cm-jira-status"
        status.textContent = issue.status.name
        const color = STATUS_COLORS[issue.status.categoryColor] || "var(--muted)"
        status.style.borderColor = color
        status.style.color = color
        meta.appendChild(status)

        // Issue type
        if (issue.issueType) {
          const type = document.createElement("span")
          type.className = "cm-jira-type"
          type.textContent = issue.issueType.name
          meta.appendChild(type)
        }

        // Priority
        if (issue.priority) {
          const priority = document.createElement("span")
          priority.className = "cm-jira-priority"
          priority.textContent = issue.priority.name
          meta.appendChild(priority)
        }

        // Assignee
        if (issue.assignee) {
          const assignee = document.createElement("span")
          assignee.className = "cm-jira-assignee"
          assignee.textContent = issue.assignee.displayName
          meta.appendChild(assignee)
        } else {
          const unassigned = document.createElement("span")
          unassigned.className = "cm-jira-assignee"
          unassigned.textContent = "unassigned"
          unassigned.style.fontStyle = "italic"
          meta.appendChild(unassigned)
        }

        wrapper.appendChild(meta)
      })
      .catch((err) => {
        loading.textContent = err.message || "failed to load issue"
        loading.className = "cm-jira-error"
        wrapper.classList.add("cm-jira-errored")
      })

    return wrapper
  }

  ignoreEvent() {
    return true
  }
}

function buildDecorations(state: EditorState): DecorationSet {
  const text = state.doc.toString()
  const directives = parseJiraDirectives(text)
  const decos: Range<Decoration>[] = []

  for (const d of directives) {
    decos.push(
      Decoration.replace({
        widget: new JiraWidget(d),
        block: true,
      }).range(d.from, d.to)
    )
  }

  return Decoration.set(decos)
}

const jiraKeymap = keymap.of([
  {
    key: "Space",
    run(view) {
      const { state } = view
      const pos = state.selection.main.head
      const line = state.doc.lineAt(pos)
      const lineText = line.text
      JIRA_RE.lastIndex = 0
      if (!JIRA_RE.test(lineText)) return false
      if (line.to < state.doc.length) return false
      view.dispatch({
        changes: { from: line.to, insert: "\n " },
        selection: EditorSelection.cursor(line.to + 2),
      })
      return true
    },
  },
])

export const jiraField: Extension = [
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
  jiraKeymap,
]
