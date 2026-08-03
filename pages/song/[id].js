import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
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
  return { paths, fallback: 'blocking' };
}

export async function getStaticProps({ params }) {
  let song = songs.find((s) => s.id === params.id) || null;

  if (!song) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase.from('songs').select('*').eq('id', params.id).single();
      if (data && !error) {
        song = data;
      }
    }
  }

  if (!song) {
    return { notFound: true };
  }

  return { props: { song }, revalidate: 60 };
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
  const [activeMarkerDetail, setActiveMarkerDetail] = useState(null);

  // Editor mode state
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [editableLyrics, setEditableLyrics] = useState(song?.lyrics || {});
  const [addNoteModal, setAddNoteModal] = useState(null);
  const [noteForm, setNoteForm] = useState({ emoji: '🥁', label: '', detail: '' });
  const [isSavingLyrics, setIsSavingLyrics] = useState(false);

  const normalizeAndTokenize = (line) => {
    const normalized = line.replace(/\[/g, ' [').replace(/\]/g, '] ').replace(/\s+/g, ' ').trim();
    return normalized.split(' ');
  };

  const handleSaveNote = () => {
    if (!noteForm.label) return;
    const tag = noteForm.detail 
      ? `[${noteForm.emoji}|${noteForm.label}|${noteForm.detail}]` 
      : `[${noteForm.emoji}|${noteForm.label}]`;
      
    const { lang, lineIndex, tIdx, line } = addNoteModal;
    const tokens = normalizeAndTokenize(line);
    tokens.splice(tIdx + 1, 0, tag);
    const newLine = tokens.join(' ').replace(/ \]/g, ']').replace(/\[ /g, '[');
    
    const newLines = editableLyrics[lang].split('\n');
    newLines[lineIndex] = newLine;
    
    setEditableLyrics({
      ...editableLyrics,
      [lang]: newLines.join('\n')
    });
    setAddNoteModal(null);
    setNoteForm({ emoji: '🥁', label: '', detail: '' });
  };

  const saveLyricsToServer = async () => {
    setIsSavingLyrics(true);
    try {
      const originalLang = editableLyrics.es ? 'es' : (editableLyrics.en ? 'en' : Object.keys(editableLyrics)[0]);
      const res = await fetch('/api/admin/update-lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songId: song.id,
          lang: originalLang,
          newLyrics: editableLyrics[originalLang]
        })
      });
      if (res.ok) alert('Sauvegardé avec succès dans data/songs.js !');
      else alert('Erreur lors de la sauvegarde.');
    } catch (err) {
      alert('Erreur réseau.');
    }
    setIsSavingLyrics(false);
  };

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
            {process.env.NODE_ENV === 'development' && (
              <>
                {isEditingMode && (
                  <button 
                    onClick={saveLyricsToServer} 
                    className="favorite-btn"
                    disabled={isSavingLyrics}
                    style={{ background: '#3b82f6', color: 'white', fontWeight: 'bold' }}
                  >
                    {isSavingLyrics ? '⏳' : '💾 Sauver'}
                  </button>
                )}
                <button 
                  onClick={() => setIsEditingMode(!isEditingMode)} 
                  className="favorite-btn"
                >
                  {isEditingMode ? '❌ Quitter' : '✏️ Éditer'}
                </button>
              </>
            )}
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
            const MARKERS = {
              bongo: { label: 'Bongo', emoji: '🥁', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
              guira: { label: 'Güira', emoji: '🥄', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
              break: { label: 'Break', emoji: '⚡', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
              requinto: { label: 'Requinto', emoji: '🎸', color: '#84cc16', bg: 'rgba(132, 204, 22, 0.15)' },
              bass: { label: 'Bass', emoji: '🎸', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
              mambo: { label: 'Mambo', emoji: '🎺', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' }
            };

            const renderLineWithMarkers = (text) => {
              if (!text) return text;
              const regex = /\[(.*?)\]/g;
              const parts = [];
              let lastIndex = 0;
              let match;
              
              while ((match = regex.exec(text)) !== null) {
                if (match.index > lastIndex) {
                  parts.push(text.substring(lastIndex, match.index));
                }
                
                const content = match[1];
                let markerObj = null;

                if (content.includes('|')) {
                  // Custom format: [emoji|Label|Detail]
                  const [emoji, label, detail] = content.split('|');
                  markerObj = { 
                    emoji: emoji?.trim(), 
                    label: label?.trim(), 
                    detail: detail?.trim(),
                    color: '#e2e8f0',
                    bg: 'rgba(255,255,255,0.1)'
                  };
                } else {
                  const keyword = content.toLowerCase();
                  if (MARKERS[keyword]) {
                    markerObj = MARKERS[keyword];
                  }
                }
                
                if (markerObj) {
                  const isClickable = !!markerObj.detail;
                  parts.push(
                    <span 
                      key={match.index} 
                      className="inline-marker" 
                      onClick={isClickable ? () => setActiveMarkerDetail(markerObj) : undefined}
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        background: markerObj.bg,
                        color: markerObj.color,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        marginLeft: '6px',
                        marginRight: '6px',
                        verticalAlign: 'middle',
                        transform: 'translateY(-2px)',
                        cursor: isClickable ? 'pointer' : 'default',
                        boxShadow: isClickable ? '0 0 0 1px rgba(255,255,255,0.2)' : 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span>{markerObj.emoji}</span>
                      <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{markerObj.label}</span>
                    </span>
                  );
                } else {
                  // Standard structure tag (like Verso, Coro)
                  parts.push(
                    <span key={match.index} style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9em' }}>
                      [{match[1]}]
                    </span>
                  );
                }
                lastIndex = regex.lastIndex;
              }
              
              if (lastIndex < text.length) {
                parts.push(text.substring(lastIndex));
              }
              return parts.length > 0 ? parts : text;
            };

            // Determine the "original" language: prefer 'es', then 'en', then first available
            const originalLang = editableLyrics.es ? 'es' : (editableLyrics.en ? 'en' : Object.keys(editableLyrics)[0]);
            const originalLines = editableLyrics[originalLang].split('\n');
            // Determine the "translation" language
            const targetLocale = locale === 'en' && editableLyrics.en && originalLang !== 'en' ? 'en' : 'fr';
            const targetLines = (editableLyrics[targetLocale] || '').split('\n');

            return originalLines.map((origLine, i) => {
              const targetLine = targetLines[i] || '';
              if (!origLine.trim() && !targetLine.trim()) return <div key={i} style={{ height: '20px' }} />;
              
              const renderLine = (line, lang, lineIndex) => {
                if (!isEditingMode) return renderLineWithMarkers(line);
                
                const tokens = normalizeAndTokenize(line);
                return tokens.map((token, tIdx) => {
                  if (token.startsWith('[') && token.endsWith(']')) {
                    return <span key={tIdx}>{renderLineWithMarkers(token)}</span>;
                  }
                  if (!token.trim()) return <span key={tIdx}> </span>;
                  
                  return (
                    <span 
                      key={tIdx} 
                      className="editable-word" 
                      onClick={() => setAddNoteModal({ lang, lineIndex, tIdx, line })}
                    >
                      {token}{' '}
                    </span>
                  );
                });
              };

              return (
                <div key={i} className="lyric-pair">
                  {origLine !== undefined && <div className={`lyric-${originalLang}`}>{renderLine(origLine, originalLang, i)}</div>}
                  {targetLine !== undefined && originalLang !== targetLocale && <div className={`lyric-${targetLocale}`}>{renderLine(targetLine, targetLocale, i)}</div>}
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

      {activeMarkerDetail && (
        <div className="marker-modal-overlay" onClick={() => setActiveMarkerDetail(null)}>
          <div className="marker-modal-content" onClick={e => e.stopPropagation()}>
            <div className="marker-modal-header">
              <span className="marker-modal-emoji">{activeMarkerDetail.emoji}</span>
              <h3>{activeMarkerDetail.label}</h3>
            </div>
            <p className="marker-modal-detail">{activeMarkerDetail.detail}</p>
            <button className="marker-modal-close" onClick={() => setActiveMarkerDetail(null)}>
              {locale === 'en' ? 'Close' : 'Fermer'}
            </button>
          </div>
        </div>
      )}

      {addNoteModal && (
        <div className="marker-modal-overlay" onClick={() => setAddNoteModal(null)}>
          <div className="marker-modal-content add-note-modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '16px', color: 'white' }}>Ajouter une note</h3>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input 
                type="text" 
                placeholder="Emoji (ex: 🥁)" 
                value={noteForm.emoji} 
                onChange={e => setNoteForm({...noteForm, emoji: e.target.value})}
                style={{ width: '80px', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', textAlign: 'center' }}
              />
              <input 
                type="text" 
                placeholder="Titre (ex: Bongo)" 
                value={noteForm.label} 
                onChange={e => setNoteForm({...noteForm, label: e.target.value})}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
              />
            </div>
            
            <textarea 
              placeholder="Détail caché (optionnel) - Affiché au clic" 
              value={noteForm.detail} 
              onChange={e => setNoteForm({...noteForm, detail: e.target.value})}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', minHeight: '80px', marginBottom: '16px', resize: 'vertical' }}
            />
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setAddNoteModal(null)}
                style={{ padding: '10px 16px', background: 'transparent', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button 
                onClick={handleSaveNote}
                disabled={!noteForm.label}
                style={{ padding: '10px 24px', background: noteForm.label ? '#8b5cf6' : 'gray', color: 'white', borderRadius: '8px', border: 'none', cursor: noteForm.label ? 'pointer' : 'default', fontWeight: 'bold' }}
              >
                Insérer ici
              </button>
            </div>
          </div>
        </div>
      )}

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
        .editable-word {
          cursor: pointer;
          transition: all 0.2s;
          border-radius: 4px;
          display: inline-block;
        }
        .editable-word:hover {
          background: rgba(167, 139, 250, 0.4);
          color: white;
          transform: scale(1.05);
        }
        .inline-marker:hover {
          filter: brightness(1.2);
        }
        .marker-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.7);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(4px);
        }
        .marker-modal-content {
          background: var(--bg-card, #1e1e24);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 24px;
          border-radius: 20px;
          max-width: 400px;
          width: 90%;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          animation: fadeIn 0.2s ease-out;
        }
        .marker-modal-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .marker-modal-emoji {
          font-size: 2rem;
        }
        .marker-modal-content h3 {
          font-size: 1.5rem;
          margin: 0;
          color: white;
        }
        .marker-modal-detail {
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 24px;
        }
        .marker-modal-close {
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          padding: 10px 20px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }
        .marker-modal-close:hover {
          background: rgba(255,255,255,0.2);
        }
      `}</style>
    </>
  );
}
