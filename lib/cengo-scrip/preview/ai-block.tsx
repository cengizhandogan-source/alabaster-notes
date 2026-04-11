"use client"

import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import { aiCache, fetchAiResponse } from "../utils/ai-cache"
import { expandTableCommands } from "../utils/table-generator"

export function AiBlock({ prompt }: { prompt: string }) {
  const trimmed = prompt.trim()
  const [response, setResponse] = useState<string | null>(aiCache.get(trimmed) ?? null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!trimmed || aiCache.has(trimmed)) return

    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const result = await fetchAiResponse(trimmed)
        if (!cancelled) setResponse(result)
      } catch {
        if (!cancelled) setError(true)
      }
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [trimmed])

  if (error) {
    return (
      <div className="ai-response ai-error">
        <span className="ai-label">ai error</span>
        <p>failed to generate response</p>
      </div>
    )
  }

  if (response === null) {
    return (
      <div className="ai-response">
        <span className="ai-label">ai: {trimmed}</span>
        <p className="ai-loading">generating...</p>
      </div>
    )
  }

  const processed = expandTableCommands(response)

  return (
    <div className="ai-response">
      <span className="ai-label">ai: {trimmed}</span>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {processed}
      </ReactMarkdown>
    </div>
  )
}
