import { createClient } from "@/lib/supabase/server"

const ATLASSIAN_API = "https://api.atlassian.com"

async function jiraFetch(token: string, cloudId: string, endpoint: string, options?: RequestInit) {
  const res = await fetch(`${ATLASSIAN_API}/ex/jira/${cloudId}/rest/api/3${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Jira API ${res.status}: ${body}`)
  }

  return res.json()
}

export async function getJiraToken(userId: string): Promise<{ token: string; cloudId: string } | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("jira_connections")
    .select("access_token, refresh_token, token_expires_at, cloud_id")
    .eq("user_id", userId)
    .single()

  if (!data) return null

  // Check if token is expired or will expire within 5 minutes
  const expiresAt = new Date(data.token_expires_at).getTime()
  const buffer = 5 * 60 * 1000
  if (Date.now() + buffer < expiresAt) {
    return { token: data.access_token, cloudId: data.cloud_id }
  }

  // Refresh the token
  const clientId = process.env.JIRA_CLIENT_ID
  const clientSecret = process.env.JIRA_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error("Jira not configured")
  }

  const res = await fetch("https://auth.atlassian.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: data.refresh_token,
    }),
  })

  if (!res.ok) {
    // Refresh token is invalid — user needs to re-authenticate
    return null
  }

  const tokenData = await res.json()
  const newExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()

  await supabase
    .from("jira_connections")
    .update({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expires_at: newExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)

  return { token: tokenData.access_token, cloudId: data.cloud_id }
}

export async function getJiraConnection(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("jira_connections")
    .select("id, user_id, atlassian_account_id, email, display_name, cloud_id, cloud_name, scopes, token_expires_at, created_at, updated_at")
    .eq("user_id", userId)
    .single()

  return data
}

export function getIssue(token: string, cloudId: string, issueKey: string) {
  return jiraFetch(token, cloudId, `/issue/${issueKey}?fields=summary,status,assignee,priority,issuetype`)
}

export function searchIssues(token: string, cloudId: string, jql: string, maxResults = 10) {
  const params = new URLSearchParams({
    jql,
    maxResults: String(maxResults),
    fields: "summary,status,assignee,priority,issuetype",
  })
  return jiraFetch(token, cloudId, `/search?${params}`)
}

export function getProjects(token: string, cloudId: string) {
  return jiraFetch(token, cloudId, "/project/search?maxResults=50")
}

export function getJiraUser(token: string) {
  return fetch(`${ATLASSIAN_API}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  }).then((res) => {
    if (!res.ok) throw new Error(`Atlassian user API ${res.status}`)
    return res.json()
  })
}
