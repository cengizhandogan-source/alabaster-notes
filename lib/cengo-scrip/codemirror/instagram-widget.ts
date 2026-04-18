import { EditorView, Decoration, WidgetType, DecorationSet, keymap } from "@codemirror/view"
import { EditorState, EditorSelection, StateField, Range, Extension } from "@codemirror/state"

const INSTAGRAM_RE = /^::instagram\[([A-Za-z0-9_-]+)\]\s*$/gm

type InstagramInfo = {
  from: number
  to: number
  postId: string
}

type InstagramPostData = {
  id: string
  caption: string
  status: "draft" | "scheduled" | "published" | "failed"
  platformStatus: "pending" | "published" | "failed" | null
  scheduledFor: string | null
  publishedAt: string | null
  media: { type: "image" | "video"; url: string } | null
}

const STATUS_COLORS: Record<InstagramPostData["status"], string> = {
  draft: "var(--muted)",
  scheduled: "#E1306C",
  published: "#2b9348",
  failed: "#D1453B",
}

function parseInstagramDirectives(text: string): InstagramInfo[] {
  const results: InstagramInfo[] = []
  let match: RegExpExecArray | null
  INSTAGRAM_RE.lastIndex = 0
  while ((match = INSTAGRAM_RE.exec(text)) !== null) {
    results.push({
      from: match.index,
      to: match.index + match[0].length,
      postId: match[1],
    })
  }
  return results
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

class InstagramWidget extends WidgetType {
  constructor(readonly info: InstagramInfo) {
    super()
  }

  eq(other: InstagramWidget) {
    return this.info.postId === other.info.postId
  }

  toDOM() {
    const wrapper = document.createElement("div")
    wrapper.className = "cm-instagram-widget"

    const header = document.createElement("div")
    header.className = "cm-instagram-header"
    header.textContent = `instagram: ${this.info.postId}`
    wrapper.appendChild(header)

    const loading = document.createElement("div")
    loading.className = "cm-instagram-loading"
    loading.textContent = "loading..."
    wrapper.appendChild(loading)

    fetch(`/api/zernio/posts/${this.info.postId}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? "post not found" : "failed to load")
        return res.json()
      })
      .then((post: InstagramPostData) => {
        loading.remove()
        header.textContent = `instagram: ${post.id}`

        if (post.media) {
          const mediaWrap = document.createElement("div")
          mediaWrap.className = "cm-instagram-media"
          if (post.media.type === "image") {
            const img = document.createElement("img")
            img.src = post.media.url
            img.alt = ""
            img.className = "cm-instagram-image"
            mediaWrap.appendChild(img)
          } else {
            const vid = document.createElement("video")
            vid.src = post.media.url
            vid.controls = true
            vid.className = "cm-instagram-video"
            mediaWrap.appendChild(vid)
          }
          wrapper.appendChild(mediaWrap)
        }

        if (post.caption) {
          const caption = document.createElement("div")
          caption.className = "cm-instagram-caption"
          caption.textContent = post.caption
          wrapper.appendChild(caption)
        }

        const meta = document.createElement("div")
        meta.className = "cm-instagram-meta"

        const status = document.createElement("span")
        status.className = "cm-instagram-status"
        status.textContent = post.status
        status.style.borderColor = STATUS_COLORS[post.status] || "var(--muted)"
        status.style.color = STATUS_COLORS[post.status] || "var(--muted)"
        meta.appendChild(status)

        const when = post.publishedAt
          ? `published ${formatDate(post.publishedAt)}`
          : post.scheduledFor
            ? `scheduled for ${formatDate(post.scheduledFor)}`
            : null
        if (when) {
          const ts = document.createElement("span")
          ts.className = "cm-instagram-when"
          ts.textContent = when
          meta.appendChild(ts)
        }

        wrapper.appendChild(meta)
      })
      .catch((err) => {
        loading.textContent = err.message || "failed to load post"
        loading.className = "cm-instagram-error"
        wrapper.classList.add("cm-instagram-errored")
      })

    return wrapper
  }

  ignoreEvent() {
    return true
  }
}

function buildDecorations(state: EditorState): DecorationSet {
  const text = state.doc.toString()
  const directives = parseInstagramDirectives(text)
  const decos: Range<Decoration>[] = []
  for (const d of directives) {
    decos.push(
      Decoration.replace({
        widget: new InstagramWidget(d),
        block: true,
      }).range(d.from, d.to),
    )
  }
  return Decoration.set(decos)
}

const instagramKeymap = keymap.of([
  {
    key: "Space",
    run(view) {
      const { state } = view
      const pos = state.selection.main.head
      const line = state.doc.lineAt(pos)
      const lineText = line.text
      INSTAGRAM_RE.lastIndex = 0
      if (!INSTAGRAM_RE.test(lineText)) return false
      if (line.to < state.doc.length) return false
      view.dispatch({
        changes: { from: line.to, insert: "\n " },
        selection: EditorSelection.cursor(line.to + 2),
      })
      return true
    },
  },
])

export const instagramField: Extension = [
  StateField.define<DecorationSet>({
    create(state) {
      return buildDecorations(state)
    },
    update(deco, tr) {
      if (tr.docChanged) return buildDecorations(tr.state)
      return deco
    },
    provide(field) {
      return EditorView.decorations.from(field)
    },
  }),
  instagramKeymap,
]
