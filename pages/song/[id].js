import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { songs } from '../../data/songs';
import { SpotifyIcon } from '../../components/SpotifyIcon';

export async function getStaticPaths() {
  const paths = songs.map((s) => ({ params: { id: s.id } }));
  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const song = songs.find((s) => s.id === params.id) || null;
  return { props: { song } };
}

export default function SongPage({ song }) {
  const router = useRouter();
  const [favoriteSongs, setFavoriteSongs] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('favSongs');
    if (saved) setFavoriteSongs(JSON.parse(saved));
  }, []);

  const toggleFav = (id, e) => {
    e.stopPropagation();
    const newFavs = favoriteSongs.includes(id) 
      ? favoriteSongs.filter(f => f !== id) 
      : [...favoriteSongs, id];
    setFavoriteSongs(newFavs);
    localStorage.setItem('favSongs', JSON.stringify(newFavs));
  };

  if (!song) return null;

  return (
    <>
      <Head>
        <title>{song.title} — {song.artist} | Bachata GANG</title>
        <meta
          name="description"
          content={`Paroles de ${song.title} par ${song.artist} en espagnol avec traduction française.`}
        />
      </Head>

      {/* ─── NAVBAR ─── */}
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="logo" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
            <div className="logo-icon">🎶</div>
            <span className="logo-text">Bachata GANG</span>
          </div>
          
          <div className="nav-links" style={{ display: 'flex', gap: '24px', fontWeight: 600, flex: 1, paddingLeft: '40px' }}>
            <span style={{ cursor: 'pointer', color: 'var(--accent)' }} onClick={() => router.push('/')}>Sons</span>
            <span style={{ cursor: 'pointer', color: 'var(--text-muted)', transition: 'color 0.2s' }} onClick={() => router.push('/passes')}>Passes</span>
          </div>
        </div>
      </nav>

      <div className="lyrics-page">
        {/* ─── HEADER ─── */}
        <div className="lyrics-header" style={{ position: 'relative' }}>
          <button 
            className={`favorite-btn ${favoriteSongs.includes(song.id) ? 'active' : ''}`}
            onClick={(e) => toggleFav(song.id, e)}
            aria-label="Ajouter aux favoris"
          >
            <span className="fav-icon">{favoriteSongs.includes(song.id) ? '♥' : '♡'}</span>
            {favoriteSongs.includes(song.id) ? 'Sauvegardé' : 'Ajouter'}
          </button>
          <button id="back-btn" className="back-btn" onClick={() => router.push('/')}>
            ← Retour au catalogue
          </button>

          <div className="lyrics-meta">
            <div>
              {/* Accent color bar */}
              <div
                style={{
                  width: 48,
                  height: 4,
                  borderRadius: 999,
                  background: song.color,
                  marginBottom: 16,
                }}
              />
              <h1 className="lyrics-title">{song.title}</h1>
              <div className="lyrics-artist-badge">
                <span
                  className="artist-dot"
                  style={{ background: song.color }}
                />
                <span>{song.artist}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>· {song.year}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
              <div className="lyrics-tags">
                {song.tags.map((tag) => (
                  <span key={tag} className="lyrics-tag">#{tag}</span>
                ))}
              </div>
              {song.spotify && (
                <a
                  id="spotify-btn"
                  href={song.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="spotify-listen-btn"
                >
                  <SpotifyIcon />
                  Écouter sur Spotify
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ─── DIVIDER ─── */}
        <div className="divider" />

        {/* ─── LYRICS ─── Interleaved ES/FR ─── */}
        <div className="lyrics-interleaved">
          {song.lyrics.es.split('\n').map((esLine, i) => {
            const frLines = song.lyrics.fr.split('\n');
            const frLine = frLines[i] || '';
            if (!esLine.trim() && !frLine.trim()) return <div key={i} style={{ height: '20px' }} />;
            return (
              <div key={i} className="lyric-pair">
                {esLine && <div className="lyric-es">{esLine}</div>}
                {frLine && <div className="lyric-fr">{frLine}</div>}
              </div>
            );
          })}
        </div>

        {/* ─── FOOTER ─── */}
        <footer className="footer">
          <p>Fait avec <span>♥</span> pour les amoureux de bachata · {new Date().getFullYear()}</p>
        </footer>
      </div>
    </>
  );
}
