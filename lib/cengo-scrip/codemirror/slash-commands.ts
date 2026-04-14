import { EditorView } from "@codemirror/view"
import { uploadAndGetMarkdown } from "@/lib/upload"

type SlashCommand = {
  pattern: string
  multiWord?: boolean
  handle: (view: EditorView, matchStart: number, matchEnd: number) => void
}

const BRANCH_RE = /^\/branch\s+([\w\-.]+)\/([\w\-.]+)\s+([\w\-.\/]+)\s+([\w\-.\/]+)$/

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
      view.dispatch({
        changes: { from: matchStart, to: matchEnd, insert: `creating branch ${newBranchName}...` },
      })

      const placeholderText = `creating branch ${newBranchName}...`

      fetch(`/api/github/repos/${owner}/${repo}/branches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseBranch, newBranchName }),
      })
        .then((res) => res.json())
        .then((data) => {
          const doc = view.state.doc.toString()
          const idx = doc.indexOf(placeholderText)
          if (idx === -1) return
          if (data.error) {
            view.dispatch({
              changes: { from: idx, to: idx + placeholderText.length, insert: `branch failed: ${data.error}` },
            })
          } else {
            view.dispatch({
              changes: { from: idx, to: idx + placeholderText.length, insert: `branch created: ${data.url}` },
            })
          }
        })
        .catch(() => {
          const doc = view.state.doc.toString()
          const idx = doc.indexOf(placeholderText)
          if (idx === -1) return
          view.dispatch({
            changes: { from: idx, to: idx + placeholderText.length, insert: `branch creation failed` },
          })
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
