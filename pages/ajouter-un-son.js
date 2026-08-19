import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import SeoFooter from '../components/SeoFooter';

export default function AjouterUnSon() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [supabaseClient, setSupabaseClient] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    year: new Date().getFullYear(),
    color: '#3b82f6', // default blue
    spotify: '',
    danceVideo: '',
    userContext: '',
    lyricsEs: ''
  });

  const [status, setStatus] = useState('idle'); // idle, generating, saving, success, error
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.supabase) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey) {
        const client = window.supabase.createClient(supabaseUrl, supabaseKey);
        setSupabaseClient(client);

        client.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            setUser(session.user);
          }
          setLoadingAuth(false);
        });
      } else {
        setLoadingAuth(false);
      }
    } else {
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    setStatus('generating');
    setErrorMessage('');

    try {
      // 1. Generate the song data with Gemini via our API
      const res = await fetch('/api/generate-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const generatedSong = await res.json();
      
      if (!res.ok) {
        throw new Error(generatedSong.error || "Erreur lors de la génération avec l'IA.");
      }

      setStatus('saving');

      // 2. Save to pending_songs table
      const { error } = await supabaseClient
        .from('pending_songs')
        .insert({
          id: generatedSong.id,
          title: generatedSong.title,
          artist: generatedSong.artist,
          year: generatedSong.year,
          dateAdded: generatedSong.dateAdded,
          tags: generatedSong.tags,
          color: generatedSong.color,
          spotify: generatedSong.spotify,
          danceVideo: generatedSong.danceVideo,
          culture: generatedSong.culture,
          culture_en: generatedSong.culture_en,
          lyrics: generatedSong.lyrics,
          submitted_by: user.email // Added by user
        });

      if (error) {
        throw new Error("Erreur lors de la sauvegarde : " + error.message);
      }

      setStatus('success');
      
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message || "Une erreur inattendue est survenue.");
      setStatus('error');
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '14px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: 'white',
    marginTop: '6px',
    outline: 'none',
    transition: 'all 0.3s ease',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: 'white', fontFamily: 'sans-serif' }}>
      <Head>
        <title>Ajouter une chanson | Bachata Flow</title>
        <meta name="description" content="Contribuez à Bachata Flow en ajoutant vos chansons préférées." />
      </Head>

      <Navbar />

      <main style={{ padding: '120px 20px 60px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ 
          background: 'rgba(255,255,255,0.03)', 
          backdropFilter: 'blur(16px)', 
          border: '1px solid rgba(255,255,255,0.1)', 
          borderRadius: '24px',
          padding: '40px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}>
          
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '16px', background: 'linear-gradient(135deg, #60a5fa, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Ajouter une Chanson
          </h1>
          
          <p style={{ color: '#94a3b8', marginBottom: '32px', fontSize: '1.1rem', lineHeight: '1.6' }}>
            Contribuez à la communauté en ajoutant de nouvelles chansons ! Collez les paroles en espagnol, et notre IA se chargera de les traduire et d'analyser le contexte culturel.
          </p>

          {loadingAuth ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Chargement...</div>
          ) : !user ? (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.2)', 
              borderRadius: '12px', 
              padding: '24px', 
              textAlign: 'center' 
            }}>
              <h2 style={{ color: '#f87171', fontSize: '1.2rem', marginBottom: '16px' }}>Connexion requise</h2>
              <p style={{ color: '#fca5a5', marginBottom: '20px' }}>Vous devez être connecté pour proposer une chanson.</p>
              <button 
                onClick={() => document.getElementById('login-modal-trigger')?.click()}
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Se connecter
              </button>
            </div>
          ) : status === 'success' ? (
            <div style={{ 
              background: 'rgba(16, 185, 129, 0.1)', 
              border: '1px solid rgba(16, 185, 129, 0.2)', 
              borderRadius: '16px', 
              padding: '40px', 
              textAlign: 'center' 
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎉</div>
              <h2 style={{ color: '#34d399', fontSize: '1.5rem', marginBottom: '16px' }}>Chanson envoyée avec succès !</h2>
              <p style={{ color: '#6ee7b7', marginBottom: '24px' }}>
                Merci pour votre contribution ! Maximilien va la valider très prochainement.
              </p>
              <button 
                onClick={() => setStatus('idle')}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  cursor: 'pointer'
                }}
              >
                Ajouter une autre chanson
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: '500' }}>Titre *</label>
                  <input required style={inputStyle} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ex: Propuesta Indecente" />
                </div>
                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: '500' }}>Artiste *</label>
                  <input required style={inputStyle} value={formData.artist} onChange={e => setFormData({...formData, artist: e.target.value})} placeholder="Ex: Romeo Santos" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: '500' }}>Lien YouTube (Obligatoire) *</label>
                  <input required style={inputStyle} value={formData.danceVideo} onChange={e => setFormData({...formData, danceVideo: e.target.value})} placeholder="Ex: QFs3PIZb3js ou lien complet" />
                  <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'block' }}>L'URL ou l'ID de la vidéo Youtube.</span>
                </div>
                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: '500' }}>Lien Spotify (Optionnel)</label>
                  <input style={inputStyle} value={formData.spotify} onChange={e => setFormData({...formData, spotify: e.target.value})} placeholder="Lien vers la piste Spotify" />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: '500' }}>Contexte / Histoire de la chanson (Obligatoire) *</label>
                <textarea 
                  required 
                  style={{...inputStyle, height: '100px', resize: 'vertical'}} 
                  value={formData.userContext} 
                  onChange={e => setFormData({...formData, userContext: e.target.value})} 
                  placeholder="Raconte l'histoire de la chanson, des infos sur l'artiste, etc. L'IA s'en servira pour enrichir la fiche !"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: '500' }}>Paroles originales (Espagnol) *</label>
                <textarea 
                  required 
                  style={{...inputStyle, height: '250px', resize: 'vertical', fontFamily: 'monospace'}} 
                  value={formData.lyricsEs} 
                  onChange={e => setFormData({...formData, lyricsEs: e.target.value})} 
                  placeholder="[Verso 1]\nHola, ¿qué tal?..."
                />
              </div>

              {status === 'error' && (
                <div style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  {errorMessage}
                </div>
              )}

              <button 
                type="submit" 
                disabled={status === 'generating' || status === 'saving'} 
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  border: 'none',
                  cursor: (status === 'generating' || status === 'saving') ? 'not-allowed' : 'pointer',
                  opacity: (status === 'generating' || status === 'saving') ? 0.7 : 1,
                  boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
                  transition: 'all 0.3s ease',
                  marginTop: '12px'
                }}
              >
                {status === 'generating' ? '✨ L\'IA traduit les paroles...' : 
                 status === 'saving' ? '💾 Enregistrement...' : 
                 '🚀 Ajouter la chanson'}
              </button>
            </form>
          )}
        </div>
      </main>

      <SeoFooter />
    </div>
  );
}
