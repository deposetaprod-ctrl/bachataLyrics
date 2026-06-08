import fs from 'fs';
import path from 'path';

// Set standard password if not provided in env. For production, ALWAYS use env var!
const DASHBOARD_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Basic password check using an Authorization header or query param
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${DASHBOARD_PASSWORD}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const filePath = path.join(process.cwd(), 'data', 'tracking.json');
    let trackingData = {};

    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      if (fileContent) {
        trackingData = JSON.parse(fileContent);
      }
    }

    // Convert object to array and sort by most recent
    const sessions = Object.values(trackingData).sort((a, b) => {
      return new Date(b.lastSeen) - new Date(a.lastSeen);
    });

    return res.status(200).json({ sessions });
  } catch (error) {
    console.error('Failed to read tracking data', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
