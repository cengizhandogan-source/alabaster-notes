-- Share notes as read-only public URLs

CREATE TABLE note_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(note_id)
);

ALTER TABLE note_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_all" ON note_shares
  FOR ALL USING (user_id = auth.uid());

-- SECURITY DEFINER function: lets unauthenticated callers fetch a note by token
CREATE OR REPLACE FUNCTION get_shared_note(p_token TEXT)
RETURNS TABLE(title TEXT, content TEXT, updated_at TIMESTAMPTZ) AS $$
  SELECT n.title, n.content, n.updated_at
  FROM notes n
  INNER JOIN note_shares s ON s.note_id = n.id
  WHERE s.share_token = p_token
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE INDEX idx_note_shares_token ON note_shares(share_token);
