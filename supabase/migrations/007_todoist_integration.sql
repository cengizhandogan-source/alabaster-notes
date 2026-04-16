-- Todoist OAuth connection (one per user)
CREATE TABLE todoist_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  todoist_user_id TEXT NOT NULL,
  email TEXT,
  display_name TEXT NOT NULL,
  access_token TEXT NOT NULL,
  scopes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE todoist_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own todoist connection"
  ON todoist_connections FOR ALL
  USING (user_id = auth.uid());
