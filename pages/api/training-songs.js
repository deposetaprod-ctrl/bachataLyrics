export default async function handler(req, res) {
  const { type, term } = req.query;
  
  // Map to clear pillars
  const typeSearch = {
    sensual: {
      term: 'bachata sensual prince royce romeo santos aventura',
      exclude: ['antony santos', 'luis vargas', 'raulin rodriguez', 'tradicional']
    },
    dominican: {
      term: 'bachata tradicional antony santos raulin rodriguez luis vargas',
      exclude: ['remix', 'sensual', 'dj cat']
    },
    bachata: {
      term: 'bachata',
      exclude: []
    }
  };

  let config;
  if (type === 'search' && term) {
    config = { term: `bachata ${term}`, exclude: [] };
  } else {
    config = typeSearch[type] || typeSearch.bachata;
  }

  try {
    const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(config.term)}&media=music&entity=song&limit=200`);
    
    if (!response.ok) {
      throw new Error(`iTunes API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Filtering logic to increase accuracy
    const filtered = data.results.filter(song => {
      if (!song.previewUrl) return false;
      
      const artist = (song.artistName || '').toLowerCase();
      const track = (song.trackName || '').toLowerCase();
      
      // Check exclusions for this type
      const isExcluded = config.exclude.some(ex => 
        artist.includes(ex) || track.includes(ex)
      );
      
      return !isExcluded;
    });
    
    res.status(200).json({ results: filtered });
  } catch (error) {
    console.error('iTunes Proxy Error:', error);
    res.status(500).json({ error: 'Failed to fetch songs from iTunes' });
  }
}
