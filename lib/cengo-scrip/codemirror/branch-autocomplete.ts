import { CompletionContext, CompletionResult } from "@codemirror/autocomplete"
import { Facet } from "@codemirror/state"

export type RepoRef = {
  owner: string
  name: string
  full_name: string
  default_branch: string
}

export const repoListFacet = Facet.define<RepoRef[], RepoRef[]>({
  combine: (values) => values.flat(),
})

const branchCache = new Map<string, string[]>()

async function fetchBranches(owner: string, name: string): Promise<string[]> {
  const key = `${owner}/${name}`
  if (branchCache.has(key)) return branchCache.get(key)!

  try {
    const res = await fetch(`/api/github/repos/${owner}/${name}/branches`)
    if (!res.ok) return []
    const data: { name: string }[] = await res.json()
    const names = data.map((b) => b.name)
    branchCache.set(key, names)
    return names
  } catch {
    return []
  }
}

export function branchCompletionSource(context: CompletionContext): CompletionResult | null {
  const line = context.state.doc.lineAt(context.pos)
  const textBefore = line.text.slice(0, context.pos - line.from)

  // Match /branch with optional partial first arg
  const repoMatch = textBefore.match(/^\/branch\s+([\w\-./]*)$/)
  if (repoMatch) {
    const partial = repoMatch[1]
    const repos = context.state.facet(repoListFacet)
    if (repos.length === 0) return null

    return {
      from: line.from + textBefore.lastIndexOf(partial),
      options: repos.map((r) => ({
        label: r.full_name,
        detail: `default: ${r.default_branch}`,
        type: "keyword",
      })),
    }
  }

  // Match /branch owner/repo with optional partial second arg (base branch)
  const branchMatch = textBefore.match(/^\/branch\s+([\w\-.]+)\/([\w\-.]+)\s+([\w\-./]*)$/)
  if (branchMatch) {
    const [, owner, name, partial] = branchMatch
    const branches = branchCache.get(`${owner}/${name}`)

    // Trigger async fetch if not cached
    if (!branches) {
      fetchBranches(owner, name).then(() => {
        // Force re-trigger completion by dispatching a no-op
        const view = (context as unknown as { view?: { dispatch: (spec: object) => void } }).view
        if (view) view.dispatch({})
      })
      return null
    }

    return {
      from: line.from + textBefore.lastIndexOf(partial),
      options: branches.map((b) => ({
        label: b,
        type: "variable",
      })),
    }
  }

  return null
}
