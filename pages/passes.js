import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { passes } from '../data/passes';

export default function Passes() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState(null);
  const [favoritePasses, setFavoritePasses] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('favPasses');
    if (saved) setFavoritePasses(JSON.parse(saved));
  }, []);

  const toggleFav = (id, e) => {
    e.stopPropagation();
    const newFavs = favoritePasses.includes(id) 
      ? favoritePasses.filter(f => f !== id) 
      : [...favoritePasses, id];
    setFavoritePasses(newFavs);
    localStorage.setItem('favPasses', JSON.stringify(newFavs));
  };

  // Collect all unique tags
  const allTags = [...new Set(passes.flatMap((p) => p.tags))];

  const filtered = passes.filter((passe) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      passe.title.toLowerCase().includes(q) ||
      passe.style.toLowerCase().includes(q) ||
      passe.tags.some((t) => t.includes(q));
    const matchTag = !activeTag || passe.tags.includes(activeTag);
    const matchFav = !showFavorites || favoritePasses.includes(passe.id);
    return matchSearch && matchTag && matchFav;
  });

  return (
    <>
      <Head>
        <title>Bachata Lyrics — Passes & Mouvements</title>
        <style dangerouslySetInnerHTML={{ __html: `
          .passe-video-container { position: relative; width: 100%; aspect-ratio: 4/5; background: #000; overflow: hidden; border-bottom: 1px solid var(--border); }
          .passe-video { width: 100%; height: 100%; object-fit: contain; display: block; }
          .passe-style-badge { position: absolute; top: 12px; right: 12px; padding: 4px 12px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 10; }
          .passe-card:hover { transform: translateY(-4px); border-color: var(--border-hover); box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px var(--border-hover); }
        `}} />
      </Head>

      {/* ─── NAVBAR ─── */}
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="logo" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
            <div className="logo-icon">🎶</div>
            <span className="logo-text">Bachata Lyrics</span>
          </div>
          
          <div className="nav-links" style={{ display: 'flex', gap: '24px', fontWeight: 600 }}>
            <span style={{ cursor: 'pointer', color: 'var(--text-muted)', transition: 'color 0.2s' }} onClick={() => router.push('/')}>Sons</span>
            <span style={{ cursor: 'pointer', color: 'var(--accent)' }}>Passes</span>
            <span style={{ cursor: 'pointer', color: 'var(--text-muted)', transition: 'color 0.2s' }} onClick={() => router.push('/jack-and-jill')}>Jack & Jill</span>
          </div>

          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Rechercher une passe, un style..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="song-count">{filtered.length} passe{filtered.length !== 1 ? 's' : ''}</div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="hero" style={{ paddingBottom: '32px' }}>
        <div className="hero-eyebrow" style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.15)', borderColor: 'rgba(59, 130, 246, 0.25)' }}>
          <span>🕺</span> Mouvements & Passes
        </div>
        <h1>Apprends par <br /> l'image</h1>
        <p>
          Découvre les passes de bachata, zouk et autres styles pour enrichir ta danse sur tes sons préférés.
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

      {/* ─── GRID ─── */}
      <div className="section-label">
        {showFavorites ? 'Mes Favoris' : (activeTag ? `Filtre : ${activeTag}` : 'Toutes les passes')}
      </div>

      <div className="song-grid passes-grid">
        {filtered.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">🎥</div>
            <h3>Aucun résultat trouvé</h3>
            <p>Essaie un autre terme de recherche</p>
          </div>
        ) : (
          filtered.map((passe) => (
            <PasseCard 
              key={passe.id} 
              passe={passe} 
              isFavorite={favoritePasses.includes(passe.id)}
              onToggleFav={(e) => toggleFav(passe.id, e)}
            />
          ))
        )}
      </div>
      
      {/* ─── FOOTER ─── */}
      <footer className="footer">
        <p>Fait avec <span style={{ color: '#3b82f6' }}>♥</span> pour les amoureux de la danse · {new Date().getFullYear()}</p>
      </footer>
    </>
  );
}

function PasseCard({ passe, isFavorite, onToggleFav }) {
  const posterUrl = passe.videoUrl && passe.videoUrl.includes('cloudinary.com') 
    ? passe.videoUrl.replace(/\.(mp4|mov)$/i, '.jpg')
    : '';

  return (
    <article className="song-card passe-card">
      <div className="passe-video-container">
        <button 
          className={`card-fav-btn ${isFavorite ? 'active' : ''}`}
          onClick={onToggleFav}
          aria-label="Ajouter aux favoris"
        >
          {isFavorite ? '♥' : '♡'}
        </button>
        <video 
          src={passe.videoUrl} 
          controls 
          preload="metadata"
          className="passe-video"
          poster={posterUrl}
        />
        <div className="passe-style-badge" style={{ background: passe.color }}>
          {passe.style}
        </div>
      </div>
      
      <div className="card-body">
        <h2 className="card-title" style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{passe.title}</h2>
        
        <div className="card-tags" style={{ marginTop: 'auto' }}>
          {passe.tags.map((tag) => (
            <span key={tag} className="card-tag">#{tag}</span>
          ))}
        </div>
      </div>
    </article>
  );
}
