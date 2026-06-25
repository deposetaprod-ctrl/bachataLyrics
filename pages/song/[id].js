import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from '../../utils/translations';
import Head from 'next/head';
import { songs } from '../../data/songs';
import { SpotifyIcon } from '../../components/SpotifyIcon';
import Navbar from '../../components/Navbar';
import SeoFooter from '../../components/SeoFooter';
import RelatedSongs from '../../components/RelatedSongs';
import ShopTheVibe from '../../components/ShopTheVibe';
import Script from 'next/script';
import AuthModal from '../../components/AuthModal';

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
  const { locale } = router || { locale: 'fr' };
  const t = useTranslation(locale);
  const [favoriteSongs, setFavoriteSongs] = useState([]);
  const [masteredSongs, setMasteredSongs] = useState([]);
  const [user, setUser] = useState(null);
  const [supabaseClient, setSupabaseClient] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [addedToAcademy, setAddedToAcademy] = useState(false);

  useEffect(() => {
    const savedFavs = localStorage.getItem('favSongs');
    if (savedFavs) setFavoriteSongs(JSON.parse(savedFavs));

    const savedMastered = localStorage.getItem('masteredSongs');
    if (savedMastered) setMasteredSongs(JSON.parse(savedMastered));

    if (typeof window !== 'undefined' && window.supabase) {
      initSupabase();
    }
  }, []);

  const initSupabase = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      const client = window.supabase.createClient(supabaseUrl, supabaseKey);
      setSupabaseClient(client);
      client.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
      });
      client.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });
    }
  };

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

  const handleAddToAcademy = async () => {
    if (!user || !supabaseClient) {
      setShowLoginModal(true);
      return;
    }
    const { error } = await supabaseClient
      .from('academy_objectives')
      .insert([{ user_id: user.id, song_id: song.id }]);
    
    if (!error) {
      setAddedToAcademy(true);
      setTimeout(() => setAddedToAcademy(false), 3000);
    }
  };

  if (!song) return null;

  // ── Build structured data with optional AudioObject & VideoObject ──
  const structuredData = {
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
    "description": locale === 'en'
      ? `Listen to "${song.title}" by ${song.artist} with side-by-side English translation and dance video.`
      : `Écoutez « ${song.title} » de ${song.artist} (${song.year}) avec traduction française et vidéo de danse.`,
    "url": `https://bachatalyrics.com${locale === 'en' ? '/en' : ''}/song/${song.id}`,
    ...(song.culture?.album && { "inAlbum": { "@type": "MusicAlbum", "name": song.culture.album } }),
    "isPartOf": {
      "@type": "WebSite",
      "name": "Bachata Lyrics",
      "url": "https://bachatalyrics.com"
    }
  };

  // Add AudioObject if song has exclusive audio
  if (song.audioUrl) {
    structuredData.audio = {
      "@type": "AudioObject",
      "contentUrl": song.audioUrl,
      "encodingFormat": "audio/mpeg",
      "name": `${song.title} — ${song.artist} (Remix Exclusif)`
    };
  }

  // Add VideoObject if song has a dance video
  if (song.danceVideo) {
    structuredData.video = {
      "@type": "VideoObject",
      "name": `${song.title} — Bachata Dance Demonstration`,
      "description": locale === 'en'
        ? `Watch a bachata dance demonstration for "${song.title}" by ${song.artist}.`
        : `Vidéo de démonstration de danse bachata sur « ${song.title} » de ${song.artist}.`,
      "thumbnailUrl": `https://img.youtube.com/vi/${song.danceVideo}/hqdefault.jpg`,
      "embedUrl": `https://www.youtube.com/embed/${song.danceVideo}`,
      "uploadDate": song.dateAdded || `${song.year}-01-01`
    };
  }

  // ── Build meta description highlighting interactive features ──
  const features = [];
  if (song.audioUrl) features.push(locale === 'en' ? 'exclusive remix' : 'remix exclusif');
  if (song.danceVideo) features.push(locale === 'en' ? 'dance video' : 'vidéo de danse');
  if (song.spotify) features.push('Spotify');

  const metaDescription = locale === 'en'
    ? `"${song.title}" by ${song.artist} — Read the original lyrics with English translation${features.length > 0 ? `. Includes: ${features.join(', ')}` : ''}.`
    : `« ${song.title} » de ${song.artist} (${song.year}) — Paroles originales avec traduction française côte à côte${features.length > 0 ? `. Inclut : ${features.join(', ')}` : ''}.`;

  return (
    <>
      <Head>
        <title>{song.title} — {song.artist} | {locale === 'en' ? 'Lyrics & Translation' : 'Paroles & Traduction Française'} | Bachata Lyrics</title>
        <meta name="description" content={metaDescription} />

        {/* ── hreflang: tell Google about FR/EN alternates ── */}
        <link rel="alternate" hrefLang="fr" href={`https://bachatalyrics.com/song/${song.id}`} />
        <link rel="alternate" hrefLang="en" href={`https://bachatalyrics.com/en/song/${song.id}`} />
        <link rel="alternate" hrefLang="x-default" href={`https://bachatalyrics.com/song/${song.id}`} />

        {/* ── Open Graph ── */}
        <meta property="og:title" content={`${song.title} — ${song.artist} | Bachata Lyrics`} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="music.song" />
        {song.danceVideo && (
          <meta property="og:image" content={`https://img.youtube.com/vi/${song.danceVideo}/hqdefault.jpg`} />
        )}

        {/* ── Structured Data (JSON-LD) ── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>

      <Script 
        src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2" 
        strategy="afterInteractive"
        onLoad={initSupabase}
      />

      <Navbar 
        user={user} 
        supabaseClient={supabaseClient} 
        activePage="home" 
        onLoginClick={() => setShowLoginModal(true)} 
      />

      <AuthModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        supabaseClient={supabaseClient}
      />

      <div className="lyrics-page">
        {/* ─── SEO INTRO (visible to users & crawlers) ─── */}
        <div className="seo-intro">
          <p>
            {locale === 'en'
              ? `🎧 Listen to "${song.title}" by ${song.artist}, read the bilingual lyrics in real time${song.danceVideo ? ', and practice with the included dance video' : ''}.`
              : `🎧 Écoute « ${song.title} » de ${song.artist}, lis les paroles bilingues en temps réel${song.danceVideo ? ' et entraîne-toi avec la vidéo de danse incluse' : ''}.`}
          </p>
        </div>

        {/* ─── HEADER ─── */}
        <div className="lyrics-header" style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, display: 'flex', gap: '8px', zIndex: 10 }}>
            <button 
              className={`favorite-btn ${addedToAcademy ? 'active' : ''}`}
              onClick={handleAddToAcademy}
              aria-label="Ajouter à l'académie"
              style={{ position: 'relative', top: 'auto', right: 'auto', padding: '8px 16px', background: addedToAcademy ? '#34d399' : 'var(--bg-card)' }}
            >
              <span className="fav-icon">{addedToAcademy ? '🎓' : '+'}</span>
              {addedToAcademy ? 'Ajouté' : 'Academy'}
            </button>
            <button 
              className={`favorite-btn ${favoriteSongs.includes(song.id) ? 'active' : ''}`}
              onClick={(e) => toggleFav(song.id, e)}
              aria-label="Ajouter aux favoris"
              style={{ position: 'relative', top: 'auto', right: 'auto' }}
            >
              <span className="fav-icon">{favoriteSongs.includes(song.id) ? '♥' : '♡'}</span>
              {favoriteSongs.includes(song.id) ? (locale === 'en' ? 'Saved' : 'Sauvegardé') : (locale === 'en' ? 'Save' : 'Ajouter')}
            </button>
          </div>
          <button id="back-btn" className="back-btn" onClick={() => router.push('/')}>
            ← {locale === 'en' ? 'Back to catalog' : 'Retour au catalogue'}
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
                  {locale === 'en' ? 'Exclusive Remix' : 'Remix Exclusif'}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: '8px' }}>
                {song.danceVideo && (
                  <button
                    onClick={() => router.push(`/musicality?video=${song.danceVideo}`)}
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                    }}
                    className="hover-scale"
                  >
                    🎵 {locale === 'en' ? 'Practice Musicality' : 'Musicalité'}
                  </button>
                )}
                {song.spotify && !song.audioUrl && (
                  <>
                    <a
                      id="spotify-btn"
                      href={song.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="spotify-listen-btn"
                    >
                      <SpotifyIcon />
                      {locale === 'en' ? 'Listen on Spotify' : 'Écouter sur Spotify'}
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
                      💡 {locale === 'en' ? 'Read more' : 'En savoir plus'}
                    </button>
                  </>
                )}
              </div>
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

        <div className={`song-content-layout ${!song.danceVideo ? 'no-video' : ''}`}>
          {song.danceVideo ? (
            <div className="dance-video-container">
              <iframe
                src={`https://www.youtube.com/embed/${song.danceVideo}?autoplay=0&rel=0`}
                title="Dance Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          ) : (
            <div className="dance-video-placeholder">
              <div className="placeholder-icon">🎬</div>
              <div className="placeholder-text">
                <h3>{locale === 'en' ? 'No demonstration video' : 'Aucune vidéo de démonstration'}</h3>
                <p>
                  {locale === 'en' ? 'Know a great dance video for this song? Let us know to enrich the community!' : 'Tu connais une superbe vidéo de danse sur ce son ? Propose-la nous pour enrichir la communauté !'}
                </p>
              </div>
              <a 
                href="mailto:contact@maximilien.digital"
                className="btn-suggest-video hover-scale"
              >
                🎥 {locale === 'en' ? 'Suggest a video' : 'Proposer une vidéo'}
              </a>
            </div>
          )}

          <div className="lyrics-interleaved">
          {(() => {
            // Determine the "original" language: prefer 'es', then 'en', then first available
            const originalLang = song.lyrics.es ? 'es' : (song.lyrics.en ? 'en' : Object.keys(song.lyrics)[0]);
            const originalLines = song.lyrics[originalLang].split('\n');
            // Determine the "translation" language
            const targetLocale = locale === 'en' && song.lyrics.en && originalLang !== 'en' ? 'en' : 'fr';
            const targetLines = (song.lyrics[targetLocale] || '').split('\n');

            return originalLines.map((origLine, i) => {
              const targetLine = targetLines[i] || '';
              if (!origLine.trim() && !targetLine.trim()) return <div key={i} style={{ height: '20px' }} />;
              return (
                <div key={i} className="lyric-pair">
                  {origLine && <div className={`lyric-${originalLang}`}>{origLine}</div>}
                  {targetLine && originalLang !== targetLocale && <div className={`lyric-${targetLocale}`}>{targetLine}</div>}
                </div>
              );
            });
          })()}
          </div>
        </div>

        {/* ─── SHOP THE VIBE (Contextual Merch) ─── */}
        <ShopTheVibe song={song} />

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
                <span style={{ fontSize: '2rem' }}>🌍</span> {locale === 'en' ? 'Culture & Context' : 'Culture & Contexte'}
              </h2>
              
              <div style={{ display: 'grid', gap: '24px' }}>
                <section>
                  <h3 style={{ fontSize: '0.9rem', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: 900 }}>{locale === 'en' ? 'Context' : 'Contexte'}</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{locale === 'en' && song.culture_en?.context ? song.culture_en.context : (song.culture?.context || "Une chanson emblématique du répertoire bachata qui continue de faire vibrer les pistes de danse.")}</p>
                </section>
                
                <section>
                  <h3 style={{ fontSize: '0.9rem', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: 900 }}>{locale === 'en' ? 'Meaning' : 'Signification'}</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{locale === 'en' && song.culture_en?.meaning ? song.culture_en.meaning : (song.culture?.meaning || "Les paroles explorent les émotions profondes et les thèmes universels de l'amour et de la passion.")}</p>
                </section>
                
                <section>
                  <h3 style={{ fontSize: '0.9rem', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: 900 }}>{locale === 'en' ? 'Artist' : 'L\'Artiste'}</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{locale === 'en' && song.culture_en?.artistInfo ? song.culture_en.artistInfo : (song.culture?.artistInfo || `${song.artist} est une figure majeure de la scène bachata contemporaine.`)}</p>
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
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>{locale === 'en' ? 'Your Goal' : 'Ton Objectif'}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
                {locale === 'en' ? 'Master the lyrics and meaning of this song to unlock your reward!' : 'Maîtrise les paroles et le sens de cette chanson pour débloquer ta récompense !'}
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
                  <><span>✅</span> {locale === 'en' ? 'Mastered!' : 'Maîtrisée !'}</>
                ) : (
                  <><span>🔥</span> {locale === 'en' ? 'Mark as learned' : 'Marquer comme apprise'}</>
                )
                }
              </button>
              
              {masteredSongs.includes(song.id) && (
                <p style={{ color: '#34d399', fontSize: '0.8rem', fontWeight: 600, marginTop: '16px', animation: 'fadeIn 0.5s ease-out' }}>
                  {locale === 'en' ? 'Congratulations! You achieved this goal.' : 'Félicitations ! Tu as validé cet objectif.'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ─── RELATED SONGS (Internal Linking) ─── */}
        <RelatedSongs currentSong={song} />

        {/* ─── FOOTER SEO ─── */}
        <SeoFooter currentPage="song" />
      </div>

      <style jsx>{`
        .seo-intro {
          max-width: 1280px;
          margin: 0 auto;
          padding: 20px 24px 0;
        }
        .seo-intro p {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.6;
          padding: 12px 20px;
          background: rgba(167, 139, 250, 0.06);
          border: 1px solid rgba(167, 139, 250, 0.12);
          border-radius: 12px;
        }
      `}</style>
    </>
  );
}
