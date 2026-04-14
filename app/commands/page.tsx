import Link from "next/link"

export default function CommandsPage() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-2xl mx-auto space-y-10">
        <div className="space-y-2">
          <Link
            href="/"
            className="text-sm text-secondary hover:text-foreground transition-colors duration-100"
          >
            &lt; back
          </Link>
          <h1 className="text-xl font-medium text-foreground">
            cengo-scrip commands
          </h1>
          <p className="text-secondary text-sm">
            type a command in the editor and press space to trigger it.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-foreground uppercase tracking-wider">
            slash commands
          </h2>
          <div className="border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left px-4 py-2 font-medium text-foreground">
                    command
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-foreground">
                    result
                  </th>
                </tr>
              </thead>
              <tbody className="text-secondary">
                <tr className="border-b border-border">
                  <td className="px-4 py-2 text-accent">/date</td>
                  <td className="px-4 py-2">inserts today&apos;s date</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2 text-accent">/h1</td>
                  <td className="px-4 py-2">heading 1</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2 text-accent">/h2</td>
                  <td className="px-4 py-2">heading 2</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2 text-accent">/h3</td>
                  <td className="px-4 py-2">heading 3</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2 text-accent">/hr</td>
                  <td className="px-4 py-2">horizontal rule</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2 text-accent">/bold</td>
                  <td className="px-4 py-2">bold text markers</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2 text-accent">/italic</td>
                  <td className="px-4 py-2">italic text markers</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2 text-accent">/strike</td>
                  <td className="px-4 py-2">strikethrough markers</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2 text-accent">/code</td>
                  <td className="px-4 py-2">inline code</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2 text-accent">/codeblock</td>
                  <td className="px-4 py-2">fenced code block</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2 text-accent">/sheet</td>
                  <td className="px-4 py-2">inserts a spreadsheet block</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-accent">/plot</td>
                  <td className="px-4 py-2">inserts a chart linked to a sheet</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-foreground uppercase tracking-wider">
            advanced features
          </h2>
          <div className="border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left px-4 py-2 font-medium text-foreground">
                    syntax
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-foreground">
                    description
                  </th>
                </tr>
              </thead>
              <tbody className="text-secondary">
                <tr className="border-b border-border">
                  <td className="px-4 py-2 text-accent">/ai[prompt]</td>
                  <td className="px-4 py-2">
                    inline ai-generated response — click run to execute
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2 text-accent">/table[cols, rows]</td>
                  <td className="px-4 py-2">
                    generates a markdown table with the given dimensions
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2 text-accent">$expression$</td>
                  <td className="px-4 py-2">
                    inline math rendering with KaTeX
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2 text-accent">@note-slug</td>
                  <td className="px-4 py-2">
                    link to another note by its slug
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2 text-accent">::sheet[Name]...::endsheet</td>
                  <td className="px-4 py-2">
                    spreadsheet with formulas (=SUM, =AVG, =IF, etc.)
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2 text-accent">::plot[Sheet|type|x|y]</td>
                  <td className="px-4 py-2">
                    chart from sheet data — line, bar, scatter, or pie
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-accent">=@slug#Sheet.A1</td>
                  <td className="px-4 py-2">
                    cross-note cell reference in formulas
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-foreground uppercase tracking-wider">
            spreadsheet formulas
          </h2>
          <p className="text-secondary text-sm">
            cells starting with <span className="text-accent">=</span> are
            evaluated as formulas. supports cell references (A1), ranges
            (A1:A5), and cross-note references (=@slug#Sheet.A1).
          </p>
          <div className="border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left px-4 py-2 font-medium text-foreground">
                    category
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-foreground">
                    functions
                  </th>
                </tr>
              </thead>
              <tbody className="text-secondary">
                <tr className="border-b border-border">
                  <td className="px-4 py-2 text-foreground">math</td>
                  <td className="px-4 py-2">
                    <span className="text-accent">SUM</span>,{" "}
                    <span className="text-accent">AVG</span>,{" "}
                    <span className="text-accent">AVERAGE</span>,{" "}
                    <span className="text-accent">COUNT</span>,{" "}
                    <span className="text-accent">MIN</span>,{" "}
                    <span className="text-accent">MAX</span>,{" "}
                    <span className="text-accent">ABS</span>,{" "}
                    <span className="text-accent">ROUND</span>,{" "}
                    <span className="text-accent">CEIL</span>,{" "}
                    <span className="text-accent">FLOOR</span>,{" "}
                    <span className="text-accent">POW</span>,{" "}
                    <span className="text-accent">SQRT</span>,{" "}
                    <span className="text-accent">MOD</span>,{" "}
                    <span className="text-accent">INT</span>
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2 text-foreground">logic</td>
                  <td className="px-4 py-2">
                    <span className="text-accent">IF</span>,{" "}
                    <span className="text-accent">AND</span>,{" "}
                    <span className="text-accent">OR</span>,{" "}
                    <span className="text-accent">NOT</span>
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2 text-foreground">text</td>
                  <td className="px-4 py-2">
                    <span className="text-accent">CONCAT</span>,{" "}
                    <span className="text-accent">LEN</span>,{" "}
                    <span className="text-accent">UPPER</span>,{" "}
                    <span className="text-accent">LOWER</span>
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2 text-foreground">date</td>
                  <td className="px-4 py-2">
                    <span className="text-accent">NOW</span>,{" "}
                    <span className="text-accent">TODAY</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-foreground">operators</td>
                  <td className="px-4 py-2">
                    <span className="text-accent">+</span>{" "}
                    <span className="text-accent">-</span>{" "}
                    <span className="text-accent">*</span>{" "}
                    <span className="text-accent">/</span>{" "}
                    <span className="text-accent">%</span>{" "}
                    <span className="text-accent">^</span>{" "}
                    <span className="text-accent">&gt;</span>{" "}
                    <span className="text-accent">&lt;</span>{" "}
                    <span className="text-accent">&gt;=</span>{" "}
                    <span className="text-accent">&lt;=</span>{" "}
                    <span className="text-accent">==</span>{" "}
                    <span className="text-accent">!=</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
