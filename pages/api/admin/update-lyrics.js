import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Basic security: only allow in development
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Cet outil est désactivé en production.' });
  }

  const { songId, lang, newLyrics } = req.body;

  if (!songId || !lang || typeof newLyrics !== 'string') {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const filePath = path.join(process.cwd(), 'data', 'songs.js');
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Find the song object by id
    const songIdPattern = `id: "${songId}"`;
    const songIndex = content.indexOf(songIdPattern);
    
    if (songIndex === -1) {
      return res.status(404).json({ error: 'Song not found in data/songs.js' });
    }

    // 2. Find the lyrics block within this song
    const lyricsKeyword = 'lyrics: {';
    const lyricsIndex = content.indexOf(lyricsKeyword, songIndex);
    
    if (lyricsIndex === -1) {
      return res.status(404).json({ error: 'Lyrics block not found for this song' });
    }

    // 3. Find the language key (e.g., "es: `")
    const langKey = `${lang}: \``;
    const langIndex = content.indexOf(langKey, lyricsIndex);
    
    if (langIndex === -1) {
      // If the language doesn't exist, we could inject it, but for safety let's return error
      return res.status(404).json({ error: `Language ${lang} not found for this song` });
    }

    const contentStart = langIndex + langKey.length;
    
    // 4. Find the closing backtick
    let contentEnd = contentStart;
    while (contentEnd < content.length) {
      // We look for a backtick that is NOT escaped
      if (content[contentEnd] === '`' && content[contentEnd - 1] !== '\\') {
        break;
      }
      contentEnd++;
    }

    // 5. Build the new content
    const before = content.slice(0, contentStart);
    const after = content.slice(contentEnd);
    
    // Escape any backticks or template variables in the user's new lyrics 
    // to avoid breaking the JS file syntax
    const safeLyrics = newLyrics
      .replace(/\\/g, '\\\\') // Escape existing backslashes first
      .replace(/`/g, '\\`') // Escape backticks
      .replace(/\$\{/g, '\\${'); // Escape template literals interpolation

    const newContent = before + safeLyrics + after;

    // 6. Write back to file
    fs.writeFileSync(filePath, newContent, 'utf8');

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Error updating lyrics:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
