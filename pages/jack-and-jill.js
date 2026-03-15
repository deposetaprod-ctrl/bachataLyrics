import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function JackAndJill() {
  const router = useRouter();
  
  // -- State --
  const [status, setStatus] = useState('idle'); // idle | loading | playing | paused | finished
  const [songs, setSongs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionTime, setSessionTime] = useState(1800); // 30 minutes in seconds
  const [songTime, setSongTime] = useState(30); // 30 seconds for each clip
  const [totalEllapsed, setTotalEllapsed] = useState(0);
  
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const currentSongTimerRef = useRef(null);

  // -- iTunes API Fetch --
  const fetchBachataSongs = async () => {
    setStatus('loading');
    try {
      // Fetching songs via our internal API proxy to avoid CORS/Network issues
      const res = await fetch('/api/training-songs');
      const data = await res.json();
      const filtered = data.results.filter(song => song.previewUrl);
      // Shuffle songs
      const shuffled = filtered.sort(() => Math.random() - 0.5);
      setSongs(shuffled);
      setStatus('idle');
    } catch (error) {
      console.error('Error fetching songs:', error);
      setStatus('error');
    }
  };

  useEffect(() => {
    fetchBachataSongs();
  }, []);

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
    setStatus('idle');
    setTotalEllapsed(0);
    setSongTime(30);
    setCurrentIndex(0);
    // Re-shuffle for next time
    setSongs([...songs].sort(() => Math.random() - 0.5));
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
              </div>
            </div>
          )}

          <div className="controls">
            {(status === 'loading' || (status === 'idle' && songs.length === 0)) && (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Récupération des morceaux de bachata...</p>
              </div>
            )}
            
            {status === 'error' && (
              <div className="error-state">
                <p>Oups ! Impossible de charger la musique.</p>
                <button className="btn-secondary" onClick={fetchBachataSongs}>Réessayer</button>
              </div>
            )}

            {status === 'idle' && songs.length > 0 && (
              <button className="btn-primary" onClick={startSession}>
                Démarrer la Session
              </button>
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
