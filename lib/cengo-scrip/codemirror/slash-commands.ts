import { EditorView, WidgetType, Decoration, DecorationSet } from "@codemirror/view"
import { StateField, StateEffect, Range } from "@codemirror/state"
import { uploadAndGetMarkdown } from "@/lib/upload"

type SlashCommand = {
  pattern: string
  multiWord?: boolean
  handle: (view: EditorView, matchStart: number, matchEnd: number) => void
}

const BRANCH_RE = /^\/branch\s+([\w\-.]+)\/([\w\-.]+)\s+([\w\-.\/]+)\s+([\w\-.\/]+)$/

// Unique placeholder text used to anchor the confirmation widget
const BRANCH_CONFIRM_PREFIX = "::branch-confirm::"

const showBranchConfirm = StateEffect.define<{
  from: number
  to: number
  owner: string
  repo: string
  baseBranch: string
  newBranchName: string
  originalText: string
}>()

const clearBranchConfirm = StateEffect.define<void>()

class BranchConfirmWidget extends WidgetType {
  constructor(
    readonly owner: string,
    readonly repo: string,
    readonly baseBranch: string,
    readonly newBranchName: string,
    readonly originalText: string,
    readonly from: number,
    readonly to: number,
  ) {
    super()
  }

  eq(other: BranchConfirmWidget) {
    return this.owner === other.owner && this.repo === other.repo && this.newBranchName === other.newBranchName
  }

