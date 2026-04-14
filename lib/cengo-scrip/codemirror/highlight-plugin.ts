import { ViewPlugin, ViewUpdate, DecorationSet, Decoration, MatchDecorator } from "@codemirror/view"
import { RangeSet } from "@codemirror/state"

const aiDecorator = new MatchDecorator({
  regexp: /\/ai\[([^\]]*)\]/g,
  decoration: Decoration.mark({ class: "cm-cengo-ai" }),
})

const tableDecorator = new MatchDecorator({
  regexp: /\/table\[\s*\d+\s*,\s*\d+\s*\]/g,
  decoration: Decoration.mark({ class: "cm-cengo-table" }),
})

const mathDecorator = new MatchDecorator({
  regexp: /(?<!\$)\$(?!\$)(?!\s)(.+?)(?<!\s)\$(?!\$)/g,
  decoration: Decoration.mark({ class: "cm-cengo-math" }),
})

const noteLinkDecorator = new MatchDecorator({
  regexp: /@([\w-]+)/g,
  decoration: Decoration.mark({ class: "cm-cengo-note-link" }),
})

const sheetDecorator = new MatchDecorator({
  regexp: /^::(?:sheet\[[^\]]*\]|endsheet)\s*$/gm,
  decoration: Decoration.mark({ class: "cm-cengo-sheet" }),
})

const plotDecorator = new MatchDecorator({
  regexp: /^::plot\[[^\]]+\]\s*$/gm,
  decoration: Decoration.mark({ class: "cm-cengo-plot" }),
})

const commitsDecorator = new MatchDecorator({
  regexp: /^::commits\[[^\]]+\]\s*$/gm,
  decoration: Decoration.mark({ class: "cm-cengo-commits" }),
})

export const highlightPlugin = ViewPlugin.fromClass(
  class {
    aiDeco: DecorationSet
    tableDeco: DecorationSet
    mathDeco: DecorationSet
    noteLinkDeco: DecorationSet

    sheetDeco: DecorationSet
    plotDeco: DecorationSet
    commitsDeco: DecorationSet

    constructor(view: import("@codemirror/view").EditorView) {
      this.aiDeco = aiDecorator.createDeco(view)
      this.tableDeco = tableDecorator.createDeco(view)
      this.mathDeco = mathDecorator.createDeco(view)
      this.noteLinkDeco = noteLinkDecorator.createDeco(view)
      this.sheetDeco = sheetDecorator.createDeco(view)
      this.plotDeco = plotDecorator.createDeco(view)
      this.commitsDeco = commitsDecorator.createDeco(view)
    }

    update(update: ViewUpdate) {
      this.aiDeco = aiDecorator.updateDeco(update, this.aiDeco)
      this.tableDeco = tableDecorator.updateDeco(update, this.tableDeco)
      this.mathDeco = mathDecorator.updateDeco(update, this.mathDeco)
      this.noteLinkDeco = noteLinkDecorator.updateDeco(update, this.noteLinkDeco)
      this.sheetDeco = sheetDecorator.updateDeco(update, this.sheetDeco)
      this.plotDeco = plotDecorator.updateDeco(update, this.plotDeco)
      this.commitsDeco = commitsDecorator.updateDeco(update, this.commitsDeco)
    }
  },
  {
    decorations: (v) => RangeSet.join([v.aiDeco, v.tableDeco, v.mathDeco, v.noteLinkDeco, v.sheetDeco, v.plotDeco, v.commitsDeco]),
  }
)
