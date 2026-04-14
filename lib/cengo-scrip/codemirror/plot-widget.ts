import { EditorView, Decoration, WidgetType, DecorationSet } from "@codemirror/view"
import { EditorState, StateField, Range } from "@codemirror/state"
import { parsePlots, parseSheets, gridToCells, type PlotInfo } from "../spreadsheet/parser"
import { evaluateSheet } from "../spreadsheet/engine"
import { letterToCol, colToLetter, type CellValue } from "../spreadsheet/types"
import { Chart, registerables } from "chart.js"

Chart.register(...registerables)

const CHART_COLORS = [
  "var(--accent)",
  "#4ADE80",
  "#F59E0B",
  "#F87171",
  "#38BDF8",
  "#C084FC",
  "#FB923C",
  "#2DD4BF",
]

function getComputedColor(varExpr: string): string {
  if (!varExpr.startsWith("var(")) return varExpr
  const prop = varExpr.slice(4, -1)
  return getComputedStyle(document.documentElement).getPropertyValue(prop).trim() || "#888"
}

class PlotWidget extends WidgetType {
  constructor(readonly info: PlotInfo, readonly docText: string) {
    super()
  }

  eq(other: PlotWidget) {
    return (
      this.info.sheetName === other.info.sheetName &&
      this.info.chartType === other.info.chartType &&
      this.info.xCol === other.info.xCol &&
      this.info.yCols.join(",") === other.info.yCols.join(",") &&
      this.docText === other.docText
    )
  }

  toDOM() {
    const wrapper = document.createElement("div")
    wrapper.className = "cm-plot-widget"

    const header = document.createElement("div")
    header.className = "cm-plot-header"
    const label = document.createElement("span")
    label.className = "cm-plot-label"
    label.textContent = `plot: ${this.info.sheetName} (${this.info.chartType})`
    header.appendChild(label)
    wrapper.appendChild(header)

    // Find the referenced sheet in the document
    const sheets = parseSheets(this.docText)
    const sheet = sheets.find((s) => s.name === this.info.sheetName)

    if (!sheet) {
      const err = document.createElement("div")
      err.className = "cm-plot-error"
      err.textContent = `Sheet "${this.info.sheetName}" not found`
      wrapper.appendChild(err)
      return wrapper
    }

    // Compute cell values
    const cells = gridToCells(sheet.grid)
    const computed = evaluateSheet(cells)

    // Extract data columns
    const xColIdx = letterToCol(this.info.xCol.toUpperCase())
    const xData: (string | number)[] = []
    const ySeriesData: { label: string; data: number[] }[] = []

    for (const yColStr of this.info.yCols) {
      ySeriesData.push({ label: yColStr.toUpperCase(), data: [] })
    }

    const rowCount = sheet.grid.length
    for (let r = 0; r < rowCount; r++) {
      const xAddr = colToLetter(xColIdx) + (r + 1)
      const xVal = computed[xAddr]
      xData.push(xVal !== undefined ? (typeof xVal === "number" ? xVal : String(xVal)) : "")

      for (let si = 0; si < this.info.yCols.length; si++) {
        const yColIdx = letterToCol(this.info.yCols[si].toUpperCase())
        const yAddr = colToLetter(yColIdx) + (r + 1)
        const yVal = computed[yAddr]
        ySeriesData[si].data.push(typeof yVal === "number" ? yVal : Number(yVal) || 0)
      }
    }

    // Create canvas
    const canvas = document.createElement("canvas")
    canvas.className = "cm-plot-canvas"
    canvas.height = 250
    wrapper.appendChild(canvas)

    // Render chart
    const fg = getComputedColor("var(--foreground)")
    const border = getComputedColor("var(--border)")
    const muted = getComputedColor("var(--muted)")

    const chartType = this.info.chartType as "line" | "bar" | "scatter" | "pie"

    const datasets = ySeriesData.map((series, i) => {
      const color = getComputedColor(CHART_COLORS[i % CHART_COLORS.length])
      if (chartType === "scatter") {
        return {
          label: series.label,
          data: series.data.map((y, idx) => ({ x: typeof xData[idx] === "number" ? xData[idx] as number : idx, y })),
          backgroundColor: color,
          borderColor: color,
          pointRadius: 4,
        }
      }
      return {
        label: series.label,
        data: series.data,
        backgroundColor: chartType === "pie"
          ? series.data.map((_, di) => getComputedColor(CHART_COLORS[di % CHART_COLORS.length]))
          : color + "40",
        borderColor: chartType === "pie"
          ? series.data.map((_, di) => getComputedColor(CHART_COLORS[di % CHART_COLORS.length]))
          : color,
        borderWidth: 2,
        tension: 0.3,
        fill: chartType === "line",
        pointRadius: chartType === "line" ? 3 : 0,
      }
    })

    const labels = xData.map(String)

    // Use requestAnimationFrame to ensure canvas is in DOM
    requestAnimationFrame(() => {
      try {
        new Chart(canvas, {
          type: chartType === "scatter" ? "scatter" : chartType === "pie" ? "pie" : chartType as "line" | "bar",
          data: {
            labels: chartType === "scatter" ? undefined : labels,
            datasets: datasets as any,
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
              legend: {
                display: ySeriesData.length > 1 || chartType === "pie",
                labels: { color: fg, font: { family: "JetBrains Mono, monospace", size: 11 } },
              },
            },
            scales: chartType === "pie" ? {} : {
              x: {
                ticks: { color: muted, font: { family: "JetBrains Mono, monospace", size: 10 } },
                grid: { color: border },
              },
              y: {
                ticks: { color: muted, font: { family: "JetBrains Mono, monospace", size: 10 } },
                grid: { color: border },
              },
            },
          },
        })
      } catch {
        const err = document.createElement("div")
        err.className = "cm-plot-error"
        err.textContent = "Failed to render chart"
        wrapper.appendChild(err)
      }
    })

    return wrapper
  }

  ignoreEvent() {
    return true
  }
}

function buildDecorations(state: EditorState): DecorationSet {
  const text = state.doc.toString()
  const plots = parsePlots(text)
  const decos: Range<Decoration>[] = []

  for (const p of plots) {
    decos.push(
      Decoration.replace({
        widget: new PlotWidget(p, text),
        block: true,
      }).range(p.from, p.to)
    )
  }

  return Decoration.set(decos)
}

export const plotField = StateField.define<DecorationSet>({
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
