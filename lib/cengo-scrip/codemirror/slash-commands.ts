import { EditorView } from "@codemirror/view"

type SlashCommand = {
  pattern: string
  handle: (view: EditorView, matchStart: number, matchEnd: number) => void
}

const commands: SlashCommand[] = [
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
]

export const slashCommands = EditorView.inputHandler.of((view, from, _to, text) => {
  if (text !== " ") return false

  const line = view.state.doc.lineAt(from)
  const lineText = line.text.slice(0, from - line.from)

  for (const cmd of commands) {
    if (lineText.endsWith(cmd.pattern)) {
      const matchStart = from - cmd.pattern.length
      cmd.handle(view, matchStart, from)
      return true
    }
  }

  return false
})
