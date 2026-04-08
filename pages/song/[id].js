import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { songs } from '../../data/songs';
import { SpotifyIcon } from '../../components/SpotifyIcon';
import Navbar from '../../components/Navbar';
import SeoFooter from '../../components/SeoFooter';

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
  const [masteredSongs, setMasteredSongs] = useState([]);

  useEffect(() => {
    const savedFavs = localStorage.getItem('favSongs');
    if (savedFavs) setFavoriteSongs(JSON.parse(savedFavs));

    const savedMastered = localStorage.getItem('masteredSongs');
    if (savedMastered) setMasteredSongs(JSON.parse(savedMastered));
  }, []);

  const toggleFav = (id, e) => {
    e.stopPropagation();
    const newFavs = favoriteSongs.includes(id) 
      ? favoriteSongs.filter(f => f !== id) 
      : [...favoriteSongs, id];
    setFavoriteSongs(newFavs);
    localStorage.setItem('favSongs', JSON.stringify(newFavs));
  };

  const toggleMastered = (id) => {
    const isMastered = masteredSongs.includes(id);
    const newMastered = isMastered
      ? masteredSongs.filter(m => m !== id)
      : [...masteredSongs, id];
    setMasteredSongs(newMastered);
    localStorage.setItem('masteredSongs', JSON.stringify(newMastered));
    
    if (!isMastered) {
      // Small celebration or feedback can be added here
    }
  };

  if (!song) return null;

  return (
    <>
      <Head>
        <title>{song.title} — {song.artist} | Paroles & Traduction Française | Bachata Flow</title>
        <link rel="canonical" href={`https://bachatalyrics.com/song/${song.id}`} />
        <meta
          name="description"
          content={`Paroles de « ${song.title} » par ${song.artist} (${song.year}) en espagnol avec traduction française côte à côte. Découvrez le sens, le contexte culturel et l'artiste.`}
        />
        <meta property="og:title" content={`${song.title} — ${song.artist} | Bachata Flow`} />
        <meta property="og:description" content={`Paroles bilingues de « ${song.title} » par ${song.artist}. Texte original espagnol + traduction française.`} />
        <meta property="og:url" content={`https://bachatalyrics.com/song/${song.id}`} />
        <meta property="og:type" content="music.song" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MusicRecording",
              "name": song.title,
              "byArtist": {
                "@type": "MusicGroup",
                "name": song.artist
              },
              "datePublished": String(song.year),
              "genre": "Bachata",
              "inLanguage": ["es", "fr"],
              "description": `Paroles de ${song.title} par ${song.artist} (${song.year}) — traduction française`,
              "url": `https://bachatalyrics.com/song/${song.id}`,
              ...(song.culture?.album && { "inAlbum": { "@type": "MusicAlbum", "name": song.culture.album } }),
              "isPartOf": {
                "@type": "WebSite",
                "name": "Bachata Flow",
                "url": "https://bachatalyrics.com"
              }
            })
          }}
        />
      </Head>

      <Navbar activePage="home" onLoginClick={() => router.push('/')} />

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
              {song.audioUrl && (
                <div style={{ 
                  background: 'linear-gradient(135deg, #c026d3, #7c3aed)', 
                  color: 'white', 
                  padding: '6px 16px', 
                  borderRadius: '12px',
                  fontWeight: 900,
                  fontSize: '0.75rem',
                  letterSpacing: '0.1em',
                  boxShadow: '0 8px 20px rgba(124, 58, 237, 0.4)',
                  textTransform: 'uppercase'
                }}>
                  Remix Exclusif
                </div>
              )}
              {song.spotify && !song.audioUrl && (
                <div style={{ display: 'flex', gap: '8px' }}>
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
                  <button 
                    onClick={() => document.getElementById('culture-section')?.scrollIntoView({ behavior: 'smooth' })}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    className="hover-scale"
                  >
                    💡 En savoir plus
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {song.audioUrl && (
            <div className="exclusive-player animate-fade-in" style={{ 
              marginTop: '40px',
              padding: '24px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '1.5rem' }}>🎧</div>
                <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>LECTEUR EXCLUSIF</span>
              </div>
              <audio 
                src={song.audioUrl} 
                controls 
                style={{ width: '100%', height: '40px' }}
              />
            </div>
          )}
        </div>


        {/* ─── DIVIDER ─── */}
        <div className="divider" />

        <div className="song-content-layout">
          {song.danceVideo && (
            <div className="dance-video-container">
              <iframe
                src={`https://www.youtube.com/embed/${song.danceVideo}?autoplay=0&rel=0`}
                title="Dance Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          )}

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
        </div>

        {/* ─── CULTURE & OBJECTIVES ─── */}
        <div id="culture-section" style={{
          marginTop: '64px',
          padding: '40px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '32px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '2rem' }}>🌍</span> Culture & Contexte
              </h2>
              
              <div style={{ display: 'grid', gap: '24px' }}>
                <section>
                  <h3 style={{ fontSize: '0.9rem', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: 900 }}>Contexte</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{song.culture?.context || "Une chanson emblématique du répertoire bachata qui continue de faire vibrer les pistes de danse."}</p>
                </section>
                
                <section>
                  <h3 style={{ fontSize: '0.9rem', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: 900 }}>Signification</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{song.culture?.meaning || "Les paroles explorent les émotions profondes et les thèmes universels de l'amour et de la passion."}</p>
                </section>
                
                <section>
                  <h3 style={{ fontSize: '0.9rem', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: 900 }}>L'Artiste</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{song.culture?.artistInfo || `${song.artist} est une figure majeure de la scène bachata contemporaine.`}</p>
                </section>
                
                {song.culture?.album && (
                  <section>
                    <h3 style={{ fontSize: '0.9rem', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: 900 }}>Album</h3>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{song.culture.album}</p>
                  </section>
                )}
              </div>
            </div>

            <div style={{ 
              width: '100%', 
              maxWidth: '300px', 
              padding: '32px', 
              background: 'rgba(255,255,255,0.05)', 
              borderRadius: '24px',
              border: '1px solid rgba(255,255,255,0.1)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎯</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Ton Objectif</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
                Maîtrise les paroles et le sens de cette chanson pour débloquer ta récompense !
              </p>
              
              <button
                onClick={() => toggleMastered(song.id)}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '16px',
                  background: masteredSongs.includes(song.id) ? '#34d399' : 'linear-gradient(135deg, #c026d3, #7c3aed)',
                  color: 'white',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: masteredSongs.includes(song.id) ? '0 10px 20px rgba(52, 211, 153, 0.3)' : '0 10px 20px rgba(124, 58, 237, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
                className="hover-scale"
              >
                {masteredSongs.includes(song.id) ? (
                  <><span>✅</span> Maîtrisée !</>
                ) : (
                  <><span>🔥</span> Marquer comme apprise</>
                )
                }
              </button>
              
              {masteredSongs.includes(song.id) && (
                <p style={{ color: '#34d399', fontSize: '0.8rem', fontWeight: 600, marginTop: '16px', animation: 'fadeIn 0.5s ease-out' }}>
                  Félicitations ! Tu as validé cet objectif.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ─── FOOTER SEO ─── */}
        <SeoFooter currentPage="song" />
      </div>
    </>
  );
}
