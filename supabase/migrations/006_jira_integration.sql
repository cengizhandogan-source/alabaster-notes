-- Jira OAuth connection (one per user)
CREATE TABLE jira_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  atlassian_account_id TEXT NOT NULL,
  email TEXT,
  display_name TEXT NOT NULL,
  cloud_id TEXT NOT NULL,
  cloud_name TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  scopes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE jira_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own jira connection"
  ON jira_connections FOR ALL
  USING (user_id = auth.uid());
