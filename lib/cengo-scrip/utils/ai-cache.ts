export const aiCache = new Map<string, string>()

export async function fetchAiResponse(prompt: string): Promise<string> {
  const trimmed = prompt.trim()
  const cached = aiCache.get(trimmed)
  if (cached) return cached

  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: trimmed }),
  })
  if (!res.ok) throw new Error("AI request failed")
  const data = await res.json()
  aiCache.set(trimmed, data.response)
  return data.response
}
