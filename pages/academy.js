import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Script from 'next/script';
import Navbar from '../components/Navbar';
import SeoFooter from '../components/SeoFooter';
import AuthModal from '../components/AuthModal';
import { songs } from '../data/songs';

export default function Academy() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [supabaseClient, setSupabaseClient] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' | 'objectives'

  const [notes, setNotes] = useState([]);
  const [objectives, setObjectives] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Forms
  const [newNote, setNewNote] = useState('');
  const [newObj, setNewObj] = useState({ footwork: '', song_id: '', couple_move: '' });
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isSubmittingObj, setIsSubmittingObj] = useState(false);

  const [editingObjId, setEditingObjId] = useState(null);
  const [editObjForm, setEditObjForm] = useState({ footwork: '', song_id: '', couple_move: '' });
  const [isUpdatingObj, setIsUpdatingObj] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.supabase) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey) {
        const client = window.supabase.createClient(supabaseUrl, supabaseKey);
        setSupabaseClient(client);
        
        client.auth.getSession().then(({ data: { session } }) => {
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          if (currentUser) {
            fetchData(client, currentUser.id);
          } else {
            setIsLoading(false);
          }
        });

        const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          if (currentUser) {
            fetchData(client, currentUser.id);
          } else {
            setNotes([]);
            setObjectives([]);
          }
        });

        return () => subscription.unsubscribe();
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  // Make sure we try to load Supabase object if it's already in window
  useEffect(() => {
    if (typeof window !== 'undefined' && !supabaseClient && window.supabase) {
       const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
       const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
       if (supabaseUrl && supabaseKey) {
         const client = window.supabase.createClient(supabaseUrl, supabaseKey);
         setSupabaseClient(client);
         client.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) fetchData(client, session.user.id);
         });
       }
    }
  }, [supabaseClient]);

  const fetchData = async (client, userId) => {
    setIsLoading(true);
    // Fetch Notes
    const { data: notesData } = await client
      .from('academy_notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (notesData) setNotes(notesData);

    // Fetch Objectives
    const { data: objData } = await client
      .from('academy_objectives')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (objData) setObjectives(objData);
    
    setIsLoading(false);
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim() || !user || !supabaseClient) return;
    setIsSubmittingNote(true);
    const { data, error } = await supabaseClient
      .from('academy_notes')
      .insert([{ user_id: user.id, content: newNote }])
      .select();
    
    if (data && data.length > 0) {
      setNotes([data[0], ...notes]);
      setNewNote('');
    }
    setIsSubmittingNote(false);
  };

  const handleDeleteNote = async (id) => {
    if (!supabaseClient) return;
    await supabaseClient.from('academy_notes').delete().eq('id', id);
    setNotes(notes.filter(n => n.id !== id));
  };

  const handleAddObjective = async (e) => {
    e.preventDefault();
    if (!user || !supabaseClient) return;
    if (!newObj.footwork.trim() && !newObj.song_id && !newObj.couple_move.trim()) return;
    
    setIsSubmittingObj(true);
    const { data, error } = await supabaseClient
      .from('academy_objectives')
      .insert([{ 
        user_id: user.id, 
        footwork: newObj.footwork.trim(), 
        song_id: newObj.song_id || null, 
        couple_move: newObj.couple_move.trim() 
      }])
      .select();
    
    if (data && data.length > 0) {
      setObjectives([data[0], ...objectives]);
      setNewObj({ footwork: '', song_id: '', couple_move: '' });
    }
    setIsSubmittingObj(false);
  };

  const handleToggleObjective = async (id, currentStatus) => {
    if (!supabaseClient) return;
    // Optimistic UI update
    setObjectives(objectives.map(o => o.id === id ? { ...o, completed: !currentStatus } : o));
    
    const { data, error } = await supabaseClient
      .from('academy_objectives')
      .update({ completed: !currentStatus })
      .eq('id', id)
      .select();
    
    if (error) {
      // Revert if error
      setObjectives(objectives.map(o => o.id === id ? { ...o, completed: currentStatus } : o));
    }
  };

  const handleDeleteObjective = async (id) => {
    if (!supabaseClient) return;
    await supabaseClient.from('academy_objectives').delete().eq('id', id);
    setObjectives(objectives.filter(o => o.id !== id));
  };

  const handleStartEdit = (obj) => {
    setEditingObjId(obj.id);
    setEditObjForm({
      footwork: obj.footwork || '',
      song_id: obj.song_id || '',
      couple_move: obj.couple_move || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingObjId(null);
    setEditObjForm({ footwork: '', song_id: '', couple_move: '' });
  };

  const handleUpdateObjective = async (e, id) => {
    e.preventDefault();
    if (!supabaseClient) return;
    setIsUpdatingObj(true);

    const { data, error } = await supabaseClient
      .from('academy_objectives')
      .update({
        footwork: editObjForm.footwork.trim(),
        song_id: editObjForm.song_id || null,
        couple_move: editObjForm.couple_move.trim()
      })
      .eq('id', id)
      .select();

    if (data && data.length > 0) {
      setObjectives(objectives.map(o => o.id === id ? data[0] : o));
      setEditingObjId(null);
    }
    setIsUpdatingObj(false);
  };

  const getSongById = (id) => songs.find(s => s.id === id);

  return (
    <>
      <Head>
        <title>Dance Academy — Bachata Lyrics</title>
        <meta name="description" content="Ton espace d'apprentissage Bachata : notes, objectifs, musiques et footworks." />
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
            client.auth.getSession().then(({ data: { session } }) => {
              const currentUser = session?.user ?? null;
              if (currentUser) fetchData(client, currentUser.id);
            });
          }
        }}
      />

      <Navbar 
        user={user} 
        supabaseClient={supabaseClient} 
        onLoginClick={() => setShowLoginModal(true)} 
        activePage="academy"
      />

      <AuthModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        supabaseClient={supabaseClient}
      />

      <main className="academy-container">
        <div className="academy-header">
          <h1>🎓 Dance Academy</h1>
          <p>Ton espace personnel pour suivre ta progression en bachata.</p>
        </div>

        {!user ? (
          <div className="login-prompt">
            <div className="login-prompt-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#a78bfa' }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h2>Connecte-toi pour accéder à ton académie</h2>
            <p>Sauvegarde tes notes d'amélioration et tes objectifs quotidiens sur ton compte.</p>
            <button className="btn-primary" onClick={() => setShowLoginModal(true)}>
              Se connecter / Créer un compte
            </button>
          </div>
        ) : (
          <div className="academy-content">
            <div className="tabs">
              <button 
                className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
                onClick={() => setActiveTab('notes')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px', verticalAlign: 'middle'}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                Mes Notes
              </button>
              <button 
                className={`tab-btn ${activeTab === 'objectives' ? 'active' : ''}`}
                onClick={() => setActiveTab('objectives')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px', verticalAlign: 'middle'}}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                Mes Objectifs
              </button>
            </div>

            {isLoading ? (
              <div className="loading-state">Chargement de tes données...</div>
            ) : (
              <div className="tab-content animate-fade-in">
                {activeTab === 'notes' && (
                  <div className="notes-section">
                    <form className="add-form" onSubmit={handleAddNote}>
                      <textarea
                        placeholder="Un truc à améliorer ? Une idée de style ? Note-le ici..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        required
                        rows={3}
                      />
                      <button type="submit" className="btn-submit" disabled={isSubmittingNote || !newNote.trim()}>
                        {isSubmittingNote ? 'Ajout...' : '+ Ajouter une note'}
                      </button>
                    </form>

                    <div className="items-list">
                      {notes.length === 0 ? (
                        <p className="empty-state">Tu n'as pas encore de notes. Commence à écrire !</p>
                      ) : (
                        notes.map(note => (
                          <div key={note.id} className="note-card">
                            <p>{note.content}</p>
                            <div className="note-footer">
                              <span className="note-date">
                                {new Date(note.created_at).toLocaleDateString('fr-FR')}
                              </span>
                              <button className="btn-icon btn-delete" onClick={() => handleDeleteNote(note.id)} title="Supprimer">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                <span>Supprimer</span>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'objectives' && (
                  <div className="objectives-section">
                    <form className="add-form" onSubmit={handleAddObjective}>
                      <h3>Ajouter un nouvel objectif</h3>
                      
                      <div className="form-group">
                        <label>Footwork à travailler</label>
                        <input
                          type="text"
                          placeholder="Ex: Piqué croisé, Basic Madrid..."
                          value={newObj.footwork}
                          onChange={(e) => setNewObj({...newObj, footwork: e.target.value})}
                        />
                      </div>

                      <div className="form-group">
                        <label>Passe de danse de couple</label>
                        <input
                          type="text"
                          placeholder="Ex: Enchufla double, Rompe, Vueltas..."
                          value={newObj.couple_move}
                          onChange={(e) => setNewObj({...newObj, couple_move: e.target.value})}
                        />
                      </div>

                      <div className="form-group">
                        <label>Musique à travailler</label>
                        <input
                          type="text"
                          list="songs-list"
                          placeholder="Rechercher ou écrire une musique..."
                          value={newObj.song_id}
                          onChange={(e) => setNewObj({...newObj, song_id: e.target.value})}
                        />
                        <datalist id="songs-list">
                          {songs.map(song => (
                            <option key={song.id} value={song.id}>
                              {song.title} - {song.artist}
                            </option>
                          ))}
                        </datalist>
                      </div>

                      <button 
                        type="submit" 
                        className="btn-submit" 
                        disabled={isSubmittingObj || (!newObj.footwork && !newObj.song_id && !newObj.couple_move)}
                      >
                        {isSubmittingObj ? 'Ajout...' : '+ Ajouter à ma Todo List'}
                      </button>
                    </form>

                    <div className="items-list">
                      {objectives.length === 0 ? (
                        <p className="empty-state">Aucun objectif pour le moment. Fixe-toi un but !</p>
                      ) : (
                        objectives.map(obj => {
                          const linkedSong = obj.song_id ? getSongById(obj.song_id) : null;
                          const isEditing = editingObjId === obj.id;
                          return (
                            <div key={obj.id} className={`objective-card ${obj.completed && !isEditing ? 'completed' : ''}`}>
                              {isEditing ? (
                                <form className="edit-form" onSubmit={(e) => handleUpdateObjective(e, obj.id)}>
                                  <div className="form-group">
                                    <label>Footwork à travailler</label>
                                    <input
                                      type="text"
                                      value={editObjForm.footwork}
                                      onChange={(e) => setEditObjForm({...editObjForm, footwork: e.target.value})}
                                    />
                                  </div>
                                  <div className="form-group">
                                    <label>Passe de danse de couple</label>
                                    <input
                                      type="text"
                                      value={editObjForm.couple_move}
                                      onChange={(e) => setEditObjForm({...editObjForm, couple_move: e.target.value})}
                                    />
                                  </div>
                                  <div className="form-group">
                                    <label>Musique à travailler</label>
                                    <input
                                      type="text"
                                      list={`edit-songs-list-${obj.id}`}
                                      value={editObjForm.song_id}
                                      onChange={(e) => setEditObjForm({...editObjForm, song_id: e.target.value})}
                                    />
                                    <datalist id={`edit-songs-list-${obj.id}`}>
                                      {songs.map(song => (
                                        <option key={song.id} value={song.id}>
                                          {song.title} - {song.artist}
                                        </option>
                                      ))}
                                    </datalist>
                                  </div>
                                  <div className="edit-actions">
                                    <button type="submit" className="btn-submit" disabled={isUpdatingObj}>
                                      {isUpdatingObj ? 'Sauvegarde...' : 'Sauvegarder'}
                                    </button>
                                    <button type="button" className="btn-cancel" onClick={handleCancelEdit}>
                                      Annuler
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                <>
                                  <label className="checkbox-container">
                                    <input 
                                      type="checkbox" 
                                      checked={obj.completed}
                                      onChange={() => handleToggleObjective(obj.id, obj.completed)}
                                    />
                                    <span className="checkmark"></span>
                                  </label>
                                  
                                  <div className="objective-content">
                                    {obj.footwork && (
                                      <div className="obj-detail">
                                        <span className="obj-badge">Footwork</span> {obj.footwork}
                                      </div>
                                    )}
                                    {obj.couple_move && (
                                      <div className="obj-detail">
                                        <span className="obj-badge">Couple</span> {obj.couple_move}
                                      </div>
                                    )}
                                    {obj.song_id && (
                                      <div className="obj-detail">
                                        <span className="obj-badge">Musique</span> 
                                        {linkedSong ? (
                                          <span className="song-link" onClick={() => router.push(`/song/${linkedSong.id}`)}>
                                            <u>{linkedSong.title} - {linkedSong.artist}</u> ↗
                                          </span>
                                        ) : (
                                          <span>{obj.song_id}</span>
                                        )}
                                      </div>
                                    )}
                                    <div className="note-date" style={{ marginTop: '8px' }}>
                                      Ajouté le {new Date(obj.created_at).toLocaleDateString('fr-FR')}
                                    </div>
                                  </div>

                                  <div className="obj-actions">
                                    <button className="btn-icon btn-edit" onClick={() => handleStartEdit(obj)} title="Modifier">
                                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                    </button>
                                    <button className="btn-icon btn-delete" onClick={() => handleDeleteObjective(obj.id)} title="Supprimer">
                                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <SeoFooter currentPage="academy" />

      <style jsx>{`
        .academy-container {
          min-height: 100vh;
          padding: 100px 24px 60px;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .academy-header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .academy-header h1 {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 8px;
          background: linear-gradient(135deg, #c026d3, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .academy-header p {
          color: var(--text-muted);
          font-size: 1.1rem;
        }

        .login-prompt {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 48px 24px;
          text-align: center;
          margin-top: 40px;
        }

        .login-prompt-icon {
          font-size: 3rem;
          margin-bottom: 16px;
        }

        .login-prompt h2 {
          font-size: 1.5rem;
          margin-bottom: 8px;
        }

        .login-prompt p {
          color: var(--text-muted);
          margin-bottom: 24px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #c026d3, #7c3aed);
          color: white;
          border: none;
          padding: 14px 28px;
          border-radius: 14px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 8px 24px rgba(124, 58, 237, 0.3);
        }
        
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(124, 58, 237, 0.5);
        }

        .tabs {
          display: flex;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 4px;
          margin-bottom: 32px;
        }

        .tab-btn {
          flex: 1;
          padding: 12px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-weight: 600;
          font-size: 1rem;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab-btn.active {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .add-form {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 24px;
          margin-bottom: 32px;
        }

        .add-form h3 {
          margin-top: 0;
          margin-bottom: 20px;
          font-size: 1.2rem;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 0.9rem;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .add-form input,
        .add-form select,
        .add-form textarea {
          width: 100%;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          padding: 14px;
          border-radius: 12px;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s;
          font-family: inherit;
        }

        .add-form input:focus,
        .add-form select:focus,
        .add-form textarea:focus {
          border-color: #a78bfa;
        }

        .add-form select {
          appearance: none;
          background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
          background-repeat: no-repeat;
          background-position: right 14px top 50%;
          background-size: 12px auto;
        }

        .btn-submit {
          width: 100%;
          padding: 14px;
          background: rgba(255,255,255,0.1);
          color: white;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 12px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-submit:hover:not(:disabled) {
          background: rgba(255,255,255,0.2);
        }

        .btn-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .items-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .empty-state {
          text-align: center;
          color: var(--text-muted);
          padding: 32px 0;
          background: rgba(255,255,255,0.02);
          border-radius: 16px;
          border: 1px dashed rgba(255,255,255,0.1);
        }

        .note-card, .objective-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 20px;
          transition: all 0.2s;
        }

        .note-card:hover, .objective-card:hover {
          background: rgba(255,255,255,0.06);
        }

        .note-card p {
          margin: 0 0 16px 0;
          white-space: pre-wrap;
          line-height: 1.5;
        }

        .note-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid rgba(255,255,255,0.05);
          padding-top: 12px;
        }

        .note-date {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .btn-icon {
          background: none;
          border: none;
          cursor: pointer;
          opacity: 0.6;
          transition: all 0.2s;
          padding: 6px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .btn-icon:hover {
          opacity: 1;
          background: rgba(255,255,255,0.05);
        }

        .btn-delete {
          color: #ef4444;
        }
        
        .btn-delete:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        .btn-edit {
          color: #a78bfa;
        }
        
        .btn-edit:hover {
          background: rgba(167, 139, 250, 0.1);
        }

        .obj-actions {
          display: flex;
          gap: 4px;
        }

        .edit-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .edit-form .form-group {
          margin-bottom: 0;
        }

        .edit-actions {
          display: flex;
          gap: 12px;
          margin-top: 12px;
        }
        
        .btn-cancel {
          flex: 1;
          padding: 14px;
          background: transparent;
          color: var(--text-muted);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-cancel:hover {
          background: rgba(255,255,255,0.05);
          color: white;
        }

        /* Objective Card specific */
        .objective-card {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .objective-card.completed {
          opacity: 0.6;
        }

        .objective-card.completed .objective-content {
          text-decoration: line-through;
          color: var(--text-muted);
        }

        .objective-content {
          flex: 1;
        }

        .obj-detail {
          margin-bottom: 8px;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .obj-badge {
          background: rgba(124, 58, 237, 0.15);
          color: #c4b5fd;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border: 1px solid rgba(124, 58, 237, 0.3);
        }

        .song-link {
          color: #a78bfa;
          cursor: pointer;
          display: inline-block;
        }

        .song-link:hover {
          color: #c4b5fd;
        }

        .objective-card.completed .song-link {
          color: var(--text-muted);
        }

        /* Custom Checkbox */
        .checkbox-container {
          display: block;
          position: relative;
          padding-left: 28px;
          margin-bottom: 24px;
          cursor: pointer;
          font-size: 22px;
          user-select: none;
        }

        .checkbox-container input {
          position: absolute;
          opacity: 0;
          cursor: pointer;
          height: 0;
          width: 0;
        }

        .checkmark {
          position: absolute;
          top: 0;
          left: 0;
          height: 24px;
          width: 24px;
          background-color: rgba(255,255,255,0.1);
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 6px;
          transition: all 0.2s;
        }

        .checkbox-container:hover input ~ .checkmark {
          background-color: rgba(255,255,255,0.2);
        }

        .checkbox-container input:checked ~ .checkmark {
          background-color: #8b5cf6;
          border-color: #8b5cf6;
        }

        .checkmark:after {
          content: "";
          position: absolute;
          display: none;
        }

        .checkbox-container input:checked ~ .checkmark:after {
          display: block;
        }

        .checkbox-container .checkmark:after {
          left: 7px;
          top: 3px;
          width: 6px;
          height: 12px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }

        .loading-state {
          text-align: center;
          padding: 60px 0;
          color: var(--text-muted);
          font-style: italic;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </>
  );
}
