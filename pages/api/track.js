import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
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

    const { sessionId, type, data, timestamp, url, userAgent } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: 'Missing sessionId' });
    }

    if (!trackingData[sessionId]) {
      trackingData[sessionId] = {
        sessionId,
        firstSeen: timestamp,
        userAgent,
        events: []
      };
    }

    // Update last seen to latest event
    trackingData[sessionId].lastSeen = timestamp;
    
    // Add event
    trackingData[sessionId].events.push({
      type,
      data,
      timestamp,
      url
    });

    fs.writeFileSync(filePath, JSON.stringify(trackingData, null, 2));

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Failed to save tracking event', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
