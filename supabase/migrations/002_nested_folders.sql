-- Add parent_id for nested folders
ALTER TABLE folders ADD COLUMN parent_id UUID REFERENCES folders(id) ON DELETE SET NULL;

-- Add position for ordering
ALTER TABLE folders ADD COLUMN position INTEGER NOT NULL DEFAULT 0;
ALTER TABLE notes ADD COLUMN position INTEGER NOT NULL DEFAULT 0;

-- Indexes for efficient queries
CREATE INDEX idx_folders_parent_id ON folders(parent_id);
CREATE INDEX idx_folders_position ON folders(user_id, parent_id, position);
CREATE INDEX idx_notes_position ON notes(user_id, folder_id, position);

-- Backfill positions from current sort order
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY name) * 1000 AS pos
  FROM folders
)
UPDATE folders SET position = numbered.pos FROM numbered WHERE folders.id = numbered.id;

WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, folder_id ORDER BY updated_at DESC) * 1000 AS pos
  FROM notes
)
UPDATE notes SET position = numbered.pos FROM numbered WHERE notes.id = numbered.id;
