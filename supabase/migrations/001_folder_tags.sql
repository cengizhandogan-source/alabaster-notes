CREATE TABLE folder_tags (
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (folder_id, tag_id)
);

ALTER TABLE folder_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own folder tags"
ON folder_tags FOR ALL
USING (
  folder_id IN (SELECT id FROM folders WHERE user_id = auth.uid())
);
