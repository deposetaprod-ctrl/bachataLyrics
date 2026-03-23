import { useState, useEffect, useRef } from 'react';
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
  const [remoteUrl, setRemoteUrl] = useState('');
  const [youtubeId, setYoutubeId] = useState('');
  const [activeMarkerId, setActiveMarkerId] = useState(null);

  // -- Spotify Pro States --
  const [clientId, setClientId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [spotifyAnalysis, setSpotifyAnalysis] = useState(null);
  const [spotifyPlayer, setSpotifyPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [communitySessions, setCommunitySessions] = useState([]);
  const [showCommunity, setShowCommunity] = useState(false);

  const [user, setUser] = useState(null);
  const [supabaseClient, setSupabaseClient] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const videoInputRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.supabase) {
      const client = window.supabase.createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'
      );
      setSupabaseClient(client);

      client.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
      });

      const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      return () => subscription.unsubscribe();
    }
  }, []);
  
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

    wavesurfer.current.on('seek', (progress) => {
      setCurrentTime(wavesurfer.current.getCurrentTime());
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

    if (remoteUrl && audioRef.current) {
      setIsLoading(true);
      audioRef.current.src = remoteUrl;
      const savedMarkers = JSON.parse(localStorage.getItem(`markers-url-${btoa(remoteUrl).substring(0, 20)}`) || '[]');
      setMarkers(savedMarkers);
      if (window.WaveSurfer) {
        initWavesurfer();
        wavesurfer.current.load(remoteUrl);
      }
    } else if (localFile && audioRef.current) {
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
  }, [selectedSongId, localFile, remoteUrl, accessToken]);

  // -- Utility for adding markers --
  const addMarker = (type, label, color) => {
    const time = (wavesurfer.current && wavesurfer.current.getDuration() > 0) 
      ? wavesurfer.current.getCurrentTime() 
      : currentTime;

    // Visual Flash feedback
    setShowFlash(type);
    setTimeout(() => setShowFlash(null), 150);

    const newMarker = { 
      time, 
      type, 
      label, 
      color, 
      id: Date.now(),
      note: '',
      videoUrl: ''
    };
    const updatedMarkers = [...markers, newMarker].sort((a, b) => a.time - b.time);
    setMarkers(updatedMarkers);
    
    let storageKey = `markers-${selectedSongId}`;
    if (localFile) storageKey = `markers-local-${localFile.name}`;
    if (remoteUrl) storageKey = `markers-url-${btoa(remoteUrl).substring(0, 20)}`;
    
    localStorage.setItem(storageKey, JSON.stringify(updatedMarkers));
    setActiveMarkerId(newMarker.id); // Auto-open for editing
  };

  const saveToSupabase = async () => {
    if (!supabaseClient || !user) {
      alert("Connecte-toi pour sauvegarder dans le cloud !");
      return;
    }
    
    setIsLoading(true);
    const sessionData = {
      user_id: user.id,
      song_id: selectedSongId || 'local-' + (localFile?.name || 'unknown'),
      markers: markers,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabaseClient
      .from('musicality_sessions')
      .upsert(sessionData, { onConflict: 'user_id, song_id' });

    setIsLoading(false);
    if (error) alert("Erreur de sauvegarde : " + error.message);
    else alert("Analyse sauvegardée dans ton catalogue ! ✅");
  };

  const loadFromSupabase = async () => {
    if (!supabaseClient || !user || !selectedSongId) return;
    
    const { data, error } = await supabaseClient
      .from('musicality_sessions')
      .select('markers')
      .eq('user_id', user.id)
      .eq('song_id', selectedSongId)
      .single();

    if (data && data.markers) {
      setMarkers(data.markers);
    }
  };

  useEffect(() => {
    if (user && selectedSongId) loadFromSupabase();
  }, [user, selectedSongId]);

  const fetchCommunitySessions = async () => {
    if (!supabaseClient || !selectedSongId) return;
    const { data, error } = await supabaseClient
      .from('musicality_sessions')
      .select('*, profiles(username)')
      .eq('song_id', selectedSongId)
      .neq('user_id', user?.id || '');

    if (data) setCommunitySessions(data);
    setShowCommunity(true);
  };

  const updateMarker = (id, updates) => {
    const updatedMarkers = markers.map(m => m.id === id ? { ...m, ...updates } : m);
    setMarkers(updatedMarkers);
    
    let storageKey = `markers-${selectedSongId}`;
    if (localFile) storageKey = `markers-local-${localFile.name}`;
    if (remoteUrl) storageKey = `markers-url-${btoa(remoteUrl).substring(0, 20)}`;
    localStorage.setItem(storageKey, JSON.stringify(updatedMarkers));
  };

  const deleteMarker = (id) => {
    const updatedMarkers = markers.filter(m => m.id !== id);
    setMarkers(updatedMarkers);
    let storageKey = `markers-${selectedSongId}`;
    if (localFile) storageKey = `markers-local-${localFile.name}`;
    if (remoteUrl) storageKey = `markers-url-${btoa(remoteUrl).substring(0, 20)}`;
    localStorage.setItem(storageKey, JSON.stringify(updatedMarkers));
    setActiveMarkerId(null);
  };

  const uploadVideo = async (markerId, file) => {
    if (!supabaseClient || !user) return;
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert("Fichier trop gros ! (Max 10MB)");
      return;
    }

    setIsLoading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const filePath = `passes/${fileName}`;

    let { error: uploadError } = await supabaseClient.storage
      .from('pass-videos')
      .upload(filePath, file);

    if (uploadError) {
      alert("Erreur upload: " + uploadError.message);
      setIsLoading(false);
      return;
    }

    const { data: { publicUrl } } = supabaseClient.storage
      .from('pass-videos')
      .getPublicUrl(filePath);

    updateMarker(markerId, { videoUrl: publicUrl });
    setIsLoading(false);
  };

  // -- Keyboard Shortcuts for Recording --
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isRecording) return;
      
      switch (e.key.toLowerCase()) {
        case 'b': addMarker('bongo', 'Bongo', '#3b82f6'); break;
        case 'r': addMarker('roll', 'Bongo Roll', '#a855f7'); break;
        case 'k': addMarker('break', 'Break', '#ef4444'); break;
        case 'g': addMarker('guira', 'Guira', '#10b981'); break;
        default: return;
      }
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
        // 1. Transfer Playback to this device first (Critical for sound)
        fetch(`https://api.spotify.com/v1/me/player`, {
          method: 'PUT',
          body: JSON.stringify({ device_ids: [deviceId], play: true }),
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }).then(() => {
          // 2. Then play the specific track
          fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
            method: 'PUT',
            body: JSON.stringify({ uris: [`spotify:track:${song.spotifyId}`], position_ms: currentTime * 1000 }),
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });
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
      const storageKey = `markers-${selectedSongId}`;
      localStorage.removeItem(storageKey);
    }
  };

  return (
    <div className="musicality-page">
      <Head>
        <title>Musicality Trainer — Bachata Lyrics</title>
      </Head>
      <Script 
        src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2" 
        strategy="beforeInteractive"
        onLoad={() => {
          console.log('Supabase SDK Loaded');
        }}
      />
      <Script 
        src="https://unpkg.com/wavesurfer.js@7/dist/wavesurfer.min.js" 
        strategy="beforeInteractive" 
        onLoad={initWavesurfer}
      />
      <Script 
        src="https://sdk.scdn.co/spotify-player.js"
      />

      <header className="navbar">
        <div className="navbar-inner">
          <div className="logo" onClick={() => router.push('/')}>
            <img src="/LOGO_PWA.PNG" alt="Logo" className="logo-img" />
            <span className="logo-text">Musicality</span>
          </div>
          <div className="nav-links">
            <span onClick={() => router.push('/')}>Accueil</span>
            <span onClick={() => router.push('/passes')}>Passes</span>
            <span onClick={() => router.push('/jack-and-jill')}>Jack & Jill</span>
            
            <div className="auth-profile">
              {user ? (
                <div className="user-logged animate-fade-in">
                  <span className="user-name">👤 {user.email?.split('@')[0]}</span>
                  <button className="btn-logout" onClick={() => {
                    setIsAuthLoading(true);
                    supabaseClient.auth.signOut().then(() => {
                       setIsAuthLoading(false);
                       setUser(null);
                    });
                  }}>
                    {isAuthLoading ? '...' : 'Déconnexion'}
                  </button>
                </div>
              ) : (
                <button className="btn-login" onClick={() => setShowLoginModal(true)}>
                  Connexion
                </button>
              )}
            </div>

            {showLoginModal && (
              <div className="login-modal-overlay animate-fade-in" onClick={() => setShowLoginModal(false)}>
                <div className="login-modal glass animate-slide-up" onClick={e => e.stopPropagation()}>
                  <h3>Connexion 🔐</h3>
                  <div className="login-inputs">
                    <input 
                      type="email" 
                      placeholder="Email" 
                      value={loginForm.email}
                      onChange={e => setLoginForm({...loginForm, email: e.target.value})}
                    />
                    <input 
                      type="password" 
                      placeholder="Mot de passe" 
                      value={loginForm.password}
                      onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                    />
                  </div>
                  <button className="btn-login-submit" onClick={async () => {
                    setIsAuthLoading(true);
                    const { error } = await supabaseClient.auth.signInWithPassword(loginForm);
                    setIsAuthLoading(false);
                    if (error) alert("Erreur: " + error.message);
                    else {
                      setShowLoginModal(false);
                      setLoginForm({ email: '', password: '' });
                    }
                  }}>
                    {isAuthLoading ? 'Chargement...' : 'Se connecter'}
                  </button>
                  <button className="btn-close-modal" onClick={() => setShowLoginModal(false)}>Fermer</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container trainer-content">
        <div className="trainer-header">
          <h1>Analyse Musicale</h1>
          <p>Enregistre les instruments en temps réel pour ne plus jamais rater un bongo ou un break.</p>
        </div>

        <div className="song-selection-wrapper">
          <select 
            value={selectedSongId} 
            onChange={(e) => setSelectedSongId(e.target.value)}
            className="song-select"
          >
            <option value="">-- Choisir une chanson --</option>
            {allSongs.filter(s => s.audioUrl).map(song => (
              <option key={song.id} value={song.id}>{song.title} - {song.artist}</option>
            ))}
          </select>
          
          {selectedSongId && (
            <div className="discovery-actions animate-fade-in">
              <button className="btn-community" onClick={fetchCommunitySessions}>
                🌏 Voir les analyses de la communauté
              </button>
            </div>
          )}

          {showCommunity && communitySessions.length > 0 && (
            <div className="community-overlay glass animate-slide-up">
              <div className="overlay-header">
                <h4>Analyses partagées 🌏</h4>
                <button className="btn-close-small" onClick={() => setShowCommunity(false)}>✕</button>
              </div>
              <div className="community-list">
                {communitySessions.map(sess => (
                  <div key={sess.id} className="community-item" onClick={() => { setMarkers(sess.markers); setShowCommunity(false); }}>
                    <span className="user-icon">👤</span>
                    <div className="item-info">
                      <span className="username">{sess.profiles?.username || 'Anonyme'}</span>
                      <span className="meta">{sess.markers.length} marqueurs • {new Date(sess.updated_at).toLocaleDateString()}</span>
                    </div>
                    <button className="btn-load-sess">Charger</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {selectedSongId && (
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
              <div 
                className={`waveform-container ${isDragging ? 'dragging' : ''}`} 
                ref={waveformRef} 
                style={{ display: spotifyAnalysis ? 'none' : 'block' }} 
                onMouseDown={(e) => {
                  if (!wavesurfer.current) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const moveHandler = (moveEvent) => {
                    const newX = moveEvent.clientX - rect.left;
                    const pct = Math.max(0, Math.min(1, newX / rect.width));
                    wavesurfer.current.seekTo(pct);
                  };
                  const upHandler = () => {
                    setIsDragging(false);
                    window.removeEventListener('mousemove', moveHandler);
                    window.removeEventListener('mouseup', upHandler);
                  };
                  setIsDragging(true);
                  window.addEventListener('mousemove', moveHandler);
                  window.addEventListener('mouseup', upHandler);
                  moveHandler(e);
                }}
              />
              
              {youtubeId && !localFile && !remoteUrl && (
                <div className="placeholder-waveform youtube">
                  <div className="beat-visual" style={{ animation: isPlaying ? 'pulse 2s infinite' : 'none' }}>
                    📺 Mode YouTube (Manuel)
                  </div>
                  <div 
                    className={`manual-waveform ${isDragging ? 'dragging' : ''}`}
                    onMouseDown={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const moveHandler = (moveEvent) => {
                        const newX = moveEvent.clientX - rect.left;
                        const pct = Math.max(0, Math.min(1, newX / rect.width));
                        setCurrentTime(pct * 300); // 5 min max for manual
                      };
                      const upHandler = () => {
                        setIsDragging(false);
                        window.removeEventListener('mousemove', moveHandler);
                        window.removeEventListener('mouseup', upHandler);
                      };
                      setIsDragging(true);
                      window.addEventListener('mousemove', moveHandler);
                      window.addEventListener('mouseup', upHandler);
                      moveHandler(e);
                    }}
                  >
                    <div className="manual-progress" style={{ width: `${Math.min(100, (currentTime / 300) * 100)}%` }}>
                      <div className={`playhead ${isDragging ? 'active' : ''}`} />
                    </div>
                  </div>
                </div>
              )}

              {spotifyAnalysis && !localFile && !remoteUrl && (
                <div 
                  className="spotify-pseudo-waveform"
                  onMouseDown={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const moveHandler = (moveEvent) => {
                      const newX = moveEvent.clientX - rect.left;
                      const pct = Math.max(0, Math.min(1, newX / rect.width));
                      const newTime = pct * spotifyAnalysis.track.duration;
                      setCurrentTime(newTime);
                    };
                    const upHandler = (upEvent) => {
                      setIsDragging(false);
                      const newX = upEvent.clientX - rect.left;
                      const pct = Math.max(0, Math.min(1, newX / rect.width));
                      const newTime = pct * spotifyAnalysis.track.duration;
                      if (spotifyPlayer) spotifyPlayer.seek(newTime * 1000);
                      window.removeEventListener('mousemove', moveHandler);
                      window.removeEventListener('mouseup', upHandler);
                    };
                    setIsDragging(true);
                    window.addEventListener('mousemove', moveHandler);
                    window.addEventListener('mouseup', upHandler);
                    moveHandler(e);
                  }}
                  style={{ cursor: isDragging ? 'grabbing' : 'ew-resize' }}
                >
                  <div className={`spotify-playhead ${isDragging ? 'active' : ''}`} style={{ left: `${(currentTime / spotifyAnalysis.track.duration) * 100}%` }} />
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

            {youtubeId && !localFile && !remoteUrl && (
              <div className="spotify-embed-container glass animate-fade-in">
                <p className="manual-hint">Lance la vidéo YouTube 👆 puis clique sur <b>Record</b> 👇 pour synchroniser ton écoute.</p>
                <div className="video-responsive">
                  <iframe 
                    width="100%" 
                    height="315" 
                    src={`https://www.youtube.com/embed/${youtubeId}`} 
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  />
                </div>
              </div>
            )}
            {selectedSongId && !allSongs.find(s => s.id === selectedSongId).audioUrl && !localFile && !remoteUrl && !youtubeId && !accessToken && (
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

              <button className="btn-secondary" onClick={saveToSupabase} disabled={!user}>
                💾 {user ? 'Sauvegarder Cloud' : 'Connecte-toi pour sauver'}
              </button>
              
              <button className="btn-secondary" onClick={clearMarkers}>Vider local</button>
            </div>

            {isRecording && (
              <div className="recording-console animate-fade-in glass">
                <button 
                  className="instrument-btn bongo" 
                  onClick={() => addMarker('bongo', 'Bongo', '#3b82f6')}
                  onTouchStart={(e) => { e.preventDefault(); addMarker('bongo', 'Bongo', '#3b82f6'); }}
                >
                  <span className="icon">🥁</span>
                  <span className="name">Bongo (B)</span>
                </button>
                <button 
                  className="instrument-btn roll" 
                  onClick={() => addMarker('roll', 'Bongo Roll', '#a855f7')}
                  onTouchStart={(e) => { e.preventDefault(); addMarker('roll', 'Bongo Roll', '#a855f7'); }}
                >
                  <span className="icon">🌀</span>
                  <span className="name">Roll (R)</span>
                </button>
                <button 
                  className="instrument-btn break" 
                  onClick={() => addMarker('break', 'Break', '#ef4444')}
                  onTouchStart={(e) => { e.preventDefault(); addMarker('break', 'Break', '#ef4444'); }}
                >
                  <span className="icon">⚡</span>
                  <span className="name">Break (K)</span>
                </button>
                <button 
                  className="instrument-btn guira" 
                  onClick={() => addMarker('guira', 'Guira', '#10b981')}
                  onTouchStart={(e) => { e.preventDefault(); addMarker('guira', 'Guira', '#10b981'); }}
                >
                  <span className="icon">🥄</span>
                  <span className="name">Guira (G)</span>
                </button>
              </div>
            )}

            <div className="markers-list">
              <h3>Marqueurs ({markers.length})</h3>
              <div className="markers-grid">
                {markers.map(m => (
                  <div 
                    key={m.id} 
                    className={`marker-item ${activeMarkerId === m.id ? 'active' : ''}`} 
                    onClick={() => {
                      if (wavesurfer.current) wavesurfer.current.setTime(m.time);
                      else {
                        setCurrentTime(m.time);
                        if (spotifyPlayer) spotifyPlayer.seek(m.time * 1000);
                      }
                      setActiveMarkerId(m.id);
                    }}
                  >
                    <div className="marker-main">
                      <span className="marker-dot" style={{ backgroundColor: m.color }} />
                      <span className="marker-time">{Math.floor(m.time / 60)}:{(m.time % 60).toFixed(1).padStart(4, '0')}</span>
                      <span className="marker-label">{m.label}</span>
                      {(m.note || m.videoUrl) && (
                        <div className="marker-badges">
                          {m.note && <span className="badge">📝</span>}
                          {m.videoUrl && <span className="badge">🎬</span>}
                        </div>
                      )}
                    </div>
                    {activeMarkerId === m.id && (
                      <div className="marker-edit-panel animate-slide-up" onClick={e => e.stopPropagation()}>
                        <textarea 
                          placeholder="Ajouter une note (ex: Entrée des bongos)..." 
                          value={m.note}
                          onChange={(e) => updateMarker(m.id, { note: e.target.value })}
                        />
                        
                        <div className="upload-section">
                          <button className="btn-upload-primary" onClick={() => videoInputRef.current.click()}>
                            📹 Filmer ou Uploader une passe
                          </button>
                          <input 
                            ref={videoInputRef}
                            type="file" 
                            accept="video/*" 
                            capture="environment"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) uploadVideo(m.id, file);
                            }}
                          />
                        </div>

                        <div className="video-link-row secondary">
                          <span className="icon">🔗</span>
                          <input 
                            type="text" 
                            placeholder="Ou colle une URL directement..." 
                            value={m.videoUrl}
                            onChange={(e) => updateMarker(m.id, { videoUrl: e.target.value })}
                          />
                        </div>
                        
                        {m.videoUrl && (
                          <div className="marker-video-preview">
                            <VideoPreview url={m.videoUrl} />
                          </div>
                        )}

                        <div className="edit-actions">
                          <button className="btn-delete" onClick={() => deleteMarker(m.id)}>Supprimer</button>
                          <button className="btn-close" onClick={() => setActiveMarkerId(null)}>Fermer</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <MusicalityHUD upcomingMarker={upcomingMarker} currentTime={currentTime} />
      </main>

      <style jsx>{`
        .marker-item.active {
          border-color: var(--accent);
          background: rgba(124, 58, 237, 0.1);
          flex-direction: column;
          align-items: stretch;
          height: auto;
        }
        .marker-main {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
        }
        .marker-badges {
          margin-left: auto;
          display: flex;
          gap: 4px;
        }
        .badge { font-size: 0.9rem; }
        
        .marker-edit-panel {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(255,255,255,0.1);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .marker-edit-panel textarea {
          width: 100%;
          background: rgba(0,0,0,0.3);
          border: 1px solid var(--border);
          border-radius: 12px;
          color: white;
          padding: 12px;
          font-size: 0.9rem;
          min-height: 80px;
          resize: vertical;
        }
        .video-link-row {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(0,0,0,0.3);
          border: 1px solid var(--border);
          padding: 8px 16px;
          border-radius: 12px;
        }
        .video-link-row input {
          flex: 1;
          background: transparent;
          border: none;
          color: white;
          font-size: 0.85rem;
          outline: none;
        }
        .marker-video-preview {
          border-radius: 12px;
          overflow: hidden;
          background: #000;
          aspect-ratio: 16/9;
        }
        .edit-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
        }
        .btn-delete {
          color: #ef4444;
          font-size: 0.8rem;
          font-weight: 700;
          background: transparent;
          border: none;
        }
        .btn-close {
          background: var(--accent);
          color: white;
          border: none;
          padding: 6px 16px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 700;
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slideUp 0.3s ease-out; }
        
        .auth-profile { margin-left: 20px; }
        .user-logged { display: flex; align-items: center; gap: 12px; }
        .user-name { font-size: 0.85rem; font-weight: 700; color: var(--accent); }
        .btn-login, .btn-logout {
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border);
          color: white;
          padding: 6px 14px;
          border-radius: 10px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
        }
        .btn-login:hover { background: var(--accent); }
        
        .btn-upload-small {
          background: var(--accent);
          color: white;
          border: none;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
        }
        
        .upload-section { margin-bottom: 8px; }
        .btn-upload-primary {
          width: 100%;
          background: linear-gradient(135deg, var(--accent), #7c3aed);
          color: white;
          border: none;
          padding: 14px;
          border-radius: 12px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);
          transition: all 0.2s;
        }
        .btn-upload-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4); }
        .btn-upload-primary:active { transform: scale(0.98); }

        .discovery-actions { margin-top: 16px; }
        .btn-community {
          width: 100%;
          background: rgba(124, 58, 237, 0.1);
          border: 1.5px dashed var(--accent);
          color: var(--accent);
          padding: 12px;
          border-radius: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-community:hover { background: rgba(124, 58, 237, 0.2); transform: translateY(-2px); }

        .community-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(10, 10, 10, 0.95);
          z-index: 100;
          padding: 24px;
          border-radius: 24px;
          display: flex;
          flex-direction: column;
        }
        .overlay-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .community-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }
        .community-item {
          background: rgba(255,255,255,0.05);
          padding: 16px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          border: 1px solid var(--border);
        }
        .community-item:hover { border-color: var(--accent); background: rgba(255,255,255,0.08); }
        .item-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
        .username { font-weight: 800; color: white; }
        .meta { font-size: 0.75rem; color: var(--text-muted); }
        .btn-load-sess { background: var(--accent); color: white; border: none; padding: 6px 12px; border-radius: 8px; font-weight: 700; font-size: 0.8rem; }

        .discovery-actions { margin-top: 16px; }
        .btn-community {
          width: 100%;
          background: rgba(124, 58, 237, 0.1);
          border: 1.5px dashed var(--accent);
          color: var(--accent);
          padding: 12px;
          border-radius: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-community:hover { background: rgba(124, 58, 237, 0.2); transform: translateY(-2px); }

        .community-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(10, 10, 10, 0.95);
          z-index: 100;
          padding: 24px;
          border-radius: 24px;
          display: flex;
          flex-direction: column;
        }
        .overlay-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .community-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }
        .community-item {
          background: rgba(255,255,255,0.05);
          padding: 16px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          border: 1px solid var(--border);
        }
        .community-item:hover { border-color: var(--accent); background: rgba(255,255,255,0.08); }
        .item-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
        .username { font-weight: 800; color: white; }
        .meta { font-size: 0.75rem; color: var(--text-muted); }
        .btn-load-sess { background: var(--accent); color: white; border: none; padding: 6px 12px; border-radius: 8px; font-weight: 700; font-size: 0.8rem; }
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
          transition: all 0.3s;
          border: 2px solid rgba(255,255,255,0.05);
        }
        .song-selection-card.pulse-border {
          border: 2px dashed var(--accent);
          background: rgba(168, 85, 247, 0.05);
        }
        .drop-hint {
          text-align: center;
          margin-top: 12px;
          font-size: 0.85rem;
          color: var(--text-muted);
          font-style: italic;
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
          height: 120px;
          background: rgba(0,0,0,0.2);
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 40px;
          border: 1px solid var(--border);
        }
        .spotify-playhead {
          position: absolute;
          top: 0; bottom: 0;
          width: 2px;
          background: white;
          z-index: 10;
          transition: transform 0.1s ease, width 0.1s ease;
          pointer-events: none;
        }
        .spotify-playhead.active {
          width: 4px;
          background: var(--accent);
          transform: scaleY(1.1);
          box-shadow: 0 0 15px var(--accent);
        }
        
        .manual-waveform {
          height: 8px;
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
          position: relative;
          cursor: ew-resize;
        }
        .manual-progress {
          height: 100%;
          background: var(--accent);
          border-radius: 4px;
          position: relative;
        }
        .playhead {
          position: absolute;
          right: -6px; top: -10px;
          width: 14px; height: 14px;
          background: white;
          border-radius: 50%;
          border: 2px solid var(--accent);
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          transition: transform 0.2s;
        }
        .playhead.active {
          transform: scale(1.5);
          background: var(--accent);
          border-color: white;
        }
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

        .video-responsive {
          overflow: hidden;
          padding-bottom: 56.25%;
          position: relative;
          height: 0;
          border-radius: 16px;
        }
        .video-responsive iframe {
          left: 0;
          top: 0;
          height: 100%;
          width: 100%;
          position: absolute;
        }

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
        .waveform-container {
          cursor: ew-resize;
          transition: transform 0.2s;
        }
        .waveform-container.dragging {
          transform: scaleY(1.05);
          filter: brightness(1.2);
        }
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
        
        .song-selection-wrapper {
          max-width: 600px;
          margin: 0 auto 40px;
          background: rgba(255,255,255,0.05);
          padding: 30px;
          border-radius: 24px;
          border: 1px solid var(--border);
        }
        .song-select {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border);
          color: white;
          padding: 16px;
          border-radius: 16px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          -webkit-appearance: none; /* Remove default arrow for Chrome/Safari */
          -moz-appearance: none;    /* Remove default arrow for Firefox */
          appearance: none;         /* Remove default arrow for modern browsers */
          background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23ffffff%22%20d%3D%22M287%2C197.9L159.3%2C69.2c-4.7-4.7-12.3-4.7-17%2C0L5.4%2C197.9c-4.7%2C4.7-4.7%2C12.3%2C0%2C17l19.8%2C19.8c4.7%2C4.7%2C12.3%2C4.7%2C17%2C0l108.8-108.8l108.8%2C108.8c4.7%2C4.7%2C12.3%2C4.7%2C17%2C0l19.8-19.8C291.7%2C210.2%2C291.7%2C202.6%2C287%2C197.9z%22%2F%3E%3C%2Fsvg%3E');
          background-repeat: no-repeat;
          background-position: right 16px center;
          background-size: 12px;
          padding-right: 40px; /* Make space for the custom arrow */
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

        .recording-console {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          padding: 24px;
          border-radius: 24px;
          margin-bottom: 40px;
          border: 1px solid var(--accent);
          background: rgba(124, 58, 237, 0.05);
        }
        .instrument-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 24px;
          border-radius: 20px;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.1);
          color: white;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        .instrument-btn:active { transform: scale(0.92); }
        .instrument-btn .icon { font-size: 2rem; }
        .instrument-btn .name { font-size: 0.8rem; font-weight: 700; opacity: 0.8; }
        
        .instrument-btn.bongo { background: rgba(59, 130, 246, 0.1); border-color: #3b82f6; }
        .instrument-btn.roll { background: rgba(168, 85, 247, 0.1); border-color: #a855f7; }
        .instrument-btn.break { background: rgba(239, 68, 68, 0.1); border-color: #ef4444; }
        .instrument-btn.guira { background: rgba(16, 185, 129, 0.1); border-color: #10b981; }

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
        }
      `}</style>
    </div>
  );
}

function VideoPreview({ url }) {
  if (!url) return null;
  
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
  let youtubeId = '';
  if (isYouTube) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    youtubeId = (match && match[2].length === 11) ? match[2] : '';
  }

  if (isYouTube && youtubeId) {
    return (
      <iframe 
        width="100%" 
        height="100%" 
        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0&controls=1`}
        frameBorder="0" 
        allowFullScreen 
      />
    );
  }

  return (
    <video 
      src={url} 
      controls 
      style={{ width: '100%', height: '100%' }}
    />
  );
}
