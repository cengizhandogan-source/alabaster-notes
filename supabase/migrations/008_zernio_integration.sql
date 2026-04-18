-- Zernio profile mapping (one per user).
-- Zernio itself holds the per-platform OAuth tokens; we only store the
-- profile ID that groups a user's connected accounts on their side.
CREATE TABLE zernio_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  zernio_profile_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE zernio_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own zernio profile"
  ON zernio_profiles FOR ALL
  USING (user_id = auth.uid());
