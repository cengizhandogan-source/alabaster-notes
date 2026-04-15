import { createClient } from "@/lib/supabase/server"
import { getJiraToken, searchIssues } from "@/lib/jira/client"

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 })

  const jira = await getJiraToken(user.id)
  if (!jira) return Response.json({ error: "Jira not connected" }, { status: 400 })

  const url = new URL(request.url)
  const text = url.searchParams.get("text") || ""

  // Build JQL: search by key match or text in summary
  const jql = text.match(/^[A-Z][A-Z0-9]+-\d+$/)
    ? `key = "${text}" ORDER BY updated DESC`
    : `summary ~ "${text}" ORDER BY updated DESC`

  try {
    const result = await searchIssues(jira.token, jira.cloudId, jql)

    return Response.json(
      result.issues.map((issue: { key: string; fields: { summary: string; status: { name: string; statusCategory: { colorName: string } }; assignee: { displayName: string } | null; priority: { name: string } | null; issuetype: { name: string } | null } }) => ({
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status?.name,
        assignee: issue.fields.assignee?.displayName || null,
        priority: issue.fields.priority?.name || null,
        issueType: issue.fields.issuetype?.name || null,
      }))
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed"
    return Response.json({ error: message }, { status: 500 })
  }
}
