export default async function handler(req, res) {
  try {
    const response = await fetch('https://itunes.apple.com/search?term=bachata&media=music&entity=song&limit=100');
    
    if (!response.ok) {
      throw new Error(`iTunes API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Filter to ensure we have preview URLs
    const filtered = data.results.filter(song => song.previewUrl);
    
    res.status(200).json({ results: filtered });
  } catch (error) {
    console.error('iTunes Proxy Error:', error);
    res.status(500).json({ error: 'Failed to fetch songs from iTunes' });
  }
}
