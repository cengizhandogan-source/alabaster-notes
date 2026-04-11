import { highlightPlugin } from "./codemirror/highlight-plugin"
import { tableExpand } from "./codemirror/table-expand"
import { mathPreviewPlugin } from "./codemirror/math-widget"
import { tablePreviewPlugin } from "./codemirror/table-widget"
import { editableTableField } from "./codemirror/editable-table-widget"
import { aiPreviewField } from "./codemirror/ai-widget"
import { inlineFormatPlugin } from "./codemirror/inline-format"
import { slashCommands } from "./codemirror/slash-commands"
import { cengoScripTheme } from "./codemirror/theme"
import { noteLinkPlugin, notesListFacet, noteNavigateFacet } from "./codemirror/note-link"
import { noteAutocompletion } from "./codemirror/note-autocomplete"
import type { Extension } from "@codemirror/state"
import type { NoteRef } from "./utils/slugify"

interface CengoScripOptions {
  notes?: NoteRef[]
  onNavigate?: (noteId: string) => void
}

export function cengoScripExtension(options: CengoScripOptions = {}): Extension {
  const extensions: Extension[] = [highlightPlugin, tableExpand, slashCommands, mathPreviewPlugin, tablePreviewPlugin, editableTableField, aiPreviewField, inlineFormatPlugin, cengoScripTheme]

  if (options.notes) {
    extensions.push(notesListFacet.of(options.notes), noteLinkPlugin, noteAutocompletion)
  }
  if (options.onNavigate) {
    extensions.push(noteNavigateFacet.of(options.onNavigate))
  }

  return extensions
}

export { preprocessCengoScrip } from "./preview/preprocess"
export { AiBlock } from "./preview/ai-block"
