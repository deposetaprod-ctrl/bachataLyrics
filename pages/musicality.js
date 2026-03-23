import Head from 'next/head';
import { useRouter } from 'next/router';
import Script from 'next/script';
import { songs as allSongs } from '../data/songs';
import MusicalityHUD from '../components/MusicalityHUD';
import { redirectToAuthCodeFlow, getAccessToken, fetchAudioAnalysis } from '../utils/spotify';

export default function MusicalityTrainer() {
  const router = useRouter();
  const [selectedSongId, setSelectedSongId] = useState('');
  const [localFile, setLocalFile] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [upcomingMarker, setUpcomingMarker] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [manualTimer, setManualTimer] = useState(null);
  const [showFlash, setShowFlash] = useState(null);

  // -- Spotify Pro States --
  const [clientId, setClientId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [spotifyAnalysis, setSpotifyAnalysis] = useState(null);
  const [spotifyPlayer, setSpotifyPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  
  const waveformRef = useRef(null);
  const audioRef = useRef(null);
  const wavesurfer = useRef(null);

  // -- Load Wavesurfer from CDN --
  const initWavesurfer = () => {
    if (!window.WaveSurfer || !waveformRef.current || !audioRef.current) return;

    if (wavesurfer.current) {
      wavesurfer.current.destroy();
    }

    wavesurfer.current = window.WaveSurfer.create({
      container: waveformRef.current,
      media: audioRef.current, // Use the actual audio element for better compatibility
      waveColor: 'rgba(255, 255, 255, 0.1)',
      progressColor: 'var(--accent)',
      cursorColor: '#fff',
      barWidth: 3,
      barGap: 3,
      barRadius: 4,
      responsive: true,
      height: 120,
      normalize: true,
      hideScrollbar: true,
      interact: true,
      fillParent: true,
    });

    wavesurfer.current.on('audioprocess', () => {
      setCurrentTime(wavesurfer.current.getCurrentTime());
    });

    wavesurfer.current.on('play', () => setIsPlaying(true));
    wavesurfer.current.on('pause', () => setIsPlaying(false));
    wavesurfer.current.on('finish', () => setIsPlaying(false));
    
    wavesurfer.current.on('ready', () => {
      setIsLoading(false);
    });

    wavesurfer.current.on('error', (err) => {
      console.error('Wavesurfer error:', err);
      setIsLoading(false);
    });
  };

  // -- Spotify Player Lifecycle --
  useEffect(() => {
    // Handle OAuth Callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const savedId = localStorage.getItem('spotify_client_id');
    if (savedId) setClientId(savedId);

    if (code && savedId) {
      getAccessToken(savedId, code).then(data => {
        if (data.access_token) {
          setAccessToken(data.access_token);
          window.history.replaceState({}, document.title, "/musicality");
        }
      });
    }

    // Load Spotify SDK
    window.onSpotifyWebPlaybackSDKReady = () => {
      if (!accessToken) return;
      
      const player = new window.Spotify.Player({
        name: 'Bachata Musicality Trainer',
        getOAuthToken: cb => { cb(accessToken); },
        volume: 0.5
      });

      player.addListener('ready', ({ device_id }) => {
        console.log('Spotify Player Ready:', device_id);
        setDeviceId(device_id);
      });

      player.addListener('player_state_changed', state => {
        if (!state) return;
        setIsPlaying(!state.paused);
        setCurrentTime(state.position / 1000);
      });

      player.connect();
      setSpotifyPlayer(player);
    };
  }, [accessToken]);

  // -- Load Song or Local File --
  useEffect(() => {
    if (manualTimer) clearInterval(manualTimer);
    setManualTimer(null);
    if (!spotifyPlayer) setCurrentTime(0); // If not Spotify, reset time
    setIsPlaying(false);
    setIsRecording(false);
    setSpotifyAnalysis(null);

    const song = allSongs.find(s => s.id === selectedSongId);

    if (localFile && audioRef.current) {
      setIsLoading(true);
      const url = URL.createObjectURL(localFile);
      audioRef.current.src = url;
      const savedMarkers = JSON.parse(localStorage.getItem(`markers-local-${localFile.name}`) || '[]');
      setMarkers(savedMarkers);
      if (window.WaveSurfer) {
        initWavesurfer();
        wavesurfer.current.load(url);
      }
      return () => URL.revokeObjectURL(url);
    } else if (selectedSongId) {
      const savedMarkers = JSON.parse(localStorage.getItem(`markers-${selectedSongId}`) || '[]');
      setMarkers(savedMarkers);

      if (song && song.audioUrl) {
        setIsLoading(true);
        if (window.WaveSurfer) {
          initWavesurfer();
          wavesurfer.current.load(song.audioUrl);
        }
      } else if (song && song.spotifyId && accessToken) {
        setIsLoading(true);
        fetchAudioAnalysis(accessToken, song.spotifyId).then(data => {
          setSpotifyAnalysis(data);
          setIsLoading(false);
        });
      }
    }
  }, [selectedSongId, localFile, accessToken]);

  // -- Keyboard Shortcuts for Recording --
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isRecording) return;
      
      const time = (wavesurfer.current && wavesurfer.current.getDuration() > 0) 
        ? wavesurfer.current.getCurrentTime() 
        : currentTime;

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

      // Visual Flash feedback
      setShowFlash(type);
      setTimeout(() => setShowFlash(null), 150);

      const newMarker = { time, type, label, color, id: Date.now() };
      const updatedMarkers = [...markers, newMarker].sort((a, b) => a.time - b.time);
      setMarkers(updatedMarkers);
      
      const storageKey = localFile ? `markers-local-${localFile.name}` : `markers-${selectedSongId}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedMarkers));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, markers, selectedSongId, localFile, currentTime]);

  // -- Warning System (HUD) --
  useEffect(() => {
    const nextMarker = markers.find(m => m.time > currentTime);
    setUpcomingMarker(nextMarker || null);
  }, [currentTime, markers]);

  const togglePlay = () => {
    const song = allSongs.find(s => s.id === selectedSongId);
    
    if (wavesurfer.current && wavesurfer.current.getDuration() > 0) {
      wavesurfer.current.playPause();
    } else if (spotifyPlayer && deviceId && song?.spotifyId) {
      // Automatic Spotify Playback via SDK
      if (isPlaying) {
        spotifyPlayer.pause();
      } else {
        // Start playback on this device
        fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
          method: 'PUT',
          body: JSON.stringify({ uris: [`spotify:track:${song.spotifyId}`], position_ms: currentTime * 1000 }),
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
      }
    } else {
      // Manual fallback
      if (isPlaying) {
        if (manualTimer) clearInterval(manualTimer);
        setManualTimer(null);
        setIsPlaying(false);
        setIsRecording(false);
      } else {
        setIsPlaying(true);
        const start = Date.now() - (currentTime * 1000);
        const timer = setInterval(() => {
          setCurrentTime((Date.now() - start) / 1000);
        }, 50);
        setManualTimer(timer);
      }
    }
  };

  const loginSpotify = () => {
    if (!clientId) return alert("Veuillez entrer votre Client ID Spotify");
    localStorage.setItem('spotify_client_id', clientId);
    redirectToAuthCodeFlow(clientId);
  };

  const toggleRecording = () => setIsRecording(!isRecording);
  
  const clearMarkers = () => {
    if (confirm('Supprimer tous les marqueurs pour cette chanson ?')) {
      setMarkers([]);
      const storageKey = localFile ? `markers-local-${localFile.name}` : `markers-${selectedSongId}`;
      localStorage.removeItem(storageKey);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedSongId('');
      setLocalFile(file);
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
      <Script 
        src="https://sdk.scdn.co/spotify-player.js"
      />

      <header className="navbar">
        <div className="navbar-inner">
          <div className="logo" onClick={() => router.push('/')}>
            <div className="logo-icon">🎶</div>
            <span className="logo-text">Musicality</span>
          </div>
          <div className="nav-links">
            <span onClick={() => router.push('/')}>Accueil</span>
            <span onClick={() => router.push('/passes')}>Passes</span>
            <span onClick={() => router.push('/jack-and-jill')}>Jack & Jill</span>
          </div>
        </div>
      </header>

      <main className="container trainer-content">
        <div className="trainer-header">
          <h1>Analyse Musicale</h1>
          <p>Enregistre les instruments en temps réel pour ne plus jamais rater un bongo ou un break.</p>
        </div>

        <div className="song-selection-card glass">
          <div className="selection-tabs">
            <button className={!localFile ? 'active' : ''} onClick={() => setLocalFile(null)}>Bibliothèque</button>
            <button className={localFile ? 'active' : ''} onClick={() => document.getElementById('file-upload').click()}>Importer MP3</button>
          </div>

          <input 
            id="file-upload" 
            type="file" 
            accept="audio/*" 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
          />

          {!localFile ? (
            <div className="select-wrapper animate-fade-in">
              <select 
                value={selectedSongId} 
                onChange={(e) => setSelectedSongId(e.target.value)}
                className="song-select"
              >
                <option value="">-- Choisir une chanson --</option>
                {allSongs.map(song => (
                  <option key={song.id} value={song.id}>{song.title} - {song.artist} {song.audioUrl ? ' (Visuel ✅)' : ' (Spotify 🔗)'}</option>
                ))}
              </select>

              {selectedSongId && !allSongs.find(s => s.id === selectedSongId).audioUrl && (
                <div className="spotify-auth-zone glass animate-fade-in">
                  {!accessToken ? (
                    <>
                      <input 
                        className="token-input" 
                        placeholder="Ton Spotify Client ID..." 
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                      />
                      <button className="btn-spotify" onClick={loginSpotify}>
                        <span className="icon">🔓</span> Se connecter à Spotify
                      </button>
                      <p className="help-text">Nécessaire pour le visuel et la synchronisation automatique.</p>
                    </>
                  ) : (
                    <div className="auth-status">
                      <span className="status-dot green" /> Spotify Connecté
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="local-file-info animate-fade-in">
              <div className="file-box">
                <span className="file-icon">📁</span>
                <span className="file-name">{localFile.name}</span>
                <button className="change-btn" onClick={() => document.getElementById('file-upload').click()}>Changer</button>
              </div>
            </div>
          )}
        </div>

        {(selectedSongId || localFile) && (
          <div className="player-section animate-fade-in glass">
            {showFlash && (
              <div className={`screen-flash ${showFlash}`} />
            )}
            
            {isLoading && (
              <div className="loading-overlay">
                <div className="spinner" />
                <span>Chargement...</span>
              </div>
            )}
            
            <audio ref={audioRef} crossOrigin="anonymous" />

            <div className="waveform-wrapper">
              <div className="waveform-container" ref={waveformRef} style={{ display: spotifyAnalysis && !localFile ? 'none' : 'block' }} />
              
              {spotifyAnalysis && !localFile && (
                <div className="spotify-pseudo-waveform">
                  <svg viewBox={`0 0 ${spotifyAnalysis.track.duration * 10} 120`} preserveAspectRatio="none">
                    {spotifyAnalysis.segments.map((seg, i) => (
                      <rect 
                        key={i}
                        x={seg.start * 10}
                        y={60 - (Math.max(0, seg.loudness_max + 60) * 1.0)}
                        width={seg.duration * 10}
                        height={Math.max(2, (Math.max(0, seg.loudness_max + 60) * 2.0))}
                        fill={seg.start <= currentTime ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}
                        opacity={0.8}
                      />
                    ))}
                  </svg>
                  <div className="playhead-line" style={{ left: `${(currentTime / spotifyAnalysis.track.duration) * 100}%` }} />
                </div>
              )}

              <div className="markers-layer">
                {markers.map(marker => {
                  const duration = wavesurfer.current?.getDuration() || spotifyAnalysis?.track?.duration || 300;
                  return (
                    <div 
                      key={marker.id}
                      className={`marker-tip ${marker.type}`}
                      style={{ 
                        left: `${(marker.time / duration) * 100}%`
                      }}
                      onClick={() => {
                        if (wavesurfer.current) wavesurfer.current.setTime(marker.time);
                        else {
                          setCurrentTime(marker.time);
                          if (spotifyPlayer) spotifyPlayer.seek(marker.time * 1000);
                        }
                      }}
                    >
                      <span className="marker-icon">
                        {marker.type === 'bongo' && '🥁'}
                        {marker.type === 'roll' && '🌀'}
                        {marker.type === 'break' && '⚡'}
                        {marker.type === 'guira' && '🥄'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedSongId && !allSongs.find(s => s.id === selectedSongId).audioUrl && !localFile && !accessToken && (
              <div className="spotify-embed-container glass">
                <p className="manual-hint">Connectez Spotify ci-dessus pour activer la Waveform. <br/> Sinon, utilisez le bouton <b>Record</b> manuellement.</p>
                <iframe 
                  src={`https://open.spotify.com/embed/track/${allSongs.find(s => s.id === selectedSongId).spotifyId}`} 
                  width="100%" 
                  height="80" 
                  frameBorder="0" 
                  allow="encrypted-media"
                />
              </div>
            )}

            <div className="controls-row">
              <button 
                className={`btn-play-large ${isPlaying ? 'playing' : ''}`} 
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                )}
              </button>
              
              <div className="time-display">
                <span className="current">{Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(1).padStart(4, '0')}</span>
                <span className="total"> / {
                  wavesurfer.current?.getDuration() 
                  ? `${Math.floor(wavesurfer.current.getDuration() / 60)}:${(wavesurfer.current.getDuration() % 60).toFixed(0).padStart(2, '0')}` 
                  : 'X:XX'
                }</span>
              </div>
              
              {!wavesurfer.current?.getDuration() && (
                <button className="btn-secondary" onClick={() => setCurrentTime(0)}>Zéro</button>
              )}

              <div className="spacer" />

              <button 
                className={`btn-record-pill ${isRecording ? 'active' : ''}`} 
                onClick={() => {
                  if (!isPlaying && !wavesurfer.current?.getDuration()) {
                    togglePlay();
                  }
                  setIsRecording(!isRecording);
                }}
              >
                <div className="dot" />
                {isRecording ? 'Stop' : 'Record'}
              </button>

              <button className="btn-secondary" onClick={clearMarkers}>Vider</button>
            </div>

            {isRecording && (
              <div className="recording-hint animate-fade-in glass">
                <div className="hint-item"><span className="key">B</span> Bongo</div>
                <div className="hint-item"><span className="key">R</span> Roll</div>
                <div className="hint-item"><span className="key">K</span> Break</div>
                <div className="hint-item"><span className="key">G</span> Guira</div>
              </div>
            )}

            <div className="markers-list">
              <h3>Marqueurs ({markers.length})</h3>
              <div className="markers-grid">
                {markers.length === 0 && <p className="empty-msg">Aucun marqueur. Utilise le bouton Enregistrer !</p>}
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
          color: white;
        }
        .glass {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .trainer-content {
          padding: 48px 24px 120px;
          max-width: 1000px;
          margin: 0 auto;
        }
        .trainer-header {
          text-align: center;
          margin-bottom: 48px;
        }
        .trainer-header h1 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2.5rem, 8vw, 4rem);
          margin-bottom: 12px;
          background: linear-gradient(135deg, #fff 0%, var(--accent) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .trainer-header p {
          color: var(--text-secondary);
          max-width: 600px;
          margin: 0 auto;
          font-size: 1.1rem;
        }
        .song-selection-card {
          padding: 24px;
          border-radius: 24px;
          margin-bottom: 40px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-width: 600px;
          margin-inline: auto;
        }
        .selection-tabs {
          display: flex;
          background: rgba(0,0,0,0.3);
          padding: 4px;
          border-radius: 12px;
          gap: 4px;
        }
        .selection-tabs button {
          flex: 1;
          padding: 8px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.85rem;
          color: var(--text-muted);
          transition: all 0.2s;
        }
        .selection-tabs button.active {
          background: var(--accent);
          color: white;
        }
        .local-file-info .file-box {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.05);
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid var(--border);
        }
        .file-name {
          flex: 1;
          font-size: 0.9rem;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .change-btn {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--accent);
          text-decoration: underline;
        }
        .select-wrapper {
          position: relative;
        }
        .select-wrapper::after {
          content: '▼';
          position: absolute;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .song-select {
          width: 100%;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid var(--border);
          padding: 16px 24px;
          border-radius: 16px;
          color: white;
          font-size: 1rem;
          cursor: pointer;
          appearance: none;
          outline: none;
          transition: border-color 0.2s;
        }
        .song-select:focus { border-color: var(--accent); }
        .select-wrapper {
          position: relative;
        }

        .player-section {
          padding: 40px;
          border-radius: 40px;
          box-shadow: 0 40px 100px -20px rgba(0,0,0,0.6);
          position: relative;
          overflow: hidden;
        }

        .screen-flash {
          position: absolute;
          inset: 0;
          z-index: 50;
          pointer-events: none;
          opacity: 0;
          animation: flash 0.15s ease-out;
        }
        .screen-flash.bongo { background: rgba(59, 130, 246, 0.4); }
        .screen-flash.roll { background: rgba(168, 85, 247, 0.4); }
        .screen-flash.break { background: rgba(239, 68, 68, 0.4); }
        .screen-flash.guira { background: rgba(16, 185, 129, 0.4); }
        @keyframes flash { from { opacity: 1; } to { opacity: 0; } }
        .manual-hint { font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 16px; font-weight: 500; }

        .spotify-auth-zone {
          margin-top: 16px;
          padding: 16px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          border: 1px dashed var(--accent);
        }
        .btn-spotify {
          background: #1DB954;
          color: black;
          font-weight: 800;
          padding: 10px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 0.9rem;
        }
        .token-input {
          background: rgba(0,0,0,0.3);
          border: 1px solid var(--border);
          padding: 8px 12px;
          border-radius: 8px;
          color: white;
          font-size: 0.8rem;
        }
        .auth-status { font-size: 0.9rem; font-weight: 700; color: #1DB954; display: flex; align-items: center; gap: 8px; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; }
        .status-dot.green { background: #1DB954; box-shadow: 0 0 10px #1DB954; }

        .spotify-pseudo-waveform {
          position: relative;
          width: 100%;
          height: 120px;
          background: rgba(0,0,0,0.4);
          border-radius: 24px;
          overflow: hidden;
        }
        .playhead-line {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 2px;
          background: white;
          box-shadow: 0 0 15px white;
          z-index: 5;
        }
        .manual-progress {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          background: var(--accent-dim);
          border-right: 2px solid var(--accent);
          transition: width 0.05s linear;
        }

        .spotify-embed-container {
          padding: 24px;
          border-radius: 24px;
          margin-bottom: 32px;
          text-align: center;
        }
        .manual-hint { font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 16px; font-weight: 500; }

        .loading-overlay {
          position: absolute;
          inset: 0;
          background: rgba(10, 10, 15, 0.8);
          backdrop-filter: blur(10px);
          z-index: 100;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          border-radius: 40px;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255,255,255,0.1);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .waveform-wrapper {
          position: relative;
          background: rgba(0,0,0,0.4);
          border-radius: 24px;
          margin-bottom: 40px;
          padding: 30px 0;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .waveform-container {
          direction: ltr; /* Important for wavesurfer rendering */
        }
        .markers-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .marker-tip {
          position: absolute;
          top: -10px;
          width: 36px;
          height: 36px;
          margin-left: -18px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          border: 1.5px solid rgba(255, 255, 255, 0.2);
          pointer-events: auto;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          z-index: 10;
        }
        .marker-tip:hover { transform: scale(1.2) translateY(-4px); z-index: 20; }
        .marker-tip::after {
          content: '';
          position: absolute;
          top: 36px;
          left: 50%;
          width: 2px;
          height: 144px;
          background: inherit;
          opacity: 0.4;
        }
        .marker-tip.bongo { background: #3b82f6; border-color: #60a5fa; box-shadow: 0 8px 16px rgba(59, 130, 246, 0.4); }
        .marker-tip.roll { background: #a855f7; border-color: #c084fc; box-shadow: 0 8px 16px rgba(168, 85, 247, 0.4); }
        .marker-tip.break { background: #ef4444; border-color: #f87171; box-shadow: 0 8px 16px rgba(239, 68, 68, 0.4); }
        .marker-tip.guira { background: #10b981; border-color: #34d399; box-shadow: 0 8px 16px rgba(16, 185, 129, 0.4); }
        
        .marker-icon { font-size: 1.2rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); }

        .controls-row {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-bottom: 40px;
          flex-wrap: wrap;
        }
        .btn-play-large {
          width: 72px;
          height: 72px;
          border-radius: 24px;
          background: var(--accent);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 15px 30px -10px rgba(168, 85, 247, 0.6);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .btn-play-large:hover { transform: scale(1.08) translateY(-4px); }
        
        .time-display {
          font-family: 'Inter', monospace;
          font-size: 1.4rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .time-display .current { color: white; }
        .time-display .total { color: var(--text-muted); font-size: 1.1rem; }

        .btn-record-pill {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1.5px solid var(--border);
          padding: 14px 28px;
          border-radius: 20px;
          color: white;
          font-weight: 800;
          transition: all 0.2s;
        }
        .btn-record-pill.active {
          background: rgba(239, 68, 68, 0.15);
          border-color: var(--red);
          color: var(--red);
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
        }
        .btn-record-pill .dot {
          width: 10px;
          height: 10px;
          background: var(--text-muted);
          border-radius: 50%;
        }
        .btn-record-pill.active .dot { background: var(--red); animation: blink 1s infinite; }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-secondary);
          padding: 14px 24px;
          border-radius: 16px;
          font-weight: 700;
          border: 1px solid var(--border);
        }

        .recording-hint {
          padding: 24px;
          border-radius: 24px;
          margin-bottom: 40px;
          display: flex;
          justify-content: center;
          gap: 32px;
          flex-wrap: wrap;
        }
        .hint-item { display: flex; align-items: center; gap: 10px; font-weight: 600; color: var(--text-secondary); }
        .key { background: #333; color: white; padding: 4px 10px; border-radius: 8px; font-weight: 900; border-bottom: 3px solid #000; box-shadow: 0 4px 0 rgba(0,0,0,0.5); }

        .markers-list h3 { margin-bottom: 24px; font-size: 1.2rem; color: var(--text-secondary); font-weight: 800; }
        .markers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }
        .marker-item {
          background: rgba(255, 255, 255, 0.04);
          padding: 16px 20px;
          border-radius: 20px;
          border: 1.5px solid var(--border);
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .marker-item:hover { transform: translateY(-3px); border-color: var(--accent); background: rgba(255, 255, 255, 0.08); }
        .marker-dot { width: 12px; height: 12px; border-radius: 4px; }
        .marker-time { font-family: monospace; font-size: 1rem; color: var(--text-muted); font-weight: 700; }
        
        @media (max-width: 768px) {
          .player-section { padding: 24px; }
          .controls-row { justify-content: center; gap: 16px; }
          .time-display { width: 100%; text-align: center; order: -1; }
          .trainer-content { padding-top: 24px; }
        }
      `}</style>
    </div>
  );
}
