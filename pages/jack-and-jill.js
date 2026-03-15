import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function JackAndJill() {
  const router = useRouter();
  
  // -- State --
  const [status, setStatus] = useState('category_select'); // category_select | loading | playing | paused | finished
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [songs, setSongs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionTime, setSessionTime] = useState(1800); // 30 minutes in seconds
  const [songTime, setSongTime] = useState(30); // 30 seconds for each clip
  const [totalEllapsed, setTotalEllapsed] = useState(0);
  
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const currentSongTimerRef = useRef(null);

  const categories = {
    sensual: { name: 'Sensuel', ratios: { sensual: 36, fusion: 12, dominican: 12 } },
    fusion: { name: 'Influence', ratios: { fusion: 36, sensual: 12, dominican: 12 } },
    dominican: { name: 'Dominicain', ratios: { dominican: 36, sensual: 12, fusion: 12 } }
  };

  // -- iTunes API Fetch with Ratios --
  const preparePlaylist = async (categoryKey) => {
    setStatus('loading');
    setSelectedCategory(categoryKey);
    const category = categories[categoryKey];
    
    try {
      const allFetchedSongs = [];
      
      // Fetch each type based on ratios
      for (const [type, count] of Object.entries(category.ratios)) {
        const res = await fetch(`/api/training-songs?type=${type}`);
        const data = await res.json();
        const filtered = data.results.filter(s => s.previewUrl);
        // Take N random songs from this type
        const sampled = filtered.sort(() => Math.random() - 0.5).slice(0, count);
        allFetchedSongs.push(...sampled.map(s => ({ ...s, danceStyle: type })));
      }

      // Final shuffle of the mixed playlist
      const shuffledPlaylist = allFetchedSongs.sort(() => Math.random() - 0.5);
      setSongs(shuffledPlaylist);
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
    setStatus('category_select');
    setTotalEllapsed(0);
    setSongTime(30);
    setCurrentIndex(0);
    setSongs([]);
    setSelectedCategory(null);
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
        <title>Jack & Jill Training — Bachata Lyrics</title>
      </Head>

      <nav className="navbar">
        <div className="navbar-inner">
          <div className="logo" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
            <div className="logo-icon">🎶</div>
            <span className="logo-text">Bachata Lyrics</span>
          </div>
          <div className="nav-links" style={{ display: 'flex', gap: '24px', fontWeight: 600 }}>
            <span style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => router.push('/')}>Sons</span>
            <span style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => router.push('/passes')}>Passes</span>
            <span style={{ cursor: 'pointer', color: 'var(--accent)' }}>Jack & Jill</span>
          </div>
        </div>
      </nav>

      <main className="training-container">
        <div className="training-card">
          <div className="training-header">
            <span className="badge">Jack & Jill Training</span>
            <h1>30 Minutes d'Adrénaline</h1>
            <p>On change de style toutes les 30 secondes. Prêt pour le défi ?</p>
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

          {currentSong && status !== 'idle' && (
            <div className="current-song-info animate-fade-in">
              <div className="music-icon">🎵</div>
              <div>
                <h3>{currentSong.trackName}</h3>
                <p>{currentSong.artistName}</p>
                <div style={{ marginTop: '8px' }}>
                  <span className="badge-style" style={{ 
                    background: currentSong.danceStyle === 'sensual' ? 'rgba(236, 72, 153, 0.2)' : 
                                currentSong.danceStyle === 'fusion' ? 'rgba(124, 58, 237, 0.2)' : 
                                'rgba(250, 204, 21, 0.2)',
                    color: currentSong.danceStyle === 'sensual' ? '#ec4899' : 
                           currentSong.danceStyle === 'fusion' ? '#a78bfa' : 
                           '#facc15',
                    fontSize: '0.7rem',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    textTransform: 'uppercase',
                    fontWeight: 700
                  }}>
                    {currentSong.danceStyle === 'sensual' ? 'Sensuel' : 
                     currentSong.danceStyle === 'fusion' ? 'Influence' : 
                     'Dominicain'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="controls">
            {status === 'category_select' && (
              <div className="category-select animate-fade-in">
                <h2>Choisis ton style d'entraînement</h2>
                <div className="category-grid">
                  {Object.entries(categories).map(([key, cat]) => (
                    <button key={key} className="category-btn" onClick={() => preparePlaylist(key)}>
                      <span className="cat-name">{cat.name}</span>
                      <span className="cat-desc">
                        {key === 'fusion' 
                          ? '60% Remix (DJ Cat, Melvin & Gatica) / 20% Sensuel / 20% Dom.'
                          : `60% ${cat.name} / 20% Influence / 20% Dominicain`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(status === 'loading') && (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Création de ta playlist {categories[selectedCategory]?.name} personnalisée...</p>
                <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Récupération des 60 morceaux...</p>
              </div>
            )}
            
            {status === 'error' && (
              <div className="error-state">
                <p>Oups ! Impossible de charger la musique.</p>
                <button className="btn-secondary" onClick={() => preparePlaylist(selectedCategory)}>Réessayer</button>
                <button className="btn-ghost" onClick={resetSession}>Changer de style</button>
              </div>
            )}

            {status === 'idle' && songs.length > 0 && (
              <div className="ready-state animate-fade-in">
                <div className="ready-icon">⚖️</div>
                <h3>Playlist Prête !</h3>
                <p>60 morceaux de bachata mixés et prêts pour 30 minutes de Jack & Jill.</p>
                <button className="btn-primary" onClick={startSession}>
                  C'est parti !
                </button>
                <button className="btn-ghost" onClick={resetSession}>Changer de style</button>
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
