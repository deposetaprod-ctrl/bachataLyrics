import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Initialize Supabase client only if keys are present
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Set standard password if not provided in env. For production, ALWAYS use env var!
const DASHBOARD_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Basic password check using an Authorization header or query param
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${DASHBOARD_PASSWORD}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!supabase) {
    return res.status(500).json({ message: 'Database not configured' });
  }

  try {
    const { data: sessionsData, error } = await supabase
      .from('tracking_sessions')
      .select(`
        session_id,
        first_seen,
        last_seen,
        user_agent,
        tracking_events (
          id,
          type,
          data,
          url,
          timestamp
        )
      `)
      .order('last_seen', { ascending: false });

    if (error) throw error;

    // Format data to match what the frontend expects
    const formattedSessions = sessionsData.map(session => ({
      sessionId: session.session_id,
      firstSeen: session.first_seen,
      lastSeen: session.last_seen,
      userAgent: session.user_agent,
      // Sort events chronologically
      events: (session.tracking_events || []).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    }));

    return res.status(200).json({ sessions: formattedSessions });
  } catch (error) {
    console.error('Failed to read tracking data from Supabase', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
