import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function PendingSongsAdmin() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [supabaseClient, setSupabaseClient] = useState(null);
  const [pendingSongs, setPendingSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

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
            fetchPendingSongs(client);
          } else {
            router.push('/'); // Pas autorisé
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
  }, [router]);

  const fetchPendingSongs = async (client) => {
    setLoading(true);
    try {
      const { data, error } = await client
        .from('pending_songs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPendingSongs(data || []);
    } catch (error) {
      console.error('Error fetching pending songs:', error);
      alert('Erreur lors de la récupération des chansons en attente.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (song) => {
    if (!supabaseClient) return;
    setActionLoading(true);
    try {
      // 1. Insert into songs
      const { error: insertError } = await supabaseClient
        .from('songs')
        .insert({
          id: song.id,
          title: song.title,
          artist: song.artist,
          year: song.year,
          dateAdded: song.dateAdded,
          tags: song.tags,
          color: song.color,
          spotify: song.spotify,
          danceVideo: song.danceVideo,
          culture: song.culture,
          culture_en: song.culture_en,
          lyrics: song.lyrics
          // We can also set created_by to song.submitted_by if we want to track it
        });

      if (insertError) throw insertError;

      // 2. Delete from pending_songs
      const { error: deleteError } = await supabaseClient
        .from('pending_songs')
        .delete()
        .eq('id', song.id);
      
      if (deleteError) throw deleteError;

      setPendingSongs(prev => prev.filter(s => s.id !== song.id));
      alert(`✅ "${song.title}" a été approuvée et publiée avec succès !`);
    } catch (error) {
      console.error('Error approving song:', error);
      alert('Erreur lors de l\'approbation : ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (songId) => {
    if (!supabaseClient) return;
    if (!confirm("Voulez-vous vraiment rejeter et supprimer cette suggestion ?")) return;

    setActionLoading(true);
    try {
      const { error } = await supabaseClient
        .from('pending_songs')
        .delete()
        .eq('id', songId);
      
      if (error) throw error;

      setPendingSongs(prev => prev.filter(s => s.id !== songId));
    } catch (error) {
      console.error('Error rejecting song:', error);
      alert('Erreur lors du rejet : ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loadingAuth) return <div style={{ padding: 40, color: 'white' }}>Vérification des droits d'accès...</div>;
  if (!user) return null;

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1000px', margin: '0 auto', color: 'white' }}>
      <Head>
        <title>Admin - Chansons en attente</title>
      </Head>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Chansons en attente de validation</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Gérez les suggestions envoyées par les utilisateurs.
          </p>
        </div>
        <button 
          onClick={() => fetchPendingSongs(supabaseClient)} 
          style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}
        >
          🔄 Actualiser
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Chargement des suggestions...</div>
      ) : pendingSongs.length === 0 ? (
        <div style={{ background: '#1e1e24', padding: '40px', borderRadius: '16px', textAlign: 'center', color: '#94a3b8' }}>
          Aucune chanson en attente pour le moment.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {pendingSongs.map(song => (
            <div key={song.id} style={{ background: '#1e1e24', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{song.title} <span style={{ color: '#94a3b8', fontSize: '1.2rem' }}>- {song.artist}</span></h2>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>
                    Suggéré par : <strong>{song.submitted_by}</strong> le {new Date(song.created_at).toLocaleDateString()}
                  </p>
                  
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    {song.tags && song.tags.map(tag => (
                      <span key={tag} style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '4px 12px', borderRadius: '99px', fontSize: '0.8rem' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={() => handleReject(song.id)}
                    disabled={actionLoading}
                    style={{ padding: '10px 20px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', cursor: actionLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                  >
                    ❌ Rejeter
                  </button>
                  <button 
                    onClick={() => handleApprove(song)}
                    disabled={actionLoading}
                    style={{ padding: '10px 20px', borderRadius: '8px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', cursor: actionLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                  >
                    ✅ Approuver
                  </button>
                </div>
              </div>

              <div style={{ background: 'black', padding: '16px', borderRadius: '8px', marginTop: '16px' }}>
                <h3 style={{ fontSize: '1rem', color: '#cbd5e1', marginBottom: '8px' }}>Détails générés (Aperçu)</h3>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 300px' }}>
                    <strong>Contexte culturel :</strong>
                    <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '4px' }}>{song.culture?.context || 'N/A'}</p>
                  </div>
                  <div style={{ flex: '1 1 300px' }}>
                    <strong>Liens :</strong>
                    <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '4px' }}>
                      YouTube: {song.danceVideo ? <a href={`https://youtube.com/watch?v=${song.danceVideo}`} target="_blank" rel="noreferrer" style={{color: '#60a5fa'}}>Lien</a> : 'Non'}<br/>
                      Spotify: {song.spotify ? <a href={song.spotify} target="_blank" rel="noreferrer" style={{color: '#10b981'}}>Lien</a> : 'Non'}
                    </p>
                  </div>
                </div>
                <details style={{ marginTop: '12px', color: '#cbd5e1', fontSize: '0.9rem', cursor: 'pointer' }}>
                  <summary>Voir le JSON complet</summary>
                  <pre style={{ marginTop: '8px', color: '#94a3b8', overflowX: 'auto', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                    {JSON.stringify(song, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