  toDOM(view: EditorView) {
    const wrapper = document.createElement("div")
    wrapper.className = "cm-branch-confirm"

    const label = document.createElement("span")
    label.className = "cm-branch-confirm-label"
    label.textContent = `create branch "${this.newBranchName}" from "${this.baseBranch}" on ${this.owner}/${this.repo}?`
    wrapper.appendChild(label)

    const yesBtn = document.createElement("button")
    yesBtn.className = "cm-branch-confirm-yes"
    yesBtn.textContent = "[yes]"
    yesBtn.addEventListener("click", (e) => {
      e.preventDefault()
      // Find the placeholder text position
      const doc = view.state.doc.toString()
      const placeholder = `${BRANCH_CONFIRM_PREFIX}${this.owner}/${this.repo}/${this.newBranchName}`
      const idx = doc.indexOf(placeholder)
      if (idx === -1) return

      const placeholderEnd = idx + placeholder.length
      const creatingText = `creating branch ${this.newBranchName}...`

      view.dispatch({
        changes: { from: idx, to: placeholderEnd, insert: creatingText },
        effects: clearBranchConfirm.of(),
      })

      fetch(`/api/github/repos/${this.owner}/${this.repo}/branches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseBranch: this.baseBranch, newBranchName: this.newBranchName }),
      })
        .then((res) => res.json())
        .then((data) => {
          const d = view.state.doc.toString()
          const i = d.indexOf(creatingText)
          if (i === -1) return
          const result = data.error ? `branch failed: ${data.error}` : `branch created: ${data.url}`
          view.dispatch({ changes: { from: i, to: i + creatingText.length, insert: result } })
        })
        .catch(() => {
          const d = view.state.doc.toString()
          const i = d.indexOf(creatingText)
          if (i === -1) return
          view.dispatch({ changes: { from: i, to: i + creatingText.length, insert: "branch creation failed" } })
        })
    })
    wrapper.appendChild(yesBtn)

    const backBtn = document.createElement("button")
    backBtn.className = "cm-branch-confirm-back"
    backBtn.textContent = "[back]"
    backBtn.addEventListener("click", (e) => {
      e.preventDefault()
      const doc = view.state.doc.toString()
      const placeholder = `${BRANCH_CONFIRM_PREFIX}${this.owner}/${this.repo}/${this.newBranchName}`
      const idx = doc.indexOf(placeholder)
      if (idx === -1) return

      view.dispatch({
        changes: { from: idx, to: idx + placeholder.length, insert: this.originalText },
        effects: clearBranchConfirm.of(),
        selection: { anchor: idx + this.originalText.length },
      })
      view.focus()
    })
    wrapper.appendChild(backBtn)

    return wrapper
  }

  ignoreEvent() {
    return true
  }
}

export const branchConfirmField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none
  },
  update(deco, tr) {
    for (const e of tr.effects) {
      if (e.is(clearBranchConfirm)) {
        return Decoration.none
      }
      if (e.is(showBranchConfirm)) {
        const { from, to, owner, repo, baseBranch, newBranchName, originalText } = e.value
        const widget = new BranchConfirmWidget(owner, repo, baseBranch, newBranchName, originalText, from, to)
        const decos: Range<Decoration>[] = [
          Decoration.replace({ widget, block: true }).range(from, to),
        ]
        return Decoration.set(decos)
      }
    }
    if (tr.docChanged) {
      return deco.map(tr.changes)
    }
    return deco
  },
  provide(field) {
    return EditorView.decorations.from(field)
  },
})

const commands: SlashCommand[] = [
  {
    pattern: "/branch",
    multiWord: true,
    handle(view, matchStart, matchEnd) {
      const text = view.state.doc.sliceString(matchStart, matchEnd)
      const m = text.match(BRANCH_RE)
      if (!m) {
        view.dispatch({
          changes: { from: matchStart, to: matchEnd, insert: "usage: /branch owner/repo base-branch new-branch-name" },
        })
        return
      }

      const [, owner, repo, baseBranch, newBranchName] = m
      const placeholder = `${BRANCH_CONFIRM_PREFIX}${owner}/${repo}/${newBranchName}`

      view.dispatch({
        changes: { from: matchStart, to: matchEnd, insert: placeholder },
        effects: showBranchConfirm.of({
          from: matchStart,
          to: matchStart + placeholder.length,
          owner,
          repo,
          baseBranch,
          newBranchName,
          originalText: text,
        }),
      })
    },
  },
  {
    pattern: "/commits",
    handle(view, matchStart, matchEnd) {
      view.dispatch({
        changes: { from: matchStart, to: matchEnd, insert: "::commits[owner/repo@branch]" },
        selection: { anchor: matchStart + "::commits[".length, head: matchStart + "::commits[owner/repo@branch".length },
      })
    },
  },
  {
    pattern: "/jira",
    handle(view, matchStart, matchEnd) {
      view.dispatch({
        changes: { from: matchStart, to: matchEnd, insert: "::jira[PROJ-123]" },
        selection: { anchor: matchStart + "::jira[".length, head: matchStart + "::jira[PROJ-123".length },
      })
    },
  },
  {
    pattern: "/todoist-today",
    handle(view, matchStart, matchEnd) {
      view.dispatch({
        changes: { from: matchStart, to: matchEnd, insert: "::todoist-today[]" },
      })
    },
  },
  {
    pattern: "/todoist",
    handle(view, matchStart, matchEnd) {
      view.dispatch({
        changes: { from: matchStart, to: matchEnd, insert: "::todoist[task-id]" },
        selection: { anchor: matchStart + "::todoist[".length, head: matchStart + "::todoist[task-id".length },
      })
    },
  },
  {
    pattern: "/date",
    handle(view, matchStart, matchEnd) {
      const today = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
      view.dispatch({ changes: { from: matchStart, to: matchEnd, insert: today } })
    },
  },
  {
    pattern: "/h1",
    handle(view, matchStart, matchEnd) {
      view.dispatch({ changes: { from: matchStart, to: matchEnd, insert: "# " } })
    },
  },
  {
    pattern: "/h2",
    handle(view, matchStart, matchEnd) {
      view.dispatch({ changes: { from: matchStart, to: matchEnd, insert: "## " } })
    },
  },
  {
    pattern: "/h3",
    handle(view, matchStart, matchEnd) {
      view.dispatch({ changes: { from: matchStart, to: matchEnd, insert: "### " } })
    },
  },
  {
    pattern: "/hr",
    handle(view, matchStart, matchEnd) {
      view.dispatch({ changes: { from: matchStart, to: matchEnd, insert: "---" } })
    },
  },
  {
    pattern: "/bold",
    handle(view, matchStart, matchEnd) {
      view.dispatch({
        changes: { from: matchStart, to: matchEnd, insert: "****" },
        selection: { anchor: matchStart + 2 },
      })
    },
  },
  {
    pattern: "/italic",
    handle(view, matchStart, matchEnd) {
      view.dispatch({
        changes: { from: matchStart, to: matchEnd, insert: "**" },
        selection: { anchor: matchStart + 1 },
      })
    },
  },
  {
    pattern: "/strike",
    handle(view, matchStart, matchEnd) {
      view.dispatch({
        changes: { from: matchStart, to: matchEnd, insert: "~~~~" },
        selection: { anchor: matchStart + 2 },
      })
    },
  },
  {
    pattern: "/code",
    handle(view, matchStart, matchEnd) {
      view.dispatch({
        changes: { from: matchStart, to: matchEnd, insert: "``" },
        selection: { anchor: matchStart + 1 },
      })
    },
  },
  {
    pattern: "/codeblock",
    handle(view, matchStart, matchEnd) {
      view.dispatch({
        changes: { from: matchStart, to: matchEnd, insert: "```\n\n```" },
        selection: { anchor: matchStart + 4 },
      })
    },
  },
  {
    pattern: "/todo",
    handle(view, matchStart, matchEnd) {
      view.dispatch({
        changes: { from: matchStart, to: matchEnd, insert: "- [ ] " },
        selection: { anchor: matchStart + 6 },
      })
    },
  },
  {
    pattern: "/sheet",
    handle(view, matchStart, matchEnd) {
      const template = `::sheet[Sheet1]\n\t\t\n\t\t\n\t\t\n::endsheet`
      view.dispatch({
        changes: { from: matchStart, to: matchEnd, insert: template },
        selection: { anchor: matchStart + "::sheet[".length, head: matchStart + "::sheet[Sheet1".length },
      })
    },
  },
  {
    pattern: "/plot",
    handle(view, matchStart, matchEnd) {
      const template = `::plot[Sheet1|line|A|B]`
      view.dispatch({
        changes: { from: matchStart, to: matchEnd, insert: template },
        selection: { anchor: matchStart + "::plot[".length, head: matchStart + "::plot[Sheet1".length },
      })
    },
  },
  {
    pattern: "/file",
    handle(view, matchStart, matchEnd) {
      view.dispatch({
        changes: { from: matchStart, to: matchEnd, insert: "" },
      })

      const input = document.createElement("input")
      input.type = "file"
      input.accept = "image/*,.pdf,.csv,.doc,.docx,.xls,.xlsx,.txt,.zip"
      input.onchange = () => {
        const file = input.files?.[0]
        if (!file) return

        const pos = view.state.selection.main.head
        const placeholderId = crypto.randomUUID().slice(0, 8)
        const placeholder = `![Uploading ${placeholderId}...]()`

        view.dispatch({ changes: { from: pos, insert: placeholder } })

        uploadAndGetMarkdown(file)
          .then((markdown) => {
            const doc = view.state.doc.toString()
            const idx = doc.indexOf(placeholder)
            if (idx === -1) return
            view.dispatch({
              changes: { from: idx, to: idx + placeholder.length, insert: markdown },
            })
          })
          .catch(() => {
            const doc = view.state.doc.toString()
            const idx = doc.indexOf(placeholder)
            if (idx === -1) return
            view.dispatch({
              changes: { from: idx, to: idx + placeholder.length, insert: `[Upload failed: ${file.name}]` },
            })
          })
      }
      input.click()
    },
  },
]

export const slashCommands = EditorView.inputHandler.of((view, from, _to, text) => {
  if (text !== " ") return false

  const line = view.state.doc.lineAt(from)
  const lineText = line.text.slice(0, from - line.from)

  for (const cmd of commands) {
    if (cmd.multiWord) {
      // Multi-word commands: match full line starting with the pattern
      const fullLineMatch = BRANCH_RE.test(lineText)
      if (fullLineMatch) {
        cmd.handle(view, line.from, from)
        return true
      }
    } else if (lineText.endsWith(cmd.pattern)) {
      const matchStart = from - cmd.pattern.length
      cmd.handle(view, matchStart, from)
      return true
    }
  }

  return false
})
