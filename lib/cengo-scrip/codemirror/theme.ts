import { EditorView } from "@codemirror/view"

export const cengoScripTheme = EditorView.baseTheme({
  ".cm-cengo-ai": {
    backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)",
    borderRadius: "3px",
    padding: "0 2px",
  },
  ".cm-cengo-table": {
    backgroundColor: "color-mix(in srgb, var(--surface) 80%, transparent)",
    border: "1px dashed var(--border)",
    borderRadius: "3px",
    padding: "0 2px",
  },
  ".cm-cengo-math": {
    color: "var(--accent)",
    fontStyle: "italic",
  },

  // Math inline preview
  ".cm-math-widget": {
    display: "inline",
  },
  ".cm-math-widget .katex": {
    fontSize: "1.1em",
  },
  ".cm-math-widget-error": {
    color: "var(--error)",
    fontStyle: "italic",
  },

  // Table block preview
  ".cm-table-widget": {
    borderLeft: "3px solid var(--border)",
    margin: "4px 0 4px 8px",
    padding: "4px 8px",
    background: "var(--surface)",
    borderRadius: "0 4px 4px 0",
    fontSize: "0.875em",
  },
  ".cm-table-widget table": {
    width: "100%",
    borderCollapse: "collapse",
  },
  ".cm-table-widget th, .cm-table-widget td": {
    border: "1px solid var(--border)",
    padding: "4px 8px",
    textAlign: "left",
  },
  ".cm-table-widget th": {
    backgroundColor: "color-mix(in srgb, var(--surface) 80%, transparent)",
    fontWeight: "500",
  },

  // Editable table widget
  ".cm-table-edit-widget": {
    borderLeft: "3px solid var(--accent)",
    margin: "4px 0 4px 8px",
    padding: "4px 8px",
    background: "var(--surface)",
    borderRadius: "0 4px 4px 0",
    fontSize: "0.875em",
  },
  ".cm-table-edit-widget table": {
    width: "100%",
    borderCollapse: "collapse",
  },
  ".cm-table-edit-widget th, .cm-table-edit-widget td": {
    border: "1px solid var(--border)",
    padding: "4px 8px",
    textAlign: "left",
    cursor: "text",
    outline: "none",
    minWidth: "40px",
  },
  ".cm-table-edit-widget th": {
    backgroundColor: "color-mix(in srgb, var(--surface) 80%, transparent)",
    fontWeight: "500",
  },
  ".cm-table-edit-widget th:focus, .cm-table-edit-widget td:focus": {
    boxShadow: "inset 0 0 0 1.5px var(--accent)",
    borderRadius: "1px",
  },
  ".cm-table-edit-widget td:empty::before": {
    content: "'\\00a0'",
  },

  // AI chip
  ".cm-ai-widget": {
    borderLeft: "3px solid var(--accent)",
    padding: "8px 12px",
    margin: "4px 0",
    background: "var(--surface)",
    borderRadius: "0 4px 4px 0",
    fontSize: "0.875em",
  },
  ".cm-ai-widget-header": {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
  },
  ".cm-ai-widget-label": {
    fontSize: "0.75em",
    color: "var(--muted)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  ".cm-ai-widget-run": {
    fontSize: "0.75em",
    padding: "2px 10px",
    border: "1px solid var(--accent)",
    borderRadius: "3px",
    background: "color-mix(in srgb, var(--accent) 15%, transparent)",
    color: "var(--accent)",
    cursor: "pointer",
    whiteSpace: "nowrap",
    "&:hover": {
      background: "color-mix(in srgb, var(--accent) 30%, transparent)",
    },
  },
  ".cm-ai-widget-response": {
    marginTop: "4px",
  },
  ".cm-ai-widget-loading": {
    color: "var(--muted)",
    animation: "blink 1s step-end infinite",
    marginTop: "4px",
  },
  ".cm-ai-widget-empty": {
    color: "var(--muted)",
    fontStyle: "italic",
  },
  ".cm-ai-widget-error": {
    color: "var(--error)",
  },
  ".cm-ai-widget-errored": {
    borderLeftColor: "var(--error)",
  },

  // Checkbox widget
  ".cm-checkbox-widget": {
    cursor: "pointer",
    accentColor: "var(--accent)",
    marginRight: "4px",
    verticalAlign: "middle",
  },

  // Note link
  ".cm-cengo-note-link": {
    color: "var(--accent)",
  },
  ".cm-note-link-widget": {
    color: "var(--accent)",
    textDecoration: "underline",
    textUnderlineOffset: "2px",
    cursor: "pointer",
    "&:hover": {
      opacity: "0.8",
    },
  },
  ".cm-note-link-broken": {
    color: "var(--muted)",
    textDecoration: "underline dashed",
    textUnderlineOffset: "2px",
  },

  // URL link
  ".cm-url-link-widget": {
    color: "var(--accent)",
    textDecoration: "underline",
    textUnderlineOffset: "2px",
    cursor: "pointer",
    "&:hover": {
      opacity: "0.8",
    },
  },

  // Horizontal rule widget
  ".cm-hr-widget": {
    border: "none",
    borderTop: "1px solid var(--border)",
    margin: "8px 0",
    width: "100%",
  },

  // Image widget
  ".cm-image-widget-wrapper": {
    padding: "4px 0",
  },
  ".cm-image-widget": {
    display: "block",
    maxWidth: "100%",
    maxHeight: "400px",
    objectFit: "contain",
    borderRadius: "4px",
    border: "1px solid var(--border)",
  },

  // Sheet widget
  ".cm-sheet-widget": {
    borderLeft: "3px solid var(--accent)",
    margin: "4px 0 4px 8px",
    padding: "0",
    background: "var(--surface)",
    borderRadius: "0 4px 4px 0",
    fontSize: "0.875em",
  },
  ".cm-sheet-header": {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "6px 10px",
    borderBottom: "1px solid var(--border)",
  },
  ".cm-sheet-name": {
    fontSize: "0.75em",
    color: "var(--accent)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontWeight: "600",
  },
  ".cm-sheet-controls": {
    display: "flex",
    gap: "4px",
  },
  ".cm-sheet-add-btn": {
    fontSize: "0.7em",
    padding: "2px 8px",
    border: "1px solid var(--border)",
    borderRadius: "3px",
    background: "transparent",
    color: "var(--muted)",
    cursor: "pointer",
    "&:hover": {
      color: "var(--accent)",
      borderColor: "var(--accent)",
    },
  },
  ".cm-sheet-formula-bar": {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "4px 10px",
    borderBottom: "1px solid var(--border)",
    fontSize: "0.8em",
    minHeight: "24px",
  },
  ".cm-sheet-cell-label": {
    color: "var(--accent)",
    fontWeight: "600",
    minWidth: "30px",
  },
  ".cm-sheet-formula-input": {
    color: "var(--foreground)",
    flex: "1",
  },
  ".cm-sheet-grid": {
    width: "100%",
    borderCollapse: "collapse",
  },
  ".cm-sheet-grid th, .cm-sheet-grid td": {
    border: "1px solid var(--border)",
    padding: "3px 8px",
    textAlign: "left",
    outline: "none",
    minWidth: "60px",
  },
  ".cm-sheet-corner": {
    width: "32px",
    minWidth: "32px",
    background: "color-mix(in srgb, var(--surface) 80%, transparent)",
  },
  ".cm-sheet-col-header": {
    background: "color-mix(in srgb, var(--surface) 80%, transparent)",
    fontWeight: "500",
    textAlign: "center !important",
    color: "var(--muted)",
    fontSize: "0.85em",
  },
  ".cm-sheet-row-header": {
    background: "color-mix(in srgb, var(--surface) 80%, transparent)",
    fontWeight: "500",
    textAlign: "center !important",
    color: "var(--muted)",
    fontSize: "0.85em",
    width: "32px",
    minWidth: "32px",
  },
  ".cm-sheet-cell-active": {
    boxShadow: "inset 0 0 0 1.5px var(--accent)",
    borderRadius: "1px",
  },
  ".cm-sheet-grid td:empty::before": {
    content: "'\\00a0'",
  },

  // Sheet/plot syntax highlights
  ".cm-cengo-sheet": {
    color: "var(--accent)",
    fontWeight: "500",
  },
  ".cm-cengo-plot": {
    color: "var(--accent)",
    fontStyle: "italic",
  },

  // Plot widget
  ".cm-plot-widget": {
    borderLeft: "3px solid var(--accent)",
    margin: "4px 0 4px 8px",
    padding: "8px",
    background: "var(--surface)",
    borderRadius: "0 4px 4px 0",
  },
  ".cm-plot-header": {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "8px",
  },
  ".cm-plot-label": {
    fontSize: "0.75em",
    color: "var(--accent)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontWeight: "600",
  },
  ".cm-plot-canvas": {
    width: "100%",
    maxHeight: "300px",
  },
  ".cm-plot-error": {
    color: "var(--error)",
    fontSize: "0.85em",
    fontStyle: "italic",
  },
})
