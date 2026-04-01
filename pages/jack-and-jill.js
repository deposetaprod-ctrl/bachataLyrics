import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import { useRouter } from 'next/router';
import AuthModal from '../components/AuthModal';
import Navbar from '../components/Navbar';

export default function JackAndJill() {
  const router = useRouter();
  
  // -- State --
  const [status, setStatus] = useState('ready'); // ready | loading | playing | paused | finished
  const [songs, setSongs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionTime, setSessionTime] = useState(1800); // 30 minutes in seconds
  const [songTime, setSongTime] = useState(30); // 30 seconds for each clip
  const [totalEllapsed, setTotalEllapsed] = useState(0);
  const [user, setUser] = useState(null);
  const [supabaseClient, setSupabaseClient] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const currentSongTimerRef = useRef(null);

  const preparePlaylist = async () => {
    setStatus('loading');
    
    try {
      const savedFavs = JSON.parse(localStorage.getItem('favSongs') || '[]');
      const appSongs = require('../data/songs').songs;
      
      let finalPlaylist = [];

      // Helper to add songs uniquely
      const addSongs = (newSongs, isApp = false) => {
        newSongs.forEach(s => {
          if (!finalPlaylist.some(p => p.trackId === s.trackId || (p.trackName === s.trackName && p.artistName === s.artistName))) {
            finalPlaylist.push({
              ...s,
              isAppSong: isApp,
              isFavorite: savedFavs.includes(s.trackId || s.id)
            });
          }
        });
      };

      // 1. Add all App Songs (we'll shuffle them later)
      setStatus('Chargement des sons de l\'application...');
      const appSongsFormatted = appSongs.map(s => ({
        trackId: s.id,
        trackName: s.title,
        artistName: s.artist,
        previewUrl: s.audioUrl, // Might be undefined, we'll search if so
        id: s.id
      }));

      // Search for previews if missing
      for (let i = 0; i < appSongsFormatted.length; i++) {
        const s = appSongsFormatted[i];
        if (!s.previewUrl) {
          setStatus(`Recherche de "${s.trackName}" (${i+1}/${appSongsFormatted.length})...`);
          try {
            const res = await fetch(`/api/training-songs?type=search&term=${encodeURIComponent(s.trackName + ' ' + s.artistName)}`);
            const data = await res.json();
            const match = data.results?.[0];
            if (match?.previewUrl) {
              s.previewUrl = match.previewUrl;
              s.trackId = match.trackId;
            }
          } catch (e) {
            console.error("Error searching for", s.trackName, e);
          }
        }
      }
      addSongs(appSongsFormatted.filter(s => s.previewUrl), true);

      // 2. Fetch from various categories to ensure variety
      const categories = ['sensual', 'dominican', 'bachazouk', 'bachata'];
      for (const cat of categories) {
        if (finalPlaylist.length >= 80) break;
        setStatus(`Extraction de Bachata ${cat}...`);
        try {
          const res = await fetch(`/api/training-songs?type=${cat}`);
          const data = await res.json();
          if (data.results) {
            addSongs(data.results);
          }
        } catch (e) {
          console.error("Error fetching cat", cat, e);
        }
      }

      // 3. FULL SHUFFLE (Fisher-Yates)
      setStatus('Mixage de la playlist...');
      for (let i = finalPlaylist.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [finalPlaylist[i], finalPlaylist[j]] = [finalPlaylist[j], finalPlaylist[i]];
      }

      setSongs(finalPlaylist.slice(0, 100)); // Keep up to 100 songs
      setStatus('idle');
    } catch (error) {
      console.error('Error fetching songs:', error);
      setStatus('error');
    }
  };

  // -- Session Controls --
  const startSession = () => {
    if (songs.length === 0) return;
    setStatus('playing');
    playSong(currentIndex);
  };

  const pauseSession = () => {
    setStatus('paused');
    audioRef.current?.pause();
    clearInterval(timerRef.current);
    clearInterval(currentSongTimerRef.current);
  };

  const resumeSession = () => {
    setStatus('playing');
    audioRef.current?.play();
    startIntervals();
  };

  const resetSession = () => {
    pauseSession();
    setStatus('ready');
    setTotalEllapsed(0);
    setSongTime(30);
    setCurrentIndex(0);
    setSongs([]);
  };

  const playSong = (index) => {
    if (!songs[index]) {
      // Reached end of fetched list, loop or fetch more
      resetSession();
      return;
    }
    
    if (audioRef.current) {
      audioRef.current.src = songs[index].previewUrl;
      audioRef.current.play().catch(e => console.error("Playback error:", e));
    }
    
    startIntervals();
  };

  const startIntervals = () => {
    clearInterval(timerRef.current);
    clearInterval(currentSongTimerRef.current);

    // Global session timer
    timerRef.current = setInterval(() => {
      setTotalEllapsed(prev => {
        if (prev >= 1800) {
          clearInterval(timerRef.current);
          setStatus('finished');
          return 1800;
        }
        return prev + 1;
      });
    }, 1000);

    // Current song countdown
    currentSongTimerRef.current = setInterval(() => {
      setSongTime(prev => {
        if (prev <= 1) {
          // Time to switch song
          nextSong();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const nextSong = () => {
    setCurrentIndex(prev => {
      const nextIdx = prev + 1;
      playSong(nextIdx);
      return nextIdx;
    });
    setSongTime(30);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearInterval(currentSongTimerRef.current);
    };
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentSong = songs[currentIndex];
  const totalDuration = 1800;
  const globalProgress = (totalEllapsed / totalDuration) * 100;
  const songProgress = ((30 - songTime) / 30) * 100;

  return (
    <>
      <Head>
        <title>Jack & Jill Training — 30 Minutes d'Entraînement Bachata | Bachata Flow</title>
        <meta name="description" content="Entraîne-toi au Jack & Jill avec 30 minutes de musique bachata aléatoire. Change de style toutes les 30 secondes pour challenger ta danse." />
        <meta property="og:title" content="Jack & Jill Training — Bachata Flow" />
        <meta property="og:description" content="30 minutes d'entraînement Jack & Jill avec playlist bachata générée automatiquement." />
        <meta property="og:url" content="https://bachatalyrics.com/jack-and-jill" />
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
      <Navbar 
        user={user} 
        supabaseClient={supabaseClient} 
        onLoginClick={() => setShowLoginModal(true)} 
        activePage="jnj"
      />
      <AuthModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        supabaseClient={supabaseClient}
      />

      <main className="training-container">
        <div className="training-card">
          <div className="training-header">
            <span className="badge">Jack & Jill Training</span>
            <h1>30 Minutes d'Adrénaline</h1>
            <p>Ta playlist est générée en priorité avec tes favoris et les musiques de l'app.</p>
          </div>

          <div className="timer-section">
            <div className="global-timer">
              <span className="label">Session</span>
              <span className="time">{formatTime(totalDuration - totalEllapsed)}</span>
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${globalProgress}%` }} />
              </div>
            </div>

            <div className="song-timer">
              <span className="label">Prochain son dans</span>
              <span className="time-small">{songTime}s</span>
              <div className="progress-bar-container small">
                <div className="progress-bar song-progress" style={{ width: `${songProgress}%` }} />
              </div>
            </div>
          </div>

          {currentSong && status !== 'ready' && status !== 'loading' && status !== 'idle' && (
            <div className="current-song-info animate-fade-in">
              <div className="music-icon">🎵</div>
              <div style={{ flex: 1 }}>
                <h3>{currentSong.trackName}</h3>
                <p>{currentSong.artistName}</p>
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                  {currentSong.isFavorite && (
                    <span className="badge-style" style={{ 
                      background: 'rgba(236, 72, 153, 0.2)',
                      color: '#ec4899',
                      fontSize: '0.7rem',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      textTransform: 'uppercase',
                      fontWeight: 700
                    }}>
                      ❤️ Favori
                    </span>
                  )}
                  {currentSong.isAppSong && (
                    <span className="badge-style" style={{ 
                      background: 'rgba(124, 58, 237, 0.2)',
                      color: '#a78bfa',
                      fontSize: '0.7rem',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      textTransform: 'uppercase',
                      fontWeight: 700
                    }}>
                      ✨ App Song
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="controls">
            {status === 'ready' && (
              <div className="ready-state animate-fade-in">
                <div className="ready-icon">⚡</div>
                <h3>Prêt pour l'entraînement ?</h3>
                <p>On change de style toutes les 30 secondes pour te challenger.</p>
                <button className="btn-primary" onClick={preparePlaylist}>
                  Préparer ma session
                </button>
              </div>
            )}

            {(status !== 'ready' && status !== 'idle' && status !== 'playing' && status !== 'paused' && status !== 'finished' && status !== 'error') && (
              <div className="loading-state animate-fade-in">
                <div className="spinner"></div>
                <p>{status === 'loading' ? 'Génération de ta playlist personnalisée...' : status}</p>
                <div style={{ marginTop: '12px' }}>
                  <span className="badge-style" style={{ 
                    background: 'rgba(250, 204, 21, 0.1)',
                    color: '#facc15',
                    fontSize: '0.8rem',
                    padding: '6px 12px',
                    borderRadius: '999px',
                    border: '1px solid rgba(250, 204, 21, 0.2)'
                  }}>
                    {songs.length} sons trouvés
                  </span>
                </div>
              </div>
            )}
            
            {status === 'error' && (
              <div className="error-state">
                <p>Oups ! Impossible de charger la musique.</p>
                <button className="btn-secondary" onClick={preparePlaylist}>Réessayer</button>
                <button className="btn-ghost" onClick={resetSession}>Retour</button>
              </div>
            )}

            {status === 'idle' && songs.length > 0 && (
              <div className="ready-state animate-fade-in">
                <div className="ready-icon">🔥</div>
                <h3>Playlist Prête !</h3>
                <p>{songs.length} morceaux mixés et prêts pour 30 minutes de Jack & Jill.</p>
                <button className="btn-primary" onClick={startSession}>
                  C'est parti !
                </button>
                <button className="btn-ghost" onClick={resetSession}>Recommencer</button>
              </div>
            )}
            {status === 'playing' && (
              <button className="btn-secondary" onClick={pauseSession}>Pause</button>
            )}
            {status === 'paused' && (
              <button className="btn-primary" onClick={resumeSession}>Reprendre</button>
            )}
            {status === 'finished' && (
              <div className="finished-message">
                <h2>Félicitations ! 🎉</h2>
                <p>Tu as terminé tes 30 minutes d'entraînement.</p>
                <button className="btn-primary" onClick={resetSession}>Recommencer</button>
              </div>
            )}
            {(status === 'playing' || status === 'paused') && (
              <button className="btn-ghost" onClick={resetSession}>Arrêter</button>
            )}
          </div>
        </div>

        <audio ref={audioRef} style={{ display: 'none' }} onEnded={nextSong} />
      </main>

      <style jsx>{`
        .training-container {
          min-height: calc(100vh - 80px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: radial-gradient(circle at top right, #1e1b4b, #000);
        }
        .training-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 32px;
          padding: 48px;
          width: 100%;
          maxWidth: 600px;
          text-align: center;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .training-header h1 {
          font-size: 2.5rem;
          margin: 16px 0;
          background: linear-gradient(to bottom, #fff, #94a3b8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .badge {
          background: rgba(250, 204, 21, 0.1);
          color: #facc15;
          padding: 6px 16px;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border: 1px solid rgba(250, 204, 21, 0.2);
        }
        .timer-section {
          margin: 40px 0;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .global-timer .time {
          font-size: 4rem;
          font-weight: 800;
          display: block;
          font-variant-numeric: tabular-nums;
          color: white;
        }
        .song-timer .time-small {
          font-size: 2rem;
          font-weight: 700;
          display: block;
          color: var(--accent);
        }
        .label {
          color: var(--text-muted);
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
          display: block;
        }
        .progress-bar-container {
          height: 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          margin-top: 12px;
          overflow: hidden;
        }
        .progress-bar-container.small { height: 4px; }
        .progress-bar {
          height: 100%;
          background: linear-gradient(to right, #7c3aed, #c026d3);
          transition: width 1s linear;
        }
        .song-progress {
          background: #facc15;
        }
        .current-song-info {
          display: flex;
          align-items: center;
          gap: 16px;
          background: rgba(255, 255, 255, 0.05);
          padding: 20px;
          border-radius: 20px;
          margin-bottom: 32px;
          text-align: left;
        }
        .music-icon {
          font-size: 2rem;
          background: rgba(124, 58, 237, 0.2);
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
        }
        .current-song-info h3 { font-size: 1.1rem; margin: 0; }
        .current-song-info p { margin: 4px 0 0; color: var(--text-muted); font-size: 0.9rem; }
        .controls {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .btn-primary {
          background: linear-gradient(135deg, #7c3aed, #c026d3);
          color: white;
          padding: 16px;
          border-radius: 16px;
          font-weight: 700;
          font-size: 1.1rem;
          border: none;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          padding: 16px;
          border-radius: 16px;
          font-weight: 700;
          border: 1px solid rgba(255,255,255,0.1);
          cursor: pointer;
        }
        .btn-ghost {
          background: transparent;
          color: var(--text-muted);
          padding: 12px;
          border: none;
          cursor: pointer;
          font-size: 0.9rem;
        }
        .btn-primary:hover { transform: scale(1.02); box-shadow: 0 10px 30px -10px rgba(124, 58, 237, 0.5); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        
        .category-select h2 { font-size: 1.2rem; color: var(--text-muted); margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.1em;}
        .category-grid { display: flex; flex-direction: column; gap: 12px; }
        .category-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 20px;
          border-radius: 20px;
          color: white;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          transition: all 0.2s;
        }
        .category-btn:hover { background: rgba(255, 255, 255, 0.1); border-color: var(--accent); transform: translateY(-2px); }
        .cat-name { font-size: 1.3rem; font-weight: 800; }
        .cat-desc { font-size: 0.8rem; color: var(--text-muted); }

        .ready-state { padding: 20px; }
        .ready-icon { font-size: 3rem; margin-bottom: 16px; }
        .ready-state h3 { font-size: 1.5rem; margin: 0 0 8px; }
        .ready-state p { color: var(--text-muted); margin-bottom: 24px; }

        .loading-state, .error-state {
          padding: 20px;
          color: var(--text-muted);
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255,255,255,0.1);
          border-top-color: var(--accent);
          border-radius: 50%;
          margin: 0 auto 16px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
