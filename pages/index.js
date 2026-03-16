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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [suggestionForm, setSuggestionForm] = useState({ title: '', artist: '' });
  const [status, setStatus] = useState('idle'); // idle | loading | success | error

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

  const handleSuggestionSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Suggestion de Son',
          email: 'onboarding@resend.dev',
          message: `Nouvelle suggestion de chanson :\n- Titre : ${suggestionForm.title}\n- Artiste : ${suggestionForm.artist}`
        }),
      });
      if (res.ok) {
        setStatus('success');
        setTimeout(() => {
          setIsModalOpen(false);
          setStatus('idle');
          setSuggestionForm({ title: '', artist: '' });
        }, 2000);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <>
      <Head>
        <title>Bachata Lyrics — Les plus belles paroles en français</title>
      </Head>

      {/* ─── NAVBAR ─── */}
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="logo">
            <div className="logo-icon">🎶</div>
            <span className="logo-text">Bachata Lyrics</span>
          </div>

          <div className="nav-links" style={{ display: 'flex', gap: '24px', fontWeight: 600 }}>
            <span style={{ cursor: 'pointer', color: 'var(--accent)' }}>Sons</span>
            <span style={{ cursor: 'pointer', color: 'var(--text-muted)', transition: 'color 0.2s' }} onClick={() => router.push('/passes')}>Passes</span>
            <span style={{ cursor: 'pointer', color: 'var(--text-muted)', transition: 'color 0.2s' }} onClick={() => router.push('/jack-and-jill')}>Jack & Jill</span>
            <button 
              onClick={() => setIsModalOpen(true)}
              style={{ 
                background: 'linear-gradient(135deg, #c026d3, #7c3aed)',
                color: 'white',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'transform 0.2s'
              }}
              className="hover-scale"
            >
              ➕ Ajouter un son
            </button>
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
            className={`tag-btn ${activeTag === 'remix' ? 'active' : ''}`}
            onClick={() => {
              setActiveTag(activeTag === 'remix' ? null : 'remix');
              setShowFavorites(false);
            }}
          >
            ✨ Mes Remixs
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

      {/* ─── SUGGESTION MODAL ─── */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '24px'
        }} onClick={() => setIsModalOpen(false)}>
          <div 
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '24px',
              padding: '32px',
              width: '100%',
              maxWidth: '440px',
              position: 'relative',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', color: 'var(--text-muted)', fontSize: '1.5rem' }}
            >
              ×
            </button>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>Proposer une chanson</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
              Tu as une chanson en tête ? Dis-nous tout !
            </p>

            <form onSubmit={handleSuggestionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Titre de la chanson
                </label>
                <input
                  required
                  type="text"
                  value={suggestionForm.title}
                  onChange={e => setSuggestionForm({...suggestionForm, title: e.target.value})}
                  placeholder="Ex: Lejanía"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Artiste
                </label>
                <input
                  required
                  type="text"
                  value={suggestionForm.artist}
                  onChange={e => setSuggestionForm({...suggestionForm, artist: e.target.value})}
                  placeholder="Ex: Jensen"
                  style={inputStyle}
                />
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                style={{
                  marginTop: '12px',
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #c026d3, #7c3aed)',
                  color: 'white',
                  fontWeight: 700,
                  border: 'none',
                  cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                  opacity: status === 'loading' ? 0.7 : 1,
                  transition: 'all 0.2s'
                }}
              >
                {status === 'loading' ? 'Envoi...' : 'Envoyer la suggestion'}
              </button>

              {status === 'success' && (
                <p style={{ textAlign: 'center', color: '#34d399', fontWeight: 600, marginTop: '8px' }}>
                  ✅ Merci ! Suggestion envoyée.
                </p>
              )}
              {status === 'error' && (
                <p style={{ textAlign: 'center', color: '#f87171', fontWeight: 600, marginTop: '8px' }}>
                  ❌ Erreur. Réessaie plus tard.
                </p>
              )}
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        .hover-scale:hover { transform: scale(1.05); }
        .hover-scale:active { transform: scale(0.95); }
      `}</style>
    </>
  );
}

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  background: '#0a0a0f',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  color: 'white',
  fontSize: '0.95rem',
  outline: 'none',
  transition: 'border-color 0.2s',
};

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
            <span>{song.audioUrl ? 'Écouter l\'exclu' : 'Voir les paroles'}</span>
            <span>→</span>
          </div>
          {song.spotify && !song.audioUrl && (
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
          {song.audioUrl && (
            <div 
              className="card-spotify" 
              style={{ 
                background: 'linear-gradient(135deg, #c026d3, #7c3aed)', 
                color: 'white', 
                fontSize: '0.65rem', 
                fontWeight: 900,
                width: 'auto', 
                padding: '4px 10px',
                borderRadius: '8px',
                letterSpacing: '0.05em',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
                border: 'none'
              }}
              title="Exclusivité Bachata Lyrics"
            >
              EXCLU
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
