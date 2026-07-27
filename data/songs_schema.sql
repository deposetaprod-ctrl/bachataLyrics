-- 1. Création de la table des chansons
CREATE TABLE IF NOT EXISTS songs (
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
  created_by TEXT
);

-- Activation du RLS pour les chansons
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Politiques pour les chansons : tout le monde peut lire les chansons (utilisé sur le site)
CREATE POLICY "Public can view songs" ON songs FOR SELECT USING (true);

-- Seul l'administrateur (Maximilien) peut insérer/modifier/supprimer
CREATE POLICY "Admin can insert songs" ON songs FOR INSERT WITH CHECK (
  auth.email() = 'maximilien.godeau.off@gmail.com'
);

CREATE POLICY "Admin can update songs" ON songs FOR UPDATE USING (
  auth.email() = 'maximilien.godeau.off@gmail.com'
);

CREATE POLICY "Admin can delete songs" ON songs FOR DELETE USING (
  auth.email() = 'maximilien.godeau.off@gmail.com'
);
