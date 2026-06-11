import Link from 'next/link';
import { useRouter } from 'next/router';
import { songs } from '../data/songs';

/**
 * RelatedSongs — Composant de maillage interne SEO.
 * Affiche les chansons du même artiste et des suggestions similaires (par tags).
 * Chaque lien est un <Link> Next.js qui crée un lien interne crawlable par Google.
 */
export default function RelatedSongs({ currentSong }) {
  const router = useRouter();
  const { locale } = router || { locale: 'fr' };

  // ── Songs from the same artist ──
  const sameArtistSongs = songs
    .filter(s => s.artist === currentSong.artist && s.id !== currentSong.id)
    .slice(0, 6);

  // ── Songs with similar tags (excluding same artist to avoid duplicates) ──
  const currentTags = new Set(currentSong.tags);
  const similarSongs = songs
    .filter(s => s.id !== currentSong.id && s.artist !== currentSong.artist)
    .map(s => ({
      ...s,
      matchCount: s.tags.filter(tag => currentTags.has(tag)).length,
    }))
    .filter(s => s.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, 6);

  if (sameArtistSongs.length === 0 && similarSongs.length === 0) return null;

  return (
    <div className="related-songs-section">
      {sameArtistSongs.length > 0 && (
        <div className="related-block">
          <h2 className="related-heading">
            <span className="related-icon">🎤</span>
            {locale === 'en'
              ? `More by ${currentSong.artist}`
              : `Autres chansons de ${currentSong.artist}`}
          </h2>
          <div className="related-grid">
            {sameArtistSongs.map(song => (
              <Link key={song.id} href={`/song/${song.id}`} className="related-card hover-scale">
                <div className="related-card-accent" style={{ background: song.color }} />
                <div className="related-card-body">
                  <span className="related-card-title">{song.title}</span>
                  <span className="related-card-year">{song.year}</span>
                </div>
                <div className="related-card-tags">
                  {song.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="related-tag">#{tag}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {similarSongs.length > 0 && (
        <div className="related-block">
          <h2 className="related-heading">
            <span className="related-icon">✨</span>
            {locale === 'en' ? 'Similar vibes' : 'Dans la même vibe'}
          </h2>
          <div className="related-grid">
            {similarSongs.map(song => (
              <Link key={song.id} href={`/song/${song.id}`} className="related-card hover-scale">
                <div className="related-card-accent" style={{ background: song.color }} />
                <div className="related-card-body">
                  <span className="related-card-title">{song.title}</span>
                  <span className="related-card-meta">{song.artist} · {song.year}</span>
                </div>
                <div className="related-card-tags">
                  {song.tags.filter(tag => currentTags.has(tag)).slice(0, 2).map(tag => (
                    <span key={tag} className="related-tag matching">#{tag}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .related-songs-section {
          margin-top: 64px;
          padding: 0 24px;
          max-width: 1280px;
          margin-left: auto;
          margin-right: auto;
        }
        .related-block {
          margin-bottom: 48px;
        }
        .related-heading {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 1.4rem;
          font-weight: 800;
          margin-bottom: 24px;
          color: #e2e8f0;
        }
        .related-icon {
          font-size: 1.6rem;
        }
        .related-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
        }
        .related-card {
          display: flex;
          flex-direction: column;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 16px;
          text-decoration: none;
          color: inherit;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .related-card:hover {
          border-color: rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.06);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        .related-card-accent {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
          border-radius: 16px 16px 0 0;
        }
        .related-card-body {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 4px;
        }
        .related-card-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.1rem;
          font-weight: 700;
          color: #f0f0f8;
          line-height: 1.3;
        }
        .related-card-year {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.4);
          font-weight: 500;
        }
        .related-card-meta {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
          font-weight: 500;
        }
        .related-card-tags {
          display: flex;
          gap: 6px;
          margin-top: 12px;
          flex-wrap: wrap;
        }
        .related-tag {
          font-size: 0.7rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.4);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 2px 10px;
          border-radius: 999px;
        }
        .related-tag.matching {
          color: #a78bfa;
          background: rgba(167, 139, 250, 0.1);
          border-color: rgba(167, 139, 250, 0.25);
        }
        @media (max-width: 640px) {
          .related-grid {
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }
          .related-heading {
            font-size: 1.2rem;
          }
        }
      `}</style>
    </div>
  );
}
