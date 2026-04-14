import { createClient } from "@/lib/supabase/server"

const GITHUB_API = "https://api.github.com"

async function githubFetch(token: string, endpoint: string, options?: RequestInit) {
  const res = await fetch(`${GITHUB_API}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`GitHub API ${res.status}: ${body}`)
  }

  return res.json()
}

export async function getGithubToken(userId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("github_connections")
    .select("access_token")
    .eq("user_id", userId)
    .single()

  return data?.access_token ?? null
}

export async function getGithubConnection(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("github_connections")
    .select("id, user_id, github_user_id, github_username, scopes, created_at, updated_at")
    .eq("user_id", userId)
    .single()

  return data
}

export function listRepos(token: string) {
  return githubFetch(token, "/user/repos?sort=updated&per_page=100&type=all")
}

export function listBranches(token: string, owner: string, repo: string) {
  return githubFetch(token, `/repos/${owner}/${repo}/branches?per_page=100`)
}

export function listPullRequests(token: string, owner: string, repo: string, state = "all") {
  return githubFetch(token, `/repos/${owner}/${repo}/pulls?state=${state}&per_page=50&sort=updated`)
}

export function listCommits(token: string, owner: string, repo: string, branch?: string) {
  const params = branch ? `?sha=${branch}&per_page=30` : "?per_page=30"
  return githubFetch(token, `/repos/${owner}/${repo}/commits${params}`)
}

export function getGithubUser(token: string) {
  return githubFetch(token, "/user")
}

export async function createBranch(token: string, owner: string, repo: string, baseBranch: string, newBranchName: string) {
  const ref = await githubFetch(token, `/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`)
  const sha = ref.object.sha
  const result = await githubFetch(token, `/repos/${owner}/${repo}/git/refs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ref: `refs/heads/${newBranchName}`, sha }),
  })
  return { name: newBranchName, url: `https://github.com/${owner}/${repo}/tree/${newBranchName}`, sha: result.object.sha }
}
