-- 1. Création de la table pending_songs
CREATE TABLE IF NOT EXISTS pending_songs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  year INTEGER,
  dateAdded TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  color TEXT,
  spotify TEXT,
  danceVideo TEXT,
  audioUrl TEXT,
  culture JSONB DEFAULT '{}'::jsonb,
  culture_en JSONB DEFAULT '{}'::jsonb,
  lyrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_by TEXT NOT NULL
);

-- Activation du RLS
ALTER TABLE pending_songs ENABLE ROW LEVEL SECURITY;

-- 2. Politiques de sécurité (RLS)
-- Les utilisateurs connectés peuvent insérer dans la table pending_songs
CREATE POLICY "Authenticated users can insert pending songs" ON pending_songs FOR INSERT TO authenticated WITH CHECK (
  auth.email() = submitted_by
);

-- L'administrateur (Maximilien) peut lire et supprimer les chansons en attente
CREATE POLICY "Admin can view pending songs" ON pending_songs FOR SELECT USING (
  auth.email() = 'maximilien.godeau.off@gmail.com'
);

CREATE POLICY "Admin can delete pending songs" ON pending_songs FOR DELETE USING (
  auth.email() = 'maximilien.godeau.off@gmail.com'
);
