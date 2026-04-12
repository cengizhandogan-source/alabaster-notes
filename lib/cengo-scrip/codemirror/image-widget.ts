import { EditorView, Decoration, WidgetType } from "@codemirror/view"
import { EditorState, StateField, RangeSetBuilder } from "@codemirror/state"

const IMAGE_RE = /!\[([^\]]*)\]\(([^)]+)\)/g
const IMAGE_EXTS = /\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)(\?.*)?$/i

function isImageUrl(url: string): boolean {
  if (IMAGE_EXTS.test(url)) return true
  if (url.includes("/storage/v1/object/public/attachments/")) return true
  return false
}

class ImageWidget extends WidgetType {
  constructor(
    readonly src: string,
    readonly alt: string
  ) {
    super()
  }

  eq(other: ImageWidget) {
    return this.src === other.src
  }

  toDOM() {
    const wrapper = document.createElement("div")
    wrapper.className = "cm-image-widget-wrapper"

    const img = document.createElement("img")
    img.src = this.src
    img.alt = this.alt
    img.className = "cm-image-widget"
    img.loading = "lazy"

    wrapper.appendChild(img)
    return wrapper
  }

  ignoreEvent() {
    return true
  }
}

function buildDecorations(state: EditorState) {
  const builder = new RangeSetBuilder<Decoration>()
  const doc = state.doc

  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i)
    IMAGE_RE.lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = IMAGE_RE.exec(line.text)) !== null) {
      const url = match[2]
      if (!isImageUrl(url)) continue

      builder.add(
        line.to,
        line.to,
        Decoration.widget({
          widget: new ImageWidget(url, match[1]),
          block: true,
        })
      )
      break
    }
  }

  return builder.finish()
}

export const imagePreviewPlugin = StateField.define({
  create(state) {
    return buildDecorations(state)
  },
  update(decos, tr) {
    if (tr.docChanged) {
      return buildDecorations(tr.state)
    }
    return decos
  },
  provide: (f) => EditorView.decorations.from(f),
})
