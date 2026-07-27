import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { title, artist, year, color, danceVideo, spotify, lyricsEs } = req.body;

  if (!title || !artist || !lyricsEs) {
    return res.status(400).json({ error: 'Titre, artiste et paroles en espagnol sont requis.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Clé API Gemini non configurée sur le serveur.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
Tu es un expert en musique Bachata. Je vais te donner les informations de base d'une chanson et ses paroles en espagnol.
Tu dois générer un objet JSON avec la traduction des paroles (en français et anglais, en respectant parfaitement la structure ligne par ligne de la VO), un contexte culturel et la signification de la chanson (en français et anglais), et 3 tags pertinents (en français).

Informations:
Titre: ${title}
Artiste: ${artist}
Année: ${year || 'Inconnue'}

Paroles originales (Espagnol):
${lyricsEs}

Renvoie UNIQUEMENT un objet JSON valide avec la structure suivante, sans markdown ni texte autour :
{
  "tags": ["Tag1", "Tag2", "Tag3"],
  "culture": {
    "context": "Contexte de création/sortie de la chanson en français...",
    "meaning": "Signification des paroles en français...",
    "artistInfo": "Brève info sur l'artiste en français...",
    "album": "Nom de l'album ou Single"
  },
  "culture_en": {
    "context": "Context of the song creation/release in English...",
    "meaning": "Meaning of the lyrics in English...",
    "artistInfo": "Brief artist info in English...",
    "album": "Album name or Single"
  },
  "lyrics": {
    "es": "Paroles originales avec les balises [Verso 1], [Coro], etc.",
    "fr": "Traduction française alignée ligne par ligne avec l'espagnol",
    "en": "English translation aligned line by line with Spanish"
  }
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Nettoyer le texte si le LLM renvoie des backticks markdown (ex: ```json ... ```)
    let jsonStr = text.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.substring(7);
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.substring(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }

    const generatedData = JSON.parse(jsonStr.trim());

    // Générer un ID unique (slug)
    const id = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${artist.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`.replace(/^-|-$/g, '');

    const finalSong = {
      id,
      title,
      artist,
      year: year ? parseInt(year, 10) : new Date().getFullYear(),
      dateAdded: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      tags: generatedData.tags || [],
      color: color || '#64748b',
      spotify: spotify || '',
      danceVideo: danceVideo || '',
      culture: generatedData.culture || {},
      culture_en: generatedData.culture_en || {},
      lyrics: generatedData.lyrics || { es: lyricsEs, fr: '', en: '' }
    };

    return res.status(200).json(finalSong);
  } catch (error) {
    console.error('Erreur lors de la génération avec Gemini:', error);
    return res.status(500).json({ error: 'Erreur lors de la génération avec l\'IA.' });
  }
}
