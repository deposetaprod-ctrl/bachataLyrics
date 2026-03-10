import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { songs } from '../data/songs';
import { SpotifyIcon } from '../components/SpotifyIcon';

export default function Home() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState(null);
  const [favoriteSongs, setFavoriteSongs] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);

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

  // Collect all unique tags
  const allTags = [...new Set(songs.flatMap((s) => s.tags))];

  const filtered = songs.filter((song) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      song.title.toLowerCase().includes(q) ||
      song.artist.toLowerCase().includes(q) ||
      song.tags.some((t) => t.includes(q));
    const matchTag = !activeTag || song.tags.includes(activeTag);
    const matchFav = !showFavorites || favoriteSongs.includes(song.id);
    return matchSearch && matchTag && matchFav;
  });

  return (
    <>
      <Head>
        <title>Bachata GANG — Les plus belles paroles en français</title>
      </Head>

      {/* ─── NAVBAR ─── */}
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="logo">
            <div className="logo-icon">🎶</div>
            <span className="logo-text">Bachata GANG</span>
          </div>

          <div className="nav-links" style={{ display: 'flex', gap: '24px', fontWeight: 600 }}>
            <span style={{ cursor: 'pointer', color: 'var(--accent)' }}>Sons</span>
            <span style={{ cursor: 'pointer', color: 'var(--text-muted)', transition: 'color 0.2s' }} onClick={() => router.push('/passes')}>Passes</span>
          </div>

          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              id="search-input"
              type="text"
              placeholder="Rechercher un titre, artiste..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="song-count">{filtered.length} son{filtered.length !== 1 ? 's' : ''}</div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="hero">
        <div className="hero-eyebrow">
          <span>💃</span> Bachata • Paroles bilingues
        </div>
        <h1>Les plus belles paroles<br />de bachata</h1>
        <p>
          Retrouve les textes originaux en espagnol avec leur traduction en français,
          côte à côte, pour mieux ressentir chaque chanson.
        </p>

        {/* Tag filters */}
        <div className="tags-filter">
          <button
            className={`tag-btn ${showFavorites ? 'active' : ''}`}
            onClick={() => {
              setShowFavorites(!showFavorites);
              if (!showFavorites) setActiveTag(null);
            }}
          >
            ❤️ Mes Favoris
          </button>
          <button
            id="tag-all"
            className={`tag-btn ${!activeTag && !showFavorites ? 'active' : ''}`}
            onClick={() => {
              setActiveTag(null);
              setShowFavorites(false);
            }}
          >
            Tout voir
          </button>
          {allTags.map((tag) => (
            <button
              id={`tag-${tag}`}
              key={tag}
              className={`tag-btn ${activeTag === tag ? 'active' : ''}`}
              onClick={() => {
                setActiveTag(activeTag === tag ? null : tag);
                setShowFavorites(false);
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      {/* ─── SONG GRID ─── */}
      <div className="section-label">
        {showFavorites ? 'Mes Favoris' : (activeTag ? `Filtre : ${activeTag}` : 'Tous les sons')}
      </div>

      <div className="song-grid">
        {filtered.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">🎵</div>
            <h3>Aucun résultat trouvé</h3>
            <p>Essaie un autre terme de recherche</p>
          </div>
        ) : (
          filtered.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              isFavorite={favoriteSongs.includes(song.id)}
              onToggleFav={(e) => toggleFav(song.id, e)}
              onClick={() => router.push(`/song/${song.id}`)}
            />
          ))
        )}
      </div>

      {/* ─── FOOTER ─── */}
      <footer className="footer">
        <p>Fait avec <span>♥</span> pour les amoureux de bachata · {new Date().getFullYear()}</p>
      </footer>
    </>
  );
}

function SongCard({ song, onClick, isFavorite, onToggleFav }) {
  return (
    <article
      id={`card-${song.id}`}
      className="song-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {/* Cover */}
      <div className="card-cover">
        <button 
          className={`card-fav-btn ${isFavorite ? 'active' : ''}`}
          onClick={onToggleFav}
          aria-label="Ajouter aux favoris"
        >
          {isFavorite ? '♥' : '♡'}
        </button>
        <div
          className="card-cover-bg"
          style={{ background: `linear-gradient(135deg, ${song.color}cc, ${song.color}44)` }}
        />
        <div className="card-cover-pattern" />
        <span className="card-cover-title">{song.title}</span>
      </div>

      {/* Body */}
      <div className="card-body">
        <div className="card-artist-row">
          <span className="card-artist">{song.artist}</span>
          <span className="card-year">{song.year}</span>
        </div>

        <h2 className="card-title">{song.title}</h2>

        <div className="card-tags">
          {song.tags.map((tag) => (
            <span key={tag} className="card-tag">#{tag}</span>
          ))}
        </div>

        <div className="card-footer">
          <div className="card-cta">
            <span>Voir les paroles</span>
            <span>→</span>
          </div>
          {song.spotify && (
            <a
              className="card-spotify"
              href={song.spotify}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="Écouter sur Spotify"
            >
              <SpotifyIcon />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
