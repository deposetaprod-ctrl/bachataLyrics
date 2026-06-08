import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Initialize Supabase client only if keys are present
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  if (!supabase) {
    console.error('Supabase credentials missing');
    return res.status(500).json({ message: 'Database not configured' });
  }

  try {
    const { sessionId, type, data, timestamp, url, userAgent } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: 'Missing sessionId' });
    }

    // 1. Upsert session (creates it if it doesn't exist, updates last_seen if it does)
    const { error: sessionError } = await supabase
      .from('tracking_sessions')
      .upsert(
        { 
          session_id: sessionId, 
          user_agent: userAgent,
          last_seen: timestamp 
        }, 
        { onConflict: 'session_id' }
      );

    if (sessionError) throw sessionError;

    // 2. Insert the specific event
    const { error: eventError } = await supabase
      .from('tracking_events')
      .insert({
        session_id: sessionId,
        type,
        data,
        url,
        timestamp
      });

    if (eventError) throw eventError;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Failed to save tracking event to Supabase:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
