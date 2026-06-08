-- Run this in your Supabase SQL Editor

-- 1. Create the sessions table
CREATE TABLE tracking_sessions (
  session_id TEXT PRIMARY KEY,
  user_agent TEXT,
  first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create the events table
CREATE TABLE tracking_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT REFERENCES tracking_sessions(session_id) ON DELETE CASCADE,
  type TEXT,
  data JSONB,
  url TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. (Optional) Disable Row Level Security if you don't need it 
-- Since your inserts happen on the server side via the API, it's safe to disable it.
ALTER TABLE tracking_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_events DISABLE ROW LEVEL SECURITY;
