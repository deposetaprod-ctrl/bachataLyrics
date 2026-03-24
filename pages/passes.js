import { useState, useEffect } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import { useRouter } from 'next/router';
import { passes } from '../data/passes';
import AuthModal from '../components/AuthModal';

export default function Passes() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState(null);
  const [favoritePasses, setFavoritePasses] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [user, setUser] = useState(null);
  const [supabaseClient, setSupabaseClient] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('favPasses');
    if (saved) setFavoritePasses(JSON.parse(saved));

    // Supabase Init
    if (typeof window !== 'undefined' && window.supabase) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey) {
        const client = window.supabase.createClient(supabaseUrl, supabaseKey);
        setSupabaseClient(client);
        client.auth.getSession().then(({ data: { session } }) => {
          setUser(session?.user ?? null);
        });
        const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
        });
        return () => subscription.unsubscribe();
      }
    }
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
        <title>Passes & Mouvements — Bachata Flow</title>
        <style dangerouslySetInnerHTML={{ __html: `
          .passe-video-container { position: relative; width: 100%; aspect-ratio: 4/5; background: #000; overflow: hidden; border-bottom: 1px solid var(--border); }
          .passe-video { width: 100%; height: 100%; object-fit: contain; display: block; }
          .passe-style-badge { position: absolute; top: 12px; right: 12px; padding: 4px 12px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 10; }
          .passe-card:hover { transform: translateY(-4px); border-color: var(--border-hover); box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px var(--border-hover); }
        `}} />
      </Head>

      <Script 
        src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2" 
        strategy="afterInteractive"
        onLoad={() => {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
          if (supabaseUrl && supabaseKey) {
            const client = window.supabase.createClient(supabaseUrl, supabaseKey);
            setSupabaseClient(client);
          }
        }}
      />

      {/* ─── NAVBAR ─── */}
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="logo" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
            <img src="/LOGO_PWA.PNG" alt="Logo" className="logo-img" />
            <span className="logo-text">Bachata Flow</span>
          </div>
 
          <div className="nav-links">
            <span onClick={() => router.push('/')}>Sons</span>
            <span style={{ color: 'var(--accent)' }}>Passes</span>
            <span onClick={() => router.push('/musicality')}>Musicalité</span>
            <span onClick={() => router.push('/jack-and-jill')}>Jack & Jill</span>
            
            <div className="auth-profile">
              {user ? (
                <div className="user-logged animate-fade-in">
                  <span className="user-name">👤 {user.email?.split('@')[0]}</span>
                  <button className="btn-logout" onClick={() => supabaseClient.auth.signOut()}>
                    Déconnexion
                  </button>
                </div>
              ) : (
                <button className="btn-login" onClick={() => setShowLoginModal(true)}>
                  Connexion / S'inscrire
                </button>
              )}
            </div>
          </div>
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
      </nav>

      <AuthModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        supabaseClient={supabaseClient}
      />

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
          {['Dominicaine', 'Sensual', 'Influence', 'Mixte'].map((tag) => (
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <h2 className="card-title" style={{ fontSize: '1.2rem', margin: 0, flex: 1 }}>{passe.title}</h2>
          {passe.instagram && (
            <a 
              href={passe.instagram} 
              target="_blank" 
              rel="noopener noreferrer"
              className="instagram-link"
              onClick={(e) => e.stopPropagation()}
              style={{ 
                color: '#ec4899', 
                marginLeft: '12px', 
                transition: 'all 0.2s ease', 
                display: 'flex',
                background: 'rgba(236, 72, 153, 0.1)',
                padding: '6px',
                borderRadius: '8px',
                border: '1px solid rgba(236, 72, 153, 0.2)'
              }}
              title="Suivre l'artiste sur Instagram"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
          )}
        </div>
        
        <div className="card-tags" style={{ marginTop: 'auto' }}>
          {passe.tags.map((tag) => (
            <span key={tag} className="card-tag">#{tag}</span>
          ))}
        </div>
      </div>
    </article>

  );
}
