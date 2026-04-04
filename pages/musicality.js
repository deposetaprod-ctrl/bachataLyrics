import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Script from 'next/script';
import MusicalityHUD from '../components/MusicalityHUD';
import AuthModal from '../components/AuthModal';
import Navbar from '../components/Navbar';
export default function MusicalityTrainer() {
  const router = useRouter();
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
  const [recentLinks, setRecentLinks] = useState([]);
  const [userSessions, setUserSessions] = useState([]);
  const [sessionTitle, setSessionTitle] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // '', 'saving', 'saved', 'error'
  const [isPublic, setIsPublic] = useState(false);
  const [publicSessions, setPublicSessions] = useState([]);

  const [user, setUser] = useState(null);
  const [supabaseClient, setSupabaseClient] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
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

  const [youtubePlayer, setYoutubePlayer] = useState(null);
  const ytTimerRef = useRef(null);

  // -- YouTube IFrame API Initialization --
  useEffect(() => {
    if (!youtubeId) {
      if (youtubePlayer) {
        youtubePlayer.destroy();
        setYoutubePlayer(null);
      }
      return;
    }

    const initYT = () => {
      if (youtubePlayer) {
        youtubePlayer.destroy();
      }
      const player = new window.YT.Player('youtube-player-container', {
        height: '315',
        width: '100%',
        videoId: youtubeId,
        playerVars: {
          controls: 0, // Hide default controls for custom UI sync
          disablekb: 1,
          fs: 0,
          rel: 0,
          modestbranding: 1
        },
        events: {
          onReady: (event) => {
            setYoutubePlayer(event.target);
            setIsLoading(false);
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              // Start sync timer
              if (ytTimerRef.current) clearInterval(ytTimerRef.current);
              ytTimerRef.current = setInterval(() => {
                if (event.target && event.target.getCurrentTime) {
                  setCurrentTime(event.target.getCurrentTime());
                }
              }, 50);
            } else {
              setIsPlaying(false);
              if (ytTimerRef.current) clearInterval(ytTimerRef.current);
              if (event.target && event.target.getCurrentTime) {
                setCurrentTime(event.target.getCurrentTime());
              }
            }
          }
        }
      });
    };

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = initYT;
    } else {
      initYT();
    }

    return () => {
      if (ytTimerRef.current) clearInterval(ytTimerRef.current);
    };
  }, [youtubeId]);



  // -- Load Remote URL / YouTube --
  useEffect(() => {
    if (manualTimer) clearInterval(manualTimer);
    setManualTimer(null);
    setCurrentTime(0);
    setIsPlaying(false);
    setIsRecording(false);
    setYoutubeId('');

    // YouTube URL Regex
    const extractYoutubeId = (url) => {
      const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
      const match = url.match(regex);
      return match ? match[1] : null;
    };

    if (remoteUrl) {
      const ytId = extractYoutubeId(remoteUrl);
      if (ytId) {
        setYoutubeId(ytId);
        setIsLoading(false);
        const savedMarkers = JSON.parse(localStorage.getItem(`markers-yt-${ytId}`) || '[]');
        setMarkers(savedMarkers);
        if (audioRef.current) audioRef.current.src = '';

        // Save to history
        setRecentLinks(prev => {
          const newLinks = [remoteUrl, ...prev.filter(link => link !== remoteUrl)].slice(0, 5);
          localStorage.setItem('recent-yt-links', JSON.stringify(newLinks));
          return newLinks;
        });
      }
    }
  }, [remoteUrl]);

  // Load history on mount
  useEffect(() => {
    const savedLinks = JSON.parse(localStorage.getItem('recent-yt-links') || '[]');
    setRecentLinks(savedLinks);
  }, []);

  // -- Utility for adding markers --
  const addMarker = (type, label, color, emoji = '') => {
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
      videoUrl: '',
      emoji: emoji
    };
    const updatedMarkers = [...markers, newMarker].sort((a, b) => a.time - b.time);
    setMarkers(updatedMarkers);
    
    if (youtubeId) {
      localStorage.setItem(`markers-yt-${youtubeId}`, JSON.stringify(updatedMarkers));
    }
    
    // Auto-open for editing
    setActiveMarkerId(newMarker.id);
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'à l\'instant';
    if (mins < 60) return `il y a ${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `il y a ${days}j`;
    return new Date(dateStr).toLocaleDateString();
  };

  const toggleSessionPublic = async (songId, currentValue) => {
    if (!supabaseClient || !user) return;
    await supabaseClient
      .from('musicality_sessions')
      .update({ is_public: !currentValue })
      .eq('user_id', user.id)
      .eq('song_id', songId);
    fetchUserSessions();
  };

  const fetchUserSessions = async () => {
    if (!supabaseClient || !user) return;
    const { data, error } = await supabaseClient
      .from('musicality_sessions')
      .select('song_id, title, url, updated_at, is_public')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(5);

    if (data) setUserSessions(data);
  };

  useEffect(() => {
    if (user) fetchUserSessions();
  }, [user]);

  const saveToSupabase = async () => {
    if (!supabaseClient || !user) {
      alert("Connecte-toi pour sauvegarder dans le cloud !");
      return;
    }
    
     setIsLoading(true);
     setSaveStatus('saving');
     const sessionData = {
       user_id: user.id,
       song_id: 'yt-' + youtubeId,
       markers: markers,
       title: sessionTitle || `Session - ${new Date().toLocaleDateString()}`,
       url: remoteUrl,
       is_public: isPublic,
       updated_at: new Date().toISOString()
     };
 
     const { error } = await supabaseClient
       .from('musicality_sessions')
       .upsert(sessionData, { onConflict: 'user_id, song_id' });
 
     setIsLoading(false);
     if (error) {
       setSaveStatus('error');
       alert("Erreur de sauvegarde : " + error.message);
     } else {
       setSaveStatus('saved');
       setTimeout(() => setSaveStatus(''), 3000);
       fetchUserSessions();
     }
   };

  const loadFromSupabase = async () => {
    if (!supabaseClient || !user || !youtubeId) return;
    
    const { data, error } = await supabaseClient
      .from('musicality_sessions')
      .select('markers, title, is_public')
      .eq('user_id', user.id)
      .eq('song_id', 'yt-' + youtubeId)
      .single();

    if (data) {
      if (data.markers) setMarkers(data.markers);
      if (data.title) setSessionTitle(data.title);
      if (data.hasOwnProperty('is_public')) setIsPublic(data.is_public);
    }
  };

  useEffect(() => {
    if (user && youtubeId) loadFromSupabase();
  }, [user, youtubeId]);

  const fetchPublicSessions = async () => {
    if (!supabaseClient) return;
    const { data, error } = await supabaseClient
      .from('musicality_sessions')
      .select('user_id, song_id, title, url, updated_at')
      .eq('is_public', true)
      .order('updated_at', { ascending: false })
      .limit(10);

    if (data) setPublicSessions(data);
  };

  useEffect(() => {
    fetchPublicSessions();
  }, [supabaseClient]);



  const updateMarker = (id, updates) => {
    const updatedMarkers = markers.map(m => m.id === id ? { ...m, ...updates } : m);
    setMarkers(updatedMarkers);
    if (youtubeId) {
      localStorage.setItem(`markers-yt-${youtubeId}`, JSON.stringify(updatedMarkers));
    }
  };

  const deleteMarker = (id) => {
    const updatedMarkers = markers.filter(m => m.id !== id);
    setMarkers(updatedMarkers);
    if (youtubeId) {
      localStorage.setItem(`markers-yt-${youtubeId}`, JSON.stringify(updatedMarkers));
    }
    setActiveMarkerId(null);
  };

  const uploadVideo = async (markerId, file) => {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert("Fichier trop gros ! (Max 10MB)");
      return;
    }

    // 1. Immediate local preview (works without auth)
    const localPreviewUrl = URL.createObjectURL(file);
    updateMarker(markerId, { videoUrl: localPreviewUrl, uploadStatus: 'local' });

    // 2. If no user/supabase, stop here - the local preview will work for the session
    if (!supabaseClient || !user) {
      return;
    }

    // 3. Authenticated upload
    setIsLoading(true);
    updateMarker(markerId, { uploadStatus: 'uploading' });
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const filePath = `passes/${fileName}`;

    let { error: uploadError } = await supabaseClient.storage
      .from('pass-videos')
      .upload(filePath, file);

    if (uploadError) {
      alert("Erreur upload: " + uploadError.message);
      setIsLoading(false);
      updateMarker(markerId, { uploadStatus: 'error' });
      return;
    }

    const { data: { publicUrl } } = supabaseClient.storage
      .from('pass-videos')
      .getPublicUrl(filePath);

    updateMarker(markerId, { videoUrl: publicUrl, uploadStatus: 'uploaded' });
    setIsLoading(false);
  };



  // -- Warning System (HUD) --
  useEffect(() => {
    const nextMarker = markers.find(m => m.time > currentTime);
    setUpcomingMarker(nextMarker || null);
  }, [currentTime, markers]);

  const togglePlay = () => {
    if (wavesurfer.current && wavesurfer.current.getDuration() > 0) {
      wavesurfer.current.playPause();
      if (!isPlaying) setIsRecording(true);
    } else if (youtubePlayer && youtubeId) {
      if (isPlaying) {
        youtubePlayer.pauseVideo();
      } else {
        youtubePlayer.playVideo();
        setIsRecording(true);
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
        setIsRecording(true);
        const start = Date.now() - (currentTime * 1000);
        const timer = setInterval(() => {
          setCurrentTime((Date.now() - start) / 1000);
        }, 50);
        setManualTimer(timer);
      }
    }
  };



  const toggleRecording = () => setIsRecording(!isRecording);
  
  const clearMarkers = () => {
    if (confirm('Supprimer tous les marqueurs pour cette chanson ?')) {
      setMarkers([]);
      if (youtubeId) {
        localStorage.removeItem(`markers-yt-${youtubeId}`);
      }
    }
  };

  const recentButtonStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    padding: '8px 12px',
    borderRadius: '12px',
    color: 'white',
    textAlign: 'left',
    fontSize: '0.9rem',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    transition: 'background 0.2s'
  };
  const recentButtonHover = (e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
  const recentButtonNormal = (e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)';

  return (
    <div className="musicality-page">
      <Head>
        <title>Musicality Trainer — Analyse Musicale Bachata | Bachata Flow</title>
        <meta name="description" content="Entraîne ton oreille musicale avec le Musicality Trainer. Identifie les bongos, breaks, güiras et rolls dans tes chansons de bachata préférées en temps réel." />
        <meta property="og:title" content="Musicality Trainer — Bachata Flow" />
        <meta property="og:description" content="Analyse musicale en temps réel. Identifie les instruments de bachata et améliore ta musicalité." />
        <meta property="og:url" content="https://bachatalyrics.com/musicality" />
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

      <Navbar 
        user={user} 
        supabaseClient={supabaseClient} 
        onLoginClick={() => setShowLoginModal(true)} 
        activePage="musicality"
      />
      <AuthModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        supabaseClient={supabaseClient}
      />

      <main className="container trainer-content">
        <div className="trainer-header">
          <h1>Analyse Musicale</h1>
          <p>Enregistre les instruments en temps réel pour ne plus jamais rater un bongo ou un break.</p>
        </div>

        <div className="song-selection-wrapper">
          <div className="source-section glass" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <div className="source-header" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
              <span className="source-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(167, 139, 250, 0.1)', padding: '16px', borderRadius: '50%', color: '#a78bfa' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path>
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                </svg>
              </span>
              <div>
                <h3 className="source-title" style={{ fontSize: '1.5rem' }}>Coller un lien YouTube</h3>
                <p className="source-subtitle">Copie-colle le lien de la musique ou de la vidéo de danse</p>
              </div>
            </div>

            <div className="source-url-input-container">
              <div className="input-wrapper">
                <span className="field-label">URL DE LA VIDÉO</span>
                <input
                  type="url"
                  className="text-input"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={remoteUrl}
                  onChange={e => setRemoteUrl(e.target.value)}
                />
              </div>
              
              {youtubeId && (
                <div className="input-wrapper animate-fade-in">
                  <span className="field-label">TITRE DE LA SESSION (OPTIONNEL)</span>
                  <input
                    type="text"
                    className="text-input"
                    placeholder="Ex: Intro Guitare Mike, Routine Social..."
                    value={sessionTitle}
                    onChange={e => setSessionTitle(e.target.value)}
                  />
                </div>
              )}
            </div>
            
            {((user && userSessions.length > 0) || (!user && recentLinks.length > 0)) && (
              <div className="recent-links-section" style={{ marginTop: '1.5rem', textAlign: 'left' }}>
                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: 'var(--accent)', 
                    fontSize: '0.85rem', 
                    fontWeight: 700, 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: showHistory ? '12px' : '0'
                  }}
                >
                  {showHistory ? '▼ Masquer l\'historique' : '▶ Voir mes dernières sessions'}
                </button>

                {showHistory && (
                  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {user ? (
                      userSessions.map((session, idx) => (
                        <div 
                          key={idx}
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            padding: '10px 14px',
                            borderRadius: '14px',
                            transition: 'all 0.2s',
                            cursor: 'pointer'
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                        >
                          <div 
                            onClick={() => {
                              setRemoteUrl(session.url);
                              setSessionTitle(session.title);
                              setShowHistory(false);
                            }}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '8px' }}
                          >
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'white' }}>🎵 {session.title || 'Sans titre'}</span>
                            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>{timeAgo(session.updated_at)}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <div 
                              onClick={(e) => { e.stopPropagation(); toggleSessionPublic(session.song_id, session.is_public); }}
                              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                              title={session.is_public ? 'Cliquer pour rendre privé' : 'Cliquer pour partager'}
                            >
                              <span style={{ fontSize: '0.7rem', color: session.is_public ? 'var(--accent)' : 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
                                {session.is_public ? 'Public' : 'Privé'}
                              </span>
                              <div style={{
                                width: '36px', height: '20px',
                                borderRadius: '10px',
                                background: session.is_public ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                                position: 'relative',
                                transition: 'background 0.25s ease'
                              }}>
                                <div style={{
                                  width: '16px', height: '16px',
                                  borderRadius: '50%',
                                  background: 'white',
                                  position: 'absolute',
                                  top: '2px',
                                  left: session.is_public ? '18px' : '2px',
                                  transition: 'left 0.25s ease',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      recentLinks.map((link, idx) => (
                        <button 
                          key={idx}
                          onClick={() => {
                            setRemoteUrl(link);
                            setShowHistory(false);
                          }}
                          style={recentButtonStyle}
                          onMouseOver={recentButtonHover}
                          onMouseOut={recentButtonNormal}
                        >
                          🔗 {link}
                        </button>
                      ))
                    )}
                  </div>
                )}
                
                {publicSessions.length > 0 && (
                  <div className="community-showcase animate-fade-in" style={{ marginTop: '2rem' }}>
                    <h4 style={{ fontSize: '0.8rem', color: 'var(--accent)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.2rem' }}>🌎</span> Analyses de la Communauté
                    </h4>
                    <div className="public-sessions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                      {publicSessions.map((session, idx) => (
                        <button 
                          key={idx}
                          onClick={() => {
                            setRemoteUrl(session.url);
                            setSessionTitle(session.title);
                          }}
                          style={{
                            ...recentButtonStyle,
                            padding: '10px 14px',
                            background: 'rgba(124, 58, 237, 0.05)',
                            border: '1px solid rgba(124, 58, 237, 0.2)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            gap: '4px'
                          }}
                          onMouseOver={recentButtonHover}
                          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(124, 58, 237, 0.05)'}
                        >
                          <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{session.title || 'Analyse sans titre'}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {!youtubeId && (
            <div className="empty-state animate-fade-in">
              <div className="empty-state-icon">🥁</div>
              <h3>Comment ça marche ?</h3>
              <div className="empty-how-grid">
                <div className="how-step">
                  <span className="step-num">1</span>
                  <span>Copie le lien de ta vidéo YouTube préférée et <b>colle le ci-dessus</b></span>
                </div>
                <div className="how-step">
                  <span className="step-num">2</span>
                  <span>Clique sur <b>Record</b> pour commencer à marquer les instruments</span>
                </div>
                <div className="how-step">
                  <span className="step-num">3</span>
                  <span>Utilise les boutons pour identifier les <b>instruments</b> et les <b>variations</b></span>
                </div>
                <div className="how-step">
                  <span className="step-num">4</span>
                  <span>Connecte-toi pour sauvegarder tes analyses dans le cloud ☁️</span>
                </div>
              </div>
            </div>
          )}


        </div>

        {youtubeId && (
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
                style={{ display: 'none' }} 
              />
              
              {youtubeId && (
                <div 
                  className="spotify-pseudo-waveform"
                  style={{ cursor: isDragging ? 'grabbing' : 'ew-resize' }}
                  onMouseDown={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const moveHandler = (moveEvent) => {
                      const newX = moveEvent.clientX - rect.left;
                      const pct = Math.max(0, Math.min(1, newX / rect.width));
                      const duration = youtubePlayer?.getDuration() || 300;
                      setCurrentTime(pct * duration);
                    };
                    const upHandler = (upEvent) => {
                      setIsDragging(false);
                      const newX = upEvent.clientX - rect.left;
                      const pct = Math.max(0, Math.min(1, newX / rect.width));
                      const duration = youtubePlayer?.getDuration() || 300;
                      const newTime = pct * duration;
                      setCurrentTime(newTime);
                      if (youtubePlayer && youtubePlayer.seekTo) {
                        youtubePlayer.seekTo(newTime, true);
                      }
                      window.removeEventListener('mousemove', moveHandler);
                      window.removeEventListener('mouseup', upHandler);
                    };
                    setIsDragging(true);
                    window.addEventListener('mousemove', moveHandler);
                    window.addEventListener('mouseup', upHandler);
                    moveHandler(e);
                  }}
                >

                  <div className={`spotify-playhead ${isDragging ? 'active' : ''}`} style={{ left: `${(currentTime / (youtubePlayer?.getDuration() || 300)) * 100}%` }} />
                  <svg viewBox={`0 0 3000 120`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                    {/* Generate a fake waveform pattern for visual feedback */}
                    {Array.from({ length: 100 }).map((_, i) => {
                      const waveHeight = 20 + Math.sin(i * 0.5) * 40 + Math.random() * 20;
                      return (
                        <rect 
                          key={i}
                          x={i * 30}
                          y={60 - waveHeight / 2}
                          width={15}
                          height={waveHeight}
                          fill={i * 30 * (youtubePlayer?.getDuration() || 300) / 3000 <= currentTime ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}
                          opacity={0.8}
                          rx={4}
                        />
                      );
                    })}
                  </svg>
                </div>
              )}

              <div className="markers-layer">
                {markers.map(marker => {
                  const duration = wavesurfer.current?.getDuration() || youtubePlayer?.getDuration() || 300;
                  return (
                    <div 
                      key={marker.id}
                      className={`marker-tip ${marker.type}`}
                      style={{ 
                        left: `${(marker.time / duration) * 100}%`
                      }}
                      onClick={() => {
                        if (wavesurfer.current) wavesurfer.current.setTime(marker.time);
                        else if (youtubePlayer) {
                          setCurrentTime(marker.time);
                          youtubePlayer.seekTo(marker.time, true);
                        }
                      }}
                    >
                      <span className="marker-icon">
                        {marker.emoji || (
                          <>
                            {marker.type === 'bongo' && '🥁'}
                            {marker.type === 'roll' && '🌀'}
                            {marker.type === 'break' && '⚡'}
                            {marker.type === 'guira' && '🥄'}
                            {marker.type === 'custom' && '📍'}
                          </>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

              {(wavesurfer.current?.getDuration() > 0 || youtubeId || manualTimer) && (
                <div className="recording-console animate-fade-in glass">
                  <button 
                    className="instrument-btn bongo" 
                    onClick={() => addMarker('bongo', 'Bongo', '#3b82f6')}
                  >
                    <span className="icon">🥁</span>
                    <span className="name">Bongo</span>
                  </button>
                  <button 
                    className="instrument-btn roll" 
                    onClick={() => addMarker('roll', 'Bongo Roll', '#a855f7')}
                  >
                    <span className="icon">🌀</span>
                    <span className="name">Roll</span>
                  </button>
                  <button 
                    className="instrument-btn break" 
                    onClick={() => addMarker('break', 'Break', '#ef4444')}
                  >
                    <span className="icon">⚡</span>
                    <span className="name">Break</span>
                  </button>
                  <button 
                    className="instrument-btn guira" 
                    onClick={() => addMarker('guira', 'Guira', '#10b981')}
                  >
                    <span className="icon">🥄</span>
                    <span className="name">Guira</span>
                  </button>
                  <button 
                    className="instrument-btn custom-marker" 
                    onClick={() => {
                      const label = prompt('Nom du marqueur ?');
                      const emoji = prompt('Emoji pour le marqueur ?', '📍');
                      if (label) addMarker('custom', label, '#f59e0b', emoji);
                    }}
                  >
                    <span className="icon">➕</span>
                    <span className="name">Custom</span>
                  </button>
                </div>
              )}

            {youtubeId && (
              <div className="spotify-embed-container glass animate-fade-in" style={{ display: youtubePlayer ? 'none' : 'block' }}>
                <p className="manual-hint">Lance la vidéo YouTube 👆 pour synchroniser ton écoute.</p>
              </div>
            )}
            <div id="youtube-player-container" style={{ display: youtubePlayer && youtubeId ? 'block' : 'none', borderRadius: '16px', overflow: 'hidden', marginBottom: '32px' }}></div>

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
                 className={`btn-icon-secondary ${saveStatus === 'saved' ? 'success' : ''}`} 
                 onClick={user ? saveToSupabase : () => setShowLoginModal(true)}
                 disabled={isAuthLoading || saveStatus === 'saving'}
                 title={user ? 'Sauvegarder dans le Cloud' : 'Se connecter pour sauvegarder'}
                 style={{ 
                   position: 'relative',
                   background: saveStatus === 'saved' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                   borderColor: saveStatus === 'saved' ? '#10b981' : 'var(--border)'
                 }}
               >
                 {saveStatus === 'saving' ? '⏳' : (saveStatus === 'saved' ? '✅' : (user ? '☁️' : '👤'))}
                 {saveStatus === 'saved' && (
                   <span style={{ 
                     position: 'absolute', 
                     top: '-25px', 
                     left: '50%', 
                     transform: 'translateX(-50%)', 
                     fontSize: '0.7rem', 
                     background: '#10b981', 
                     color: 'white', 
                     padding: '2px 8px', 
                     borderRadius: '4px',
                     whiteSpace: 'nowrap'
                   }}>
                     Sauvegardé !
                   </span>
                 )}
               </button>

              
              <button 
                className="btn-icon-secondary" 
                onClick={clearMarkers}
                title="Supprimer tous les marqueurs"
              >
                🗑️
              </button>
            </div>

            <div className="markers-list">
              <h3>Marqueurs ({markers.length})</h3>
              <div className="markers-grid">
                {markers.map(m => (
                  <div 
                    key={m.id} 
                    className={`marker-item ${activeMarkerId === m.id ? 'active' : ''}`} 
                    onClick={() => {
                      if (wavesurfer.current) wavesurfer.current.setTime(m.time);
                      else if (youtubePlayer) {
                        setCurrentTime(m.time);
                        youtubePlayer.seekTo(m.time, true);
                      }
                      setActiveMarkerId(m.id);
                    }}
                  >
                    <div className="marker-header">
                      <div className="marker-meta">
                        <span className="marker-time">{Math.floor(m.time / 60)}:{(m.time % 60).toFixed(1).padStart(4, '0')}</span>
                        <div className="marker-label-row">
                          <span className="marker-dot" style={{ backgroundColor: m.color }} />
                          <span className="marker-label">{m.label}</span>
                        </div>
                      </div>
                      
                      <div className="marker-actions-small">
                        {(m.note || m.videoUrl) && (
                          <div className="marker-badges">
                            {m.note && <span className="badge">📝</span>}
                            {m.videoUrl && <span className="badge">🎬</span>}
                          </div>
                        )}
                        <button 
                          className="marker-delete-btn" 
                          onClick={(e) => { e.stopPropagation(); deleteMarker(m.id); }}
                          title="Supprimer"
                        >
                          ×
                        </button>
                      </div>
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
                            placeholder="Lien YouTube..." 
                            value={m.videoUrl}
                            onChange={(e) => updateMarker(m.id, { videoUrl: e.target.value })}
                          />
                        </div>

                        <div className="edit-actions">
                          <button className="btn-close" onClick={() => setActiveMarkerId(null)}>OK</button>
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
          padding: 16px 20px 20px 20px;
          border-top: 1px solid rgba(255,255,255,0.1);
          display: flex;
          flex-direction: column;
          gap: 16px;
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
          padding: 10px 16px;
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
          margin-top: 4px;
        }
        .edit-actions {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          margin-top: 4px;
          padding-top: 12px;
          border-top: 1px dashed rgba(255,255,255,0.08);
        }
        .btn-close {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 6px 16px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-close:hover {
          background: var(--accent);
          border-color: var(--accent);
          transform: translateY(-1px);
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slideUp 0.3s ease-out; }

        /* Source Section */
        .source-section {
          border-radius: 24px;
          padding: 24px;
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 640px;
          margin-inline: auto;
        }
        .source-header {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }
        .source-icon { font-size: 1.8rem; line-height: 1; }
        .source-title {
          font-size: 1rem;
          font-weight: 800;
          color: white;
          margin: 0 0 4px;
        }
        .source-subtitle {
          font-size: 0.78rem;
          color: rgba(255,255,255,0.45);
          margin: 0;
        }
        .source-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          color: rgba(255,255,255,0.2);
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .source-divider::before, .source-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.08);
        }
        .source-alt-row {
          display: flex;
          gap: 10px;
        }
        .source-alt-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: rgba(255,255,255,0.7);
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .source-alt-btn:hover {
          border-color: var(--accent);
          color: white;
          background: rgba(124,58,237,0.1);
        }
        .source-url-input {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          padding: 10px 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          transition: border-color 0.2s;
        }
        .source-url-input:focus-within {
          border-color: rgba(124,58,237,0.5);
        }
        .source-url-input input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: white;
          font-size: 0.82rem;
        }
        .source-url-input input::placeholder { color: rgba(255,255,255,0.3); }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 40px 24px;
          max-width: 640px;
          margin: 0 auto;
        }
        .empty-state-icon { font-size: 3.5rem; margin-bottom: 16px; }
        .empty-state h3 {
          font-size: 1.3rem;
          font-weight: 800;
          margin: 0 0 24px;
        }
        .empty-how-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          text-align: left;
        }
        @media (max-width: 500px) {
          .empty-how-grid { grid-template-columns: 1fr; }
          .source-alt-row { flex-direction: column; }
        }
        .how-step {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 16px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          font-size: 0.85rem;
          color: rgba(255,255,255,0.7);
          line-height: 1.5;
        }
        .step-num {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #c026d3);
          color: white;
          font-size: 0.75rem;
          font-weight: 900;
          flex-shrink: 0;
        }

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

        .btn-icon-pill {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1.5px solid var(--border);
          padding: 12px 24px;
          border-radius: 999px;
          color: white;
          font-weight: 800;
          transition: all 0.2s;
          cursor: pointer;
        }
        .btn-icon-pill.active {
          background: rgba(239, 68, 68, 0.15);
          border-color: var(--red);
          color: var(--red);
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
          padding-right: 28px;
        }
        .btn-icon-pill .dot {
          width: 8px;
          height: 8px;
          background: var(--text-muted);
          border-radius: 50%;
        }
        .btn-icon-pill.active .dot { background: var(--red); animation: blink 1s infinite; }
        .btn-icon-pill .btn-text { font-size: 1.2rem; }
        .btn-icon-pill.active .btn-text { font-size: 0.9rem; }

        .btn-icon-secondary {
          background: rgba(255, 255, 255, 0.05);
          color: white;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          border: 1px solid var(--border);
          transition: all 0.2s;
          cursor: pointer;
          flex-shrink: 0;
        }
        .btn-icon-secondary:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          border-color: var(--accent);
          transform: translateY(-2px);
        }
        .btn-icon-secondary:disabled { opacity: 0.5; cursor: not-allowed; }

        .recording-console {
          display: flex;
          gap: 12px;
          padding: 16px;
          border-radius: 24px;
          margin-bottom: 24px;
          border: 1px solid var(--accent);
          background: rgba(124, 58, 237, 0.05);
          overflow-x: auto;
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE/Edge */
        }
        .recording-console::-webkit-scrollbar {
          display: none; /* Chrome/Safari */
        }
        .instrument-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px;
          border-radius: 20px;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.1);
          color: white;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          user-select: none;
          -webkit-tap-highlight-color: transparent;
          flex: 1 0 auto; /* Ensure they don't shrink too much */
          min-width: 90px;
        }
        .instrument-btn:active { transform: scale(0.92); }
        .instrument-btn .icon { font-size: 1.8rem; }
        .instrument-btn .name { font-size: 0.75rem; font-weight: 700; opacity: 0.8; white-space: nowrap; }
        
        .instrument-btn.bongo { background: rgba(59, 130, 246, 0.1); border-color: #3b82f6; }
        .instrument-btn.roll { background: rgba(168, 85, 247, 0.1); border-color: #a855f7; }
        .instrument-btn.break { background: rgba(239, 68, 68, 0.1); border-color: #ef4444; }
        .instrument-btn.guira { background: rgba(16, 185, 129, 0.1); border-color: #10b981; }
        .instrument-btn.custom-marker { background: rgba(245, 158, 11, 0.1); border-color: #f59e0b; }

        .markers-list h3 { margin-bottom: 24px; font-size: 1.2rem; color: var(--text-secondary); font-weight: 800; }
        .markers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }
        .marker-item {
          background: rgba(255, 255, 255, 0.03);
          padding: 0;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          height: fit-content;
        }
        .marker-item:hover { 
          transform: translateY(-3px); 
          border-color: rgba(255, 255, 255, 0.3); 
          background: rgba(255, 255, 255, 0.07); 
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
        }
        .marker-item.active {
          border-color: var(--accent);
          background: rgba(124, 58, 237, 0.06);
          box-shadow: 0 0 20px rgba(124, 58, 237, 0.2);
        }
        
        .marker-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 16px 20px;
          width: 100%;
        }
        
        .marker-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
          min-width: 0;
        }
        
        .marker-time { 
          font-family: 'JetBrains Mono', monospace; 
          font-size: 0.8rem; 
          color: var(--text-muted); 
          font-weight: 700; 
          letter-spacing: 0.05em;
        }
        
        .marker-label-row {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
        }
        
        .marker-dot { 
          width: 8px; 
          height: 8px; 
          border-radius: 50%; 
          flex-shrink: 0;
        }
        
        .marker-label { 
          font-size: 1rem; 
          font-weight: 600; 
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .marker-actions-small {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: 12px;
        }
        
        .marker-badges {
          display: flex;
          gap: 4px;
        }
        
        .marker-delete-btn {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          line-height: 1;
          cursor: pointer;
          transition: all 0.2s;
        }
        .marker-delete-btn:hover { 
          background: rgba(239, 68, 68, 0.15); 
          border-color: rgba(239, 68, 68, 0.5);
          color: #ef4444; 
        }
        
        @media (max-width: 768px) {
          .player-section { padding: 20px; }
          .controls-row { justify-content: center; gap: 12px; margin-bottom: 24px; }
          .time-display { width: 100%; text-align: center; order: -1; margin-bottom: 8px; font-size: 1.2rem; }
          .btn-play-large { width: 60px; height: 60px; border-radius: 20px; }
          .btn-icon-pill { padding: 10px 20px; }
          .btn-icon-secondary { width: 44px; height: 44px; font-size: 1.1rem; }
          .trainer-content { padding-top: 16px; }
          .recording-console { padding: 12px; border-radius: 16px; }
          .instrument-btn { padding: 12px; min-width: 75px; border-radius: 16px; gap: 4px; }
          .instrument-btn .icon { font-size: 1.5rem; }
          .instrument-btn .name { font-size: 0.7rem; }
        }
      `}</style>
    </div>
  );
}
