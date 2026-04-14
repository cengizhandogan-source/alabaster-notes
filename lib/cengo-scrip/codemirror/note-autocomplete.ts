import { autocompletion, CompletionContext, CompletionResult } from "@codemirror/autocomplete"
import { notesListFacet } from "./note-link"
import { branchCompletionSource } from "./branch-autocomplete"

function noteCompletionSource(context: CompletionContext): CompletionResult | null {
  const match = context.matchBefore(/@[\w-]*/)
  if (!match || match.from === match.to && !context.explicit) return null

  const notes = context.state.facet(notesListFacet)

  return {
    from: match.from,
    options: notes.map((n) => ({
      label: `@${n.slug}`,
      detail: n.title,
      type: "text",
    })),
  }
}

export const noteAutocompletion = autocompletion({
  override: [noteCompletionSource, branchCompletionSource],
  activateOnTyping: true,
})
