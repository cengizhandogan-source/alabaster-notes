-- Note key sequence (per-user auto-increment)
CREATE TABLE note_key_sequences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_value INTEGER DEFAULT 0
);
ALTER TABLE note_key_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sequence" ON note_key_sequences
  FOR ALL USING (user_id = auth.uid());

-- Add note_key to notes
ALTER TABLE notes ADD COLUMN note_key TEXT;
CREATE UNIQUE INDEX idx_notes_user_note_key ON notes(user_id, note_key);

-- Trigger to auto-generate note keys on insert
CREATE OR REPLACE FUNCTION generate_note_key()
RETURNS TRIGGER AS $$
DECLARE
  next_val INTEGER;
BEGIN
  INSERT INTO note_key_sequences (user_id, current_value)
  VALUES (NEW.user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE note_key_sequences
  SET current_value = current_value + 1
  WHERE user_id = NEW.user_id
  RETURNING current_value INTO next_val;

  NEW.note_key := 'AN-' || next_val;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_note_key
BEFORE INSERT ON notes
FOR EACH ROW
WHEN (NEW.note_key IS NULL)
EXECUTE FUNCTION generate_note_key();

-- Backfill existing notes with sequential keys
WITH numbered AS (
  SELECT id, user_id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) AS rn
  FROM notes
  WHERE note_key IS NULL
)
UPDATE notes
SET note_key = 'AN-' || numbered.rn
FROM numbered
WHERE notes.id = numbered.id;

-- Update sequences to reflect backfilled values
INSERT INTO note_key_sequences (user_id, current_value)
SELECT user_id, COUNT(*)
FROM notes
GROUP BY user_id
ON CONFLICT (user_id) DO UPDATE
SET current_value = EXCLUDED.current_value;

-- GitHub OAuth connections (one per user)
CREATE TABLE github_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  github_user_id BIGINT NOT NULL,
  github_username TEXT NOT NULL,
  access_token TEXT NOT NULL,
  scopes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE github_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own github connection" ON github_connections
  FOR ALL USING (user_id = auth.uid());

-- Repositories enabled for linking
CREATE TABLE github_repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  github_repo_id BIGINT NOT NULL,
  owner TEXT NOT NULL,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  default_branch TEXT DEFAULT 'main',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, github_repo_id)
);
ALTER TABLE github_repositories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own repositories" ON github_repositories
  FOR ALL USING (user_id = auth.uid());

-- Links between notes/folders and GitHub entities
CREATE TABLE github_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  repo_id UUID NOT NULL REFERENCES github_repositories(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_ref TEXT NOT NULL,
  entity_title TEXT,
  entity_url TEXT,
  entity_state TEXT,
  entity_author TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CHECK (
    (note_id IS NOT NULL AND folder_id IS NULL) OR
    (note_id IS NULL AND folder_id IS NOT NULL)
  )
);
ALTER TABLE github_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own github links" ON github_links
  FOR ALL USING (user_id = auth.uid());

CREATE INDEX idx_github_links_note ON github_links(note_id);
CREATE INDEX idx_github_links_folder ON github_links(folder_id);
