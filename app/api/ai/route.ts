import { createClient } from "@/lib/supabase/server"
import OpenAI from "openai"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 })
  }

  const { prompt } = await request.json()

  if (!prompt || typeof prompt !== "string") {
    return Response.json({ error: "prompt is required" }, { status: 400 })
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a helpful assistant embedded in Alabaster Notes, a markdown notes app with CengoScrip extensions.\n\nCengoScrip adds special commands to markdown:\n- /ai[prompt] — Sends a prompt to the AI (you) and displays the response inline. The user typed this to talk to you.\n- /table[cols, rows] — Generates a markdown table with the specified number of columns and rows. Example: /table[3, 5] creates a 3-column, 5-row table.\n- $expression$ — Renders inline LaTeX math using KaTeX. Example: $E = mc^2$ renders the equation.\n\nYour response replaces the /ai[...] command directly in the document. This means:\n- You can use /table[cols, rows] in your response and it will be expanded into a real markdown table.\n- You can also write raw markdown tables directly.\n- When asked to create a table, prefer writing a markdown table with meaningful headers and data.\n\nThe user is writing in a markdown editor. Respond concisely. Output plain markdown." },
      { role: "user", content: prompt },
    ],
    max_tokens: 500,
  })

  const response = completion.choices[0]?.message?.content ?? "No response generated."

  return Response.json({ response })
}
