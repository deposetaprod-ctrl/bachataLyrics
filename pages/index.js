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
  const [masteredSongs, setMasteredSongs] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [suggestionForm, setSuggestionForm] = useState({ personName: '', title: '', artist: '' });
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [showObjectives, setShowObjectives] = useState(false);
  const [showDailyNotif, setShowDailyNotif] = useState(false);

  useEffect(() => {
    const savedFavs = localStorage.getItem('favSongs');
    if (savedFavs) setFavoriteSongs(JSON.parse(savedFavs));
    
    const savedMastered = localStorage.getItem('masteredSongs');
    if (savedMastered) setMasteredSongs(JSON.parse(savedMastered));

    // Daily Notification check
    const todayStr = new Date().toDateString();
    const lastNotif = localStorage.getItem('lastDailyNotif');
    if (lastNotif !== todayStr) {
      setShowDailyNotif(true);
      localStorage.setItem('lastDailyNotif', todayStr);
    }
  }, []);

  // Song of the day logic (deterministic based on date)
  const today = new Date();
  const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const dailySongIndex = dateSeed % songs.length;
  const dailySong = songs[dailySongIndex];

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
          name: suggestionForm.personName || 'Anonyme',
          email: 'onboarding@resend.dev',
          message: `Nouvelle suggestion de chanson :\n- Titre : ${suggestionForm.title}\n- Artiste : ${suggestionForm.artist}`
        }),
      });
      if (res.ok) {
        setStatus('success');
        setTimeout(() => {
          setIsModalOpen(false);
          setStatus('idle');
          setSuggestionForm({ personName: '', title: '', artist: '' });
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
        
        {/* PROGRESS STATS */}
        <div 
          onClick={() => setShowObjectives(true)}
          style={{ 
            display: 'flex', 
            gap: '12px', 
            marginTop: '24px',
            padding: '8px 20px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '999px',
            width: 'fit-content',
            fontSize: '0.8rem',
            fontWeight: 600,
            border: '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          className="hover-scale"
        >
          <span style={{ color: 'var(--accent)' }}>🎯 Objectifs :</span>
          <span>{masteredSongs.length} / {songs.length} maîtrisés</span>
          <span style={{ marginLeft: '8px', opacity: 0.6 }}>Voir tout →</span>
        </div>

        {/* DAILY CHALLENGE CARD */}
        <div 
          onClick={() => router.push(`/song/${dailySong.id}`)}
          style={{
            marginTop: '32px',
            background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
            borderRadius: '24px',
            padding: '32px',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '32px',
            cursor: 'pointer',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}
          className="hover-scale"
        >
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            fontSize: '120px',
            opacity: 0.1,
            transform: 'rotate(15deg)'
          }}>🔥</div>
          
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            background: `linear-gradient(135deg, ${dailySong.color}, #000)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
            flexShrink: 0
          }}>
            🎵
          </div>
          
          <div style={{ flex: 1 }}>
            <div style={{ 
              textTransform: 'uppercase', 
              fontSize: '0.7rem', 
              fontWeight: 900, 
              letterSpacing: '0.1em',
              color: '#a78bfa',
              marginBottom: '4px'
            }}>
              Défi du jour
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px' }}>{dailySong.title}</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
              Apprends le vocabulaire et le sens de ce hit de <strong>{dailySong.artist}</strong>
            </p>
          </div>
          
          <button style={{
            background: 'white',
            color: '#1e1b4b',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}>
            Relever le défi
          </button>
        </div>

        <p style={{ marginTop: '32px' }}>
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

      {/* ─── OBJECTIVES MODAL ─── */}
      {showObjectives && (
        <div 
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '24px'
          }}
          onClick={() => setShowObjectives(false)}
        >
          <div 
            style={{
              background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '32px', padding: '40px', width: '100%', maxWidth: '600px',
              maxHeight: '80vh', overflowY: 'auto', position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => setShowObjectives(false)} style={{ position: 'absolute', top: '24px', right: '24px', fontSize: '2rem', color: 'var(--text-muted)' }}>×</button>
            
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🏆</div>
              <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Mes Objectifs</h2>
              <p style={{ color: 'var(--text-muted)' }}>Ta progression dans l'apprentissage de la bachata</p>
              
              <div style={{ 
                marginTop: '24px', height: '12px', background: 'rgba(255,255,255,0.05)', 
                borderRadius: '999px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ 
                  width: `${(masteredSongs.length / songs.length) * 100}%`, 
                  height: '100%', background: 'linear-gradient(90deg, #c026d3, #7c3aed)',
                  transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                }} />
              </div>
              <div style={{ marginTop: '8px', fontSize: '0.85rem', fontWeight: 700, opacity: 0.8 }}>
                {masteredSongs.length} sur {songs.length} chansons apprises ({Math.round((masteredSongs.length / songs.length) * 100)}%)
              </div>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              {songs.map(song => {
                const isMastered = masteredSongs.includes(song.id);
                return (
                  <div 
                    key={song.id} 
                    onClick={() => { setShowObjectives(false); router.push(`/song/${song.id}`); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '16px', padding: '16px',
                      background: isMastered ? 'rgba(52, 211, 153, 0.05)' : 'rgba(255,255,255,0.02)',
                      borderRadius: '16px', border: `1px solid ${isMastered ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255,255,255,0.05)'}`,
                      cursor: 'pointer'
                    }}
                    className="hover-scale"
                  >
                    <div style={{ fontSize: '1.2rem' }}>{isMastered ? '✅' : '⏳'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{song.title}</div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{song.artist}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── DAILY NOTIFICATION POPUP ─── */}
      {showDailyNotif && (
        <div 
          style={{
            position: 'fixed', bottom: '24px', left: '24px', right: '24px', maxWidth: '400px',
            background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
            borderRadius: '24px', padding: '24px', border: '1px solid rgba(124, 58, 237, 0.5)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)', zIndex: 2000,
            display: 'flex', gap: '20px', alignItems: 'center',
            animation: 'slideInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div style={{ fontSize: '2.5rem', flexShrink: 0 }}>🌟</div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '4px' }}>Nouveau défi prêt !</h3>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', marginBottom: '12px' }}>
              Découvre <strong>{dailySong.title}</strong> aujourd'hui et améliore ta culture bachata.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => { setShowDailyNotif(false); router.push(`/song/${dailySong.id}`); }}
                style={{
                  background: 'white', color: '#1e1b4b', border: 'none', padding: '8px 16px',
                  borderRadius: '10px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer'
                }}
              >
                C'est parti !
              </button>
              <button 
                onClick={() => setShowDailyNotif(false)}
                style={{ background: 'transparent', color: 'white', border: 'none', fontSize: '0.8rem', opacity: 0.6, cursor: 'pointer' }}
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      )}

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
                  Ton nom (optionnel)
                </label>
                <input
                  type="text"
                  value={suggestionForm.personName}
                  onChange={e => setSuggestionForm({...suggestionForm, personName: e.target.value})}
                  placeholder="Ex: Maximilien"
                  style={inputStyle}
                />
              </div>
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
        .hover-scale:hover { transform: scale(1.02); }
        .hover-scale:active { transform: scale(0.98); }
        @keyframes slideInUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
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
