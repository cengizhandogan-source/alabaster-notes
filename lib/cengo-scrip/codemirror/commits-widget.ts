import { EditorView, Decoration, WidgetType, DecorationSet } from "@codemirror/view"
import { EditorState, StateField, Range } from "@codemirror/state"

const COMMITS_RE = /^::commits\[([^\]]+)\]\s*$/gm

type CommitInfo = {
  from: number
  to: number
  owner: string
  repo: string
  branch: string
}

type CommitData = {
  sha: string
  fullSha: string
  message: string
  url: string
  author: string
  date: string
  parents: string[]
}

function parseCommitsDirectives(text: string): CommitInfo[] {
  const results: CommitInfo[] = []
  let match: RegExpExecArray | null
  COMMITS_RE.lastIndex = 0

  while ((match = COMMITS_RE.exec(text)) !== null) {
    const spec = match[1]
    const atIdx = spec.indexOf("@")
    if (atIdx === -1) continue

    const repoPath = spec.slice(0, atIdx)
    const branch = spec.slice(atIdx + 1)
    const slashIdx = repoPath.indexOf("/")
    if (slashIdx === -1) continue

    results.push({
      from: match.index,
      to: match.index + match[0].length,
      owner: repoPath.slice(0, slashIdx),
      repo: repoPath.slice(slashIdx + 1),
      branch,
    })
  }

  return results
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d`
  const months = Math.floor(days / 30)
  return `${months}mo`
}

const TRACK_COLORS = [
  "var(--accent)",
  "#4ADE80",
  "#F59E0B",
  "#38BDF8",
  "#C084FC",
  "#FB923C",
]

class CommitsWidget extends WidgetType {
  constructor(
    readonly info: CommitInfo,
  ) {
    super()
  }

  eq(other: CommitsWidget) {
    return (
      this.info.owner === other.info.owner &&
      this.info.repo === other.info.repo &&
      this.info.branch === other.info.branch
    )
  }

  toDOM() {
    const wrapper = document.createElement("div")
    wrapper.className = "cm-commits-widget"

    const header = document.createElement("div")
    header.className = "cm-commits-header"
    header.textContent = `commits: ${this.info.owner}/${this.info.repo}@${this.info.branch}`
    wrapper.appendChild(header)

    const loading = document.createElement("div")
    loading.className = "cm-commits-loading"
    loading.textContent = "loading..."
    wrapper.appendChild(loading)

    fetch(`/api/github/repos/${this.info.owner}/${this.info.repo}/commits?branch=${this.info.branch}`)
      .then((res) => res.json())
      .then((commits: CommitData[]) => {
        loading.remove()
        if (commits.length === 0) {
          const empty = document.createElement("div")
          empty.className = "cm-commits-empty"
          empty.textContent = "no commits found"
          wrapper.appendChild(empty)
          return
        }
        wrapper.appendChild(buildGraph(commits, this.info.owner, this.info.repo))
      })
      .catch(() => {
        loading.textContent = "failed to load commits"
      })

    return wrapper
  }

  ignoreEvent() {
    return true
  }
}

function buildGraph(commits: CommitData[], owner: string, repo: string): HTMLElement {
  const container = document.createElement("div")
  container.className = "cm-commits-graph"

  // Build graph topology
  // Track active "lanes" — each lane is a SHA we're expecting as a parent
  const lanes: (string | null)[] = []
  const shaSet = new Set(commits.map((c) => c.sha))

  for (const commit of commits) {
    // Find which lane this commit occupies
    let commitLane = lanes.indexOf(commit.sha)
    if (commitLane === -1) {
      // New lane: find first empty slot or add new
      commitLane = lanes.indexOf(null)
      if (commitLane === -1) {
        commitLane = lanes.length
        lanes.push(commit.sha)
      } else {
        lanes[commitLane] = commit.sha
      }
    }

    const row = document.createElement("div")
    row.className = "cm-commits-row"

    // Build the graph column (lanes visualization)
    const graphCol = document.createElement("span")
    graphCol.className = "cm-commits-graph-col"

    // Determine merges and forks
    const parents = commit.parents.filter((p) => shaSet.has(p))
    const firstParent = parents[0] || null
    const mergeParents = parents.slice(1)

    // Draw lane lines
    for (let i = 0; i < Math.max(lanes.length, commitLane + 1); i++) {
      const ch = document.createElement("span")

      if (i === commitLane) {
        ch.textContent = "●"
        ch.className = "cm-commits-dot"
        ch.style.color = getColor(commitLane)
      } else if (lanes[i] !== null) {
        ch.textContent = "│"
        ch.className = "cm-commits-line"
        ch.style.color = getColor(i)
      } else {
        ch.textContent = " "
      }

      graphCol.appendChild(ch)
    }

    // Show merge indicators
    if (mergeParents.length > 0) {
      const mergeIndicator = document.createElement("span")
      mergeIndicator.className = "cm-commits-merge"
      mergeIndicator.textContent = "◄"
      mergeIndicator.style.color = getColor(commitLane)
      graphCol.appendChild(mergeIndicator)
    }

    row.appendChild(graphCol)

    // Commit details
    const details = document.createElement("span")
    details.className = "cm-commits-details"

    const shaLink = document.createElement("a")
    shaLink.href = `https://github.com/${owner}/${repo}/commit/${commit.fullSha}`
    shaLink.target = "_blank"
    shaLink.rel = "noopener noreferrer"
    shaLink.className = "cm-commits-sha"
    shaLink.textContent = commit.sha
    details.appendChild(shaLink)

    const msg = document.createElement("span")
    msg.className = "cm-commits-msg"
    msg.textContent = commit.message.length > 50 ? commit.message.slice(0, 47) + "..." : commit.message
    details.appendChild(msg)

    const author = document.createElement("span")
    author.className = "cm-commits-author"
    author.textContent = `@${commit.author}`
    details.appendChild(author)

    const time = document.createElement("span")
    time.className = "cm-commits-time"
    time.textContent = relativeTime(commit.date)
    details.appendChild(time)

    row.appendChild(details)
    container.appendChild(row)

    // Update lanes for next row
    // Current lane now expects the first parent
    lanes[commitLane] = firstParent

    // Merge parents get new lanes
    for (const mp of mergeParents) {
      if (!lanes.includes(mp)) {
        const emptySlot = lanes.indexOf(null)
        if (emptySlot !== -1) {
          lanes[emptySlot] = mp
        } else {
          lanes.push(mp)
        }
      }
    }

    // Clean up lanes that are no longer needed
    // A lane is done if no remaining commit has it as a SHA
    for (let i = lanes.length - 1; i >= 0; i--) {
      if (lanes[i] !== null && !commits.some((c) => c.sha === lanes[i])) {
        // Keep it — it might be a parent we haven't seen yet
      }
    }

    // Trim trailing nulls
    while (lanes.length > 0 && lanes[lanes.length - 1] === null) {
      lanes.pop()
    }
  }

  return container
}

function getColor(lane: number): string {
  return TRACK_COLORS[lane % TRACK_COLORS.length]
}

function buildDecorations(state: EditorState): DecorationSet {
  const text = state.doc.toString()
  const directives = parseCommitsDirectives(text)
  const decos: Range<Decoration>[] = []

  for (const d of directives) {
    decos.push(
      Decoration.replace({
        widget: new CommitsWidget(d),
        block: true,
      }).range(d.from, d.to)
    )
  }

  return Decoration.set(decos)
}

export const commitsField = StateField.define<DecorationSet>({
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
})
