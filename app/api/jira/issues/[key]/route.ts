import { createClient } from "@/lib/supabase/server"
import { getJiraToken, getIssue } from "@/lib/jira/client"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 })

  const jira = await getJiraToken(user.id)
  if (!jira) return Response.json({ error: "Jira not connected" }, { status: 400 })

  const { key } = await params

  try {
    const issue = await getIssue(jira.token, jira.cloudId, key)

    const { data: conn } = await supabase
      .from("jira_connections")
      .select("cloud_name")
      .eq("user_id", user.id)
      .single()

    return Response.json({
      key: issue.key,
      summary: issue.fields.summary,
      status: {
        name: issue.fields.status?.name,
        categoryColor: issue.fields.status?.statusCategory?.colorName,
      },
      assignee: issue.fields.assignee
        ? {
            displayName: issue.fields.assignee.displayName,
            avatarUrl: issue.fields.assignee.avatarUrls?.["24x24"],
          }
        : null,
      priority: issue.fields.priority
        ? {
            name: issue.fields.priority.name,
            iconUrl: issue.fields.priority.iconUrl,
          }
        : null,
      issueType: issue.fields.issuetype
        ? {
            name: issue.fields.issuetype.name,
            iconUrl: issue.fields.issuetype.iconUrl,
          }
        : null,
      url: `https://${conn?.cloud_name || "unknown"}.atlassian.net/browse/${issue.key}`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch issue"
    const status = message.includes("404") ? 404 : 500
    return Response.json({ error: message }, { status })
  }
}
