-- Exécuter ce script dans l'éditeur SQL de Supabase pour créer les tables de la Dance Academy

-- 1. Création de la table des notes (Trucs à améliorer)
CREATE TABLE IF NOT EXISTS academy_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activation du RLS pour les notes
ALTER TABLE academy_notes ENABLE ROW LEVEL SECURITY;

-- Politiques pour les notes : chaque utilisateur ne peut voir, créer, modifier ou supprimer que ses propres notes
CREATE POLICY "Users can view their own notes" ON academy_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notes" ON academy_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notes" ON academy_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notes" ON academy_notes FOR DELETE USING (auth.uid() = user_id);

-- 2. Création de la table des objectifs (Todo list)
CREATE TABLE IF NOT EXISTS academy_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  footwork TEXT,
  song_id TEXT,
  couple_move TEXT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activation du RLS pour les objectifs
ALTER TABLE academy_objectives ENABLE ROW LEVEL SECURITY;

-- Politiques pour les objectifs : chaque utilisateur ne peut gérer que ses propres objectifs
CREATE POLICY "Users can view their own objectives" ON academy_objectives FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own objectives" ON academy_objectives FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own objectives" ON academy_objectives FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own objectives" ON academy_objectives FOR DELETE USING (auth.uid() = user_id);
