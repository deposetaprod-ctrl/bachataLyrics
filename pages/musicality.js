import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Script from 'next/script';
import { songs as allSongs } from '../data/songs';
import MusicalityHUD from '../components/MusicalityHUD';

export default function MusicalityTrainer() {
  const router = useRouter();
  const [selectedSongId, setSelectedSongId] = useState('');
  const [markers, setMarkers] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [upcomingMarker, setUpcomingMarker] = useState(null);
  
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);

  // -- Load Wavesurfer from CDN --
  const initWavesurfer = () => {
    if (!window.WaveSurfer || !waveformRef.current) return;

    if (wavesurfer.current) {
      wavesurfer.current.destroy();
    }

    wavesurfer.current = window.WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#4f46e5',
      progressColor: '#a855f7',
      cursorColor: '#fff',
      barWidth: 2,
      barRadius: 3,
      responsive: true,
      height: 120,
      normalize: true,
      partialRender: true
    });

    wavesurfer.current.on('audioprocess', () => {
      setCurrentTime(wavesurfer.current.getCurrentTime());
    });

    wavesurfer.current.on('play', () => setIsPlaying(true));
    wavesurfer.current.on('pause', () => setIsPlaying(false));
    wavesurfer.current.on('finish', () => setIsPlaying(false));
  };

  // -- Load Song --
  useEffect(() => {
    if (selectedSongId && wavesurfer.current) {
      const song = allSongs.find(s => s.id === selectedSongId);
      if (song && song.audioUrl) {
        wavesurfer.current.load(song.audioUrl);
        // Load markers from localStorage
        const savedMarkers = JSON.parse(localStorage.getItem(`markers-${selectedSongId}`) || '[]');
        setMarkers(savedMarkers);
      }
    }
  }, [selectedSongId]);

  // -- Keyboard Shortcuts for Recording --
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isRecording || !wavesurfer.current) return;

      const time = wavesurfer.current.getCurrentTime();
      let type = '';
      let label = '';
      let color = '';

      switch (e.key.toLowerCase()) {
        case 'b': type = 'bongo'; label = 'Bongo'; color = '#3b82f6'; break;
        case 'r': type = 'roll'; label = 'Bongo Roll'; color = '#a855f7'; break;
        case 'k': type = 'break'; label = 'Break'; color = '#ef4444'; break;
        case 'g': type = 'guira'; label = 'Guira'; color = '#10b981'; break;
        default: return;
      }

      const newMarker = { time, type, label, color, id: Date.now() };
      const updatedMarkers = [...markers, newMarker].sort((a, b) => a.time - b.time);
      setMarkers(updatedMarkers);
      localStorage.setItem(`markers-${selectedSongId}`, JSON.stringify(updatedMarkers));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, markers, selectedSongId]);

  // -- Warning System (HUD) --
  useEffect(() => {
    const nextMarker = markers.find(m => m.time > currentTime);
    setUpcomingMarker(nextMarker || null);
  }, [currentTime, markers]);

  const togglePlay = () => wavesurfer.current?.playPause();
  const toggleRecording = () => setIsRecording(!isRecording);
  
  const clearMarkers = () => {
    if (confirm('Supprimer tous les marqueurs pour cette chanson ?')) {
      setMarkers([]);
      localStorage.removeItem(`markers-${selectedSongId}`);
    }
  };

  return (
    <div className="musicality-page">
      <Head>
        <title>Musicality Trainer — Bachata Lyrics</title>
      </Head>

      <Script 
        src="https://unpkg.com/wavesurfer.js@7/dist/wavesurfer.min.js" 
        onLoad={initWavesurfer}
      />

      <nav className="navbar">
        <div className="navbar-inner">
          <div className="logo" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
            <div className="logo-icon">🎶</div>
            <span className="logo-text">Musicality Trainer</span>
          </div>
          <div className="nav-links">
            <span onClick={() => router.push('/')}>Accueil</span>
            <span onClick={() => router.push('/jack-and-jill')}>Jack & Jill</span>
          </div>
        </div>
      </nav>

      <main className="container trainer-content">
        <div className="trainer-header">
          <h1>Entraîne ton oreille Musicale</h1>
          <p>Analyse tes morceaux préférés et marque les bongos, rolls et breaks pour ne plus jamais les rater.</p>
        </div>

        <div className="song-selection-card">
          <label>Choisir une chanson à analyser</label>
          <select 
            value={selectedSongId} 
            onChange={(e) => setSelectedSongId(e.target.value)}
            className="song-select"
          >
            <option value="">-- Sélectionner une chanson --</option>
            {allSongs.filter(s => s.audioUrl).map(song => (
              <option key={song.id} value={song.id}>{song.title} - {song.artist}</option>
            ))}
          </select>
        </div>

        {selectedSongId && (
          <div className="player-section animate-fade-in">
            <div className="waveform-container" ref={waveformRef}>
              {markers.map(marker => (
                <div 
                  key={marker.id}
                  className="marker-line"
                  style={{ 
                    left: `${(marker.time / (wavesurfer.current?.getDuration() || 1)) * 100}%`,
                    backgroundColor: marker.color 
                  }}
                  title={marker.label}
                />
              ))}
            </div>

            <div className="controls-row">
              <button className={`btn-icon ${isPlaying ? 'playing' : ''}`} onClick={togglePlay}>
                {isPlaying ? '⏸' : '▶️'}
              </button>
              
              <div className="spacer" />

              <button 
                className={`btn-record ${isRecording ? 'active' : ''}`} 
                onClick={toggleRecording}
              >
                {isRecording ? '⏹ Arrêter' : '⏺ Enregistrer'}
              </button>

              <button className="btn-ghost" onClick={clearMarkers}>Effacer tout</button>
            </div>

            {isRecording && (
              <div className="recording-hint animate-pulse">
                Appuie sur : <span><b>B</b> (Bongo)</span> <span><b>R</b> (Roll)</span> <span><b>K</b> (Break)</span> <span><b>G</b> (Guira)</span>
              </div>
            )}

            <div className="markers-list">
              <h3>Marqueurs ({markers.length})</h3>
              <div className="markers-grid">
                {markers.length === 0 && <p className="empty-msg">Aucun marqueur pour le moment.</p>}
                {markers.map(m => (
                  <div key={m.id} className="marker-item" onClick={() => wavesurfer.current.setTime(m.time)}>
                    <span className="marker-dot" style={{ backgroundColor: m.color }} />
                    <span className="marker-time">{Math.floor(m.time / 60)}:{(m.time % 60).toFixed(1).padStart(4, '0')}</span>
                    <span className="marker-label">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <MusicalityHUD upcomingMarker={upcomingMarker} currentTime={currentTime} />
      </main>

      <style jsx>{`
        .musicality-page {
          min-height: 100vh;
          background: var(--bg-primary);
        }
        .trainer-content {
          padding-top: 48px;
          padding-bottom: 120px;
        }
        .trainer-header {
          text-align: center;
          margin-bottom: 48px;
        }
        .trainer-header h1 {
          font-family: 'Playfair Display', serif;
          font-size: 3rem;
          margin-bottom: 12px;
        }
        .trainer-header p {
          color: var(--text-secondary);
          max-width: 600px;
          margin: 0 auto;
        }
        .song-selection-card {
          background: var(--bg-card);
          padding: 32px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          max-width: 600px;
          margin: 0 auto 40px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .song-select {
          width: 100%;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          padding: 12px 20px;
          border-radius: var(--radius-md);
          color: white;
          font-size: 1rem;
          cursor: pointer;
        }
        .player-section {
          background: var(--bg-card);
          padding: 40px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          box-shadow: 0 40px 100px -20px rgba(0,0,0,0.5);
        }
        .waveform-container {
          position: relative;
          background: rgba(0,0,0,0.2);
          border-radius: var(--radius-md);
          margin-bottom: 32px;
          overflow: hidden;
          direction: ltr; /* Ensure wavesurfer draws correctly if LTR */
        }
        .marker-line {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 2px;
          z-index: 5;
          pointer-events: none;
        }
        .controls-row {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-bottom: 24px;
        }
        .btn-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: var(--accent);
          color: white;
          font-size: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        }
        .btn-icon:hover { transform: scale(1.1); }
        .spacer { flex: 1; }
        .btn-record {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border);
          padding: 12px 24px;
          border-radius: 999px;
          color: white;
          font-weight: 700;
          transition: all 0.2s;
        }
        .btn-record.active {
          background: var(--red);
          border-color: #ff6b6b;
          animation: pulse 2s infinite;
        }
        .recording-hint {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 32px;
          text-align: center;
          color: var(--text-secondary);
          display: flex;
          justify-content: center;
          gap: 20px;
        }
        .recording-hint span { color: white; }
        .markers-list h3 { margin-bottom: 16px; }
        .markers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 12px;
        }
        .marker-item {
          background: var(--bg-secondary);
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .marker-item:hover { border-color: var(--accent); }
        .marker-dot { width: 8px; height: 8px; border-radius: 50%; }
        .marker-time { font-family: monospace; font-size: 0.8rem; }
        .marker-label { font-size: 0.85rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .empty-msg { color: var(--text-muted); grid-column: 1 / -1; }
        
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.5s ease-out; }
      `}</style>
    </div>
  );
}
