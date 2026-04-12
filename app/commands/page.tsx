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
                <tr>
                  <td className="px-4 py-2 text-accent">/codeblock</td>
                  <td className="px-4 py-2">fenced code block</td>
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
                <tr>
                  <td className="px-4 py-2 text-accent">@note-slug</td>
                  <td className="px-4 py-2">
                    link to another note by its slug
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
