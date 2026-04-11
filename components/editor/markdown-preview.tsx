"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import { preprocessCengoScrip, AiBlock } from "@/lib/cengo-scrip"
import type { NoteRef } from "@/lib/cengo-scrip/utils/slugify"

export function MarkdownPreview({ content, notes }: { content: string; notes?: NoteRef[] }) {
  if (!content) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted text-sm">nothing to preview</p>
      </div>
    )
  }

  const processed = preprocessCengoScrip(content, notes)

  return (
    <div className="flex-1 overflow-auto p-4">
      <article className="markdown-body max-w-none font-mono text-sm text-foreground">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            code({ className, children }) {
              if (className === "language-cengo-ai") {
                return <AiBlock prompt={String(children)} />
              }
              return <code className={className}>{children}</code>
            },
          }}
        >
          {processed}
        </ReactMarkdown>
      </article>
    </div>
  )
}
