import { EditorView, Decoration, WidgetType, DecorationSet } from "@codemirror/view"
import { EditorState, StateField, StateEffect, RangeSetBuilder } from "@codemirror/state"
import { fetchAiResponse } from "../utils/ai-cache"
import { expandTableCommands } from "../utils/table-generator"

const AI_RE = /\/ai\[([^\]]*)\]/g

const aiResponseReceived = StateEffect.define<null>()

class AiWidget extends WidgetType {
  constructor(readonly prompt: string) {
    super()
  }

  eq(other: AiWidget) {
    return this.prompt === other.prompt
  }

  toDOM(view: EditorView) {
    const wrapper = document.createElement("div")
    wrapper.className = "cm-ai-widget"

    const trimmed = this.prompt.trim()

    // Header row: label + run button
    const header = document.createElement("div")
    header.className = "cm-ai-widget-header"

    const label = document.createElement("span")
    label.className = "cm-ai-widget-label"
    label.textContent = `ai: ${this.prompt}`
    header.appendChild(label)

    wrapper.appendChild(header)

    if (!trimmed) {
      const empty = document.createElement("p")
      empty.textContent = "empty prompt"
      empty.className = "cm-ai-widget-empty"
      empty.style.margin = "0"
      wrapper.appendChild(empty)
      return wrapper
    }

    // Show Run button
    const runBtn = document.createElement("button")
    runBtn.className = "cm-ai-widget-run"
    runBtn.textContent = "\u25B6 Run"
    runBtn.addEventListener("click", (e) => {
      e.preventDefault()
      runBtn.remove()

      const body = document.createElement("p")
      body.style.margin = "0"
      body.textContent = "generating..."
      body.className = "cm-ai-widget-loading"
      wrapper.appendChild(body)

      fetchAiResponse(trimmed)
        .then((response) => {
          const processed = expandTableCommands(response)
          // Find the /ai[prompt] in the current document and replace it
          const target = `/ai[${this.prompt}]`
          const docText = view.state.doc.toString()
          const idx = docText.indexOf(target)
          if (idx !== -1) {
            view.dispatch({
              changes: { from: idx, to: idx + target.length, insert: processed },
            })
          } else {
            // Fallback: show in widget if the match moved
            body.textContent = response
            body.className = "cm-ai-widget-response"
            view.dispatch({ effects: aiResponseReceived.of(null) })
          }
        })
        .catch(() => {
          body.textContent = "failed to generate response"
          body.className = "cm-ai-widget-error"
          wrapper.classList.add("cm-ai-widget-errored")
        })
    })
    header.appendChild(runBtn)

    return wrapper
  }

  ignoreEvent() {
    return false
  }
}

function buildDecorations(state: EditorState) {
  const builder = new RangeSetBuilder<Decoration>()

  for (let i = 1; i <= state.doc.lines; i++) {
    const line = state.doc.line(i)
    AI_RE.lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = AI_RE.exec(line.text)) !== null) {
      builder.add(
        line.to,
        line.to,
        Decoration.widget({
          widget: new AiWidget(match[1]),
          block: true,
          side: 1,
        })
      )
    }
  }

  return builder.finish()
}

export const aiPreviewField = StateField.define<DecorationSet>({
  create(state) {
    return buildDecorations(state)
  },
  update(deco, tr) {
    if (tr.docChanged || tr.effects.some((e) => e.is(aiResponseReceived))) {
      return buildDecorations(tr.state)
    }
    return deco
  },
  provide(field) {
    return EditorView.decorations.from(field)
  },
})
