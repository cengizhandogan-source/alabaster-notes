import { EditorView } from "@codemirror/view"
import { uploadAndGetMarkdown } from "@/lib/upload"

function getFilesFromEvent(event: DragEvent | ClipboardEvent): File[] {
  if (event instanceof DragEvent) {
    return Array.from(event.dataTransfer?.files ?? [])
  }
  return Array.from(event.clipboardData?.files ?? [])
}

function insertAndReplace(
  view: EditorView,
  pos: number,
  file: File
) {
  const placeholderId = crypto.randomUUID().slice(0, 8)
  const placeholder = `![Uploading ${placeholderId}...]()`

  view.dispatch({
    changes: { from: pos, insert: placeholder },
  })

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

export const fileDropExtension = EditorView.domEventHandlers({
  drop(event, view) {
    const files = getFilesFromEvent(event)
    if (files.length === 0) return false

    event.preventDefault()
    const pos = view.posAtCoords({ x: event.clientX, y: event.clientY }) ?? view.state.selection.main.head

    for (const file of files) {
      insertAndReplace(view, pos, file)
    }
    return true
  },

  paste(event, view) {
    const files = getFilesFromEvent(event)
    if (files.length === 0) return false

    event.preventDefault()
    const pos = view.state.selection.main.head

    for (const file of files) {
      insertAndReplace(view, pos, file)
    }
    return true
  },
})
