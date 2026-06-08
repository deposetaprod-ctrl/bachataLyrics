-- Run this in your Supabase SQL Editor to fix RLS issues

-- Disable RLS on both tracking tables
ALTER TABLE tracking_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_events DISABLE ROW LEVEL SECURITY;

-- Grant full access to the anon role (belt and suspenders)
GRANT ALL ON tracking_sessions TO anon;
GRANT ALL ON tracking_events TO anon;
GRANT ALL ON tracking_sessions TO authenticated;
GRANT ALL ON tracking_events TO authenticated;
