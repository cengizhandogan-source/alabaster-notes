import { highlightPlugin } from "./codemirror/highlight-plugin"
import { tableExpand } from "./codemirror/table-expand"
import { mathPreviewPlugin } from "./codemirror/math-widget"
import { tablePreviewPlugin } from "./codemirror/table-widget"
import { editableTableField } from "./codemirror/editable-table-widget"
import { aiPreviewField } from "./codemirror/ai-widget"
import { inlineFormatPlugin } from "./codemirror/inline-format"
import { checkboxPlugin } from "./codemirror/checkbox-widget"
import { slashCommands } from "./codemirror/slash-commands"
import { cengoScripTheme } from "./codemirror/theme"
import { noteLinkPlugin, notesListFacet, noteNavigateFacet } from "./codemirror/note-link"
import { noteAutocompletion } from "./codemirror/note-autocomplete"
import { repoListFacet, branchCompletionSource } from "./codemirror/branch-autocomplete"
import type { RepoRef } from "./codemirror/branch-autocomplete"
import { fileDropExtension } from "./codemirror/file-drop"
import { imagePreviewPlugin } from "./codemirror/image-widget"
import { urlLinkPlugin } from "./codemirror/url-link"
import { hrPlugin } from "./codemirror/hr-widget"
import { sheetField } from "./codemirror/sheet-widget"
import { plotField } from "./codemirror/plot-widget"
import { commitsField } from "./codemirror/commits-widget"
import type { Extension } from "@codemirror/state"
import type { NoteRef } from "./utils/slugify"

interface CengoScripOptions {
  notes?: NoteRef[]
  onNavigate?: (noteId: string) => void
  repos?: RepoRef[]
}

export function cengoScripExtension(options: CengoScripOptions = {}): Extension {
  const extensions: Extension[] = [highlightPlugin, tableExpand, slashCommands, mathPreviewPlugin, tablePreviewPlugin, editableTableField, aiPreviewField, inlineFormatPlugin, checkboxPlugin, fileDropExtension, imagePreviewPlugin, urlLinkPlugin, hrPlugin, sheetField, plotField, commitsField, cengoScripTheme]

  if (options.notes) {
    extensions.push(notesListFacet.of(options.notes), noteLinkPlugin, noteAutocompletion)
  }
  if (options.onNavigate) {
    extensions.push(noteNavigateFacet.of(options.onNavigate))
  }
  if (options.repos && options.repos.length > 0) {
    extensions.push(repoListFacet.of(options.repos))
  }

  return extensions
}
