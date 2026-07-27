import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function AddSongAdmin() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [supabaseClient, setSupabaseClient] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '', artist: '', year: new Date().getFullYear(),
    color: '#64748b', spotify: '', danceVideo: '', lyricsEs: ''
  });

  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [generatedSong, setGeneratedSong] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.supabase) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey) {
        const client = window.supabase.createClient(supabaseUrl, supabaseKey);
        setSupabaseClient(client);

        client.auth.getSession().then(({ data: { session } }) => {
          if (session?.user?.email === 'maximilien.godeau.off@gmail.com') {
            setUser(session.user);
          } else {
            router.push('/'); // Pas autorisé
          }
          setLoadingAuth(false);
        });
      } else {
        setLoadingAuth(false);
      }
    } else {
      // Supabase pas encore chargé
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }, [router]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoadingGenerate(true);
    setSaveMessage(null);
    setGeneratedSong(null);

    try {
      const res = await fetch('/api/generate-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedSong(data);
      } else {
        alert("Erreur de génération : " + data.error);
      }
    } catch (error) {
      console.error(error);
      alert("Erreur réseau lors de la génération.");
    } finally {
      setLoadingGenerate(false);
    }
  };

  const handleSaveToDB = async () => {
    if (!generatedSong || !supabaseClient) return;
    setSaving(true);
    setSaveMessage(null);

    try {
      const { error } = await supabaseClient
        .from('songs')
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
          lyrics: generatedSong.lyrics
        });

      if (error) throw error;
      setSaveMessage("✅ Chanson sauvegardée avec succès ! Elle est maintenant en ligne.");
      // Optionnel : réinitialiser le form
    } catch (error) {
      console.error(error);
      setSaveMessage("❌ Erreur lors de la sauvegarde : " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loadingAuth) return <div style={{ padding: 40, color: 'white' }}>Vérification des droits d'accès...</div>;
  if (!user) return null; // Sera redirigé par le useEffect

  return (
    <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto', color: 'white' }}>
      <Head>
        <title>Admin - Ajouter une Chanson</title>
      </Head>

      <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Espace Administrateur</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
        Ajout automatique de chanson via Gemini AI.
      </p>

      <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
        {/* Formulaire */}
        <form onSubmit={handleGenerate} style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label>Titre *</label>
            <input required style={inputStyle} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          <div>
            <label>Artiste *</label>
            <input required style={inputStyle} value={formData.artist} onChange={e => setFormData({...formData, artist: e.target.value})} />
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label>Année</label>
              <input type="number" style={inputStyle} value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Couleur dominante (Hex)</label>
              <input type="color" style={{...inputStyle, padding: '4px'}} value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} />
            </div>
          </div>
          <div>
            <label>Lien Spotify (Optionnel)</label>
            <input style={inputStyle} value={formData.spotify} onChange={e => setFormData({...formData, spotify: e.target.value})} />
          </div>
          <div>
            <label>ID YouTube (Dance Video) (Optionnel)</label>
            <input style={inputStyle} value={formData.danceVideo} onChange={e => setFormData({...formData, danceVideo: e.target.value})} />
          </div>
          <div>
            <label>Paroles originales (Espagnol) *</label>
            <textarea 
              required 
              style={{...inputStyle, height: '300px', fontFamily: 'monospace'}} 
              value={formData.lyricsEs} 
              onChange={e => setFormData({...formData, lyricsEs: e.target.value})} 
              placeholder="[Verso 1]\n..."
            />
          </div>

          <button type="submit" disabled={loadingGenerate} style={btnStyle}>
            {loadingGenerate ? 'Génération en cours...' : '✨ Générer avec Gemini AI'}
          </button>
        </form>

        {/* Aperçu */}
        {generatedSong && (
          <div style={{ flex: '1 1 300px', background: '#1e1e24', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2>Prévisualisation</h2>
            <div style={{ marginTop: '16px', maxHeight: '400px', overflowY: 'auto', fontSize: '0.8rem', background: 'black', padding: '16px', borderRadius: '8px' }}>
              <pre>{JSON.stringify(generatedSong, null, 2)}</pre>
            </div>

            <button 
              onClick={handleSaveToDB} 
              disabled={saving} 
              style={{...btnStyle, marginTop: '24px', background: 'linear-gradient(135deg, #10b981, #059669)'}}
            >
              {saving ? 'Sauvegarde...' : '💾 Enregistrer dans Supabase'}
            </button>
            {saveMessage && <p style={{ marginTop: '16px', fontWeight: 'bold' }}>{saveMessage}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '12px', background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '8px', color: 'white', marginTop: '4px'
};

const btnStyle = {
  padding: '16px', borderRadius: '12px', background: 'linear-gradient(135deg, #c026d3, #7c3aed)',
  color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontSize: '1rem'
};
