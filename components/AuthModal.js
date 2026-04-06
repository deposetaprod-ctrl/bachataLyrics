import { useState } from 'react';

/**
 * AuthModal — Fenêtre de connexion / inscription partagée
 * Props:
 *   isOpen         {boolean}    Afficher ou non la modale
 *   onClose        {function}   Fermer la modale
 *   supabaseClient {object}     Instance Supabase
 *   onSuccess      {function}   Callback appelé après connexion/inscription réussie
 */
export default function AuthModal({ isOpen, onClose, supabaseClient, onSuccess }) {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const reset = () => {
    setForm({ email: '', password: '', confirmPassword: '' });
    setError('');
    setSuccessMsg('');
    setIsLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setError('');
    setSuccessMsg('');
  };

  const handleLogin = async () => {
    if (!supabaseClient) return setError('Service indisponible, réessaie plus tard.');
    if (!form.email || !form.password) return setError('Remplis tous les champs.');
    setIsLoading(true);
    setError('');
    const { error } = await supabaseClient.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    setIsLoading(false);
    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Email ou mot de passe incorrect.'
        : error.message);
    } else {
      handleClose();
      if (onSuccess) onSuccess();
    }
  };

  const handleRegister = async () => {
    if (!supabaseClient) return setError('Service indisponible, réessaie plus tard.');
    if (!form.email || !form.password) return setError('Remplis tous les champs.');
    if (form.password.length < 6) return setError('Le mot de passe doit faire au moins 6 caractères.');
    if (form.password !== form.confirmPassword) return setError('Les mots de passe ne correspondent pas.');
    setIsLoading(true);
    setError('');
    const { data, error } = await supabaseClient.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin,
      }
    });
    setIsLoading(false);
    if (error) {
      setError(error.message);
    } else {
      if (data?.session) {
        handleClose();
        if (onSuccess) onSuccess();
      } else {
        setSuccessMsg('✅ Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse.');
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!supabaseClient) return setError('Service indisponible, réessaie plus tard.');
    if (!form.email) return setError('Remplis ton adresse email.');
    setIsLoading(true);
    setError('');
    const { error } = await supabaseClient.auth.resetPasswordForEmail(form.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccessMsg('✅ Un email de réinitialisation a été envoyé ! Vérifie ta boîte mail.');
    }
  };

  return (
    <>
      <div className="auth-modal-overlay animate-fade-in" onClick={handleClose}>
        <div className="auth-modal glass animate-slide-up" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="auth-modal-header">
            <img src="/LOGO_PWA.PNG" alt="Bachata Flow" className="auth-modal-logo" />
            <h2 className="auth-modal-title">Bachata Flow</h2>
            <button className="auth-modal-close" onClick={handleClose} aria-label="Fermer">✕</button>
          </div>

          {/* Tabs */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
              onClick={() => handleTabChange('login')}
            >
              Connexion
            </button>
            <button
              className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
              onClick={() => handleTabChange('register')}
            >
              Créer un compte
            </button>
          </div>

          {/* Body */}
          <div className="auth-modal-body">
            {tab === 'login' ? (
              <>
                <p className="auth-subtitle">Connecte-toi pour sauvegarder tes analyses dans le cloud.</p>
                <div className="auth-fields">
                  <input
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    autoFocus
                  />
                  <input
                    type="password"
                    placeholder="Mot de passe"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  />
                </div>
                {error && <p className="auth-error">{error}</p>}
                <button
                  className="auth-submit-btn"
                  onClick={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? 'Connexion...' : 'Se connecter →'}
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  <p className="auth-switch">
                    Pas encore de compte ?{' '}
                    <button className="auth-switch-link" onClick={() => handleTabChange('register')}>
                      Crée-en un !
                    </button>
                  </p>
                  <p className="auth-switch">
                    <button className="auth-switch-link" onClick={() => handleTabChange('forgot')}>
                      Mot de passe oublié ?
                    </button>
                  </p>
                </div>
              </>
            ) : tab === 'forgot' ? (
              <>
                <p className="auth-subtitle">Entre ton adresse email pour réinitialiser ton mot de passe.</p>
                {successMsg ? (
                  <div className="auth-success" style={{ marginBottom: '16px' }}>{successMsg}</div>
                ) : (
                  <>
                    <div className="auth-fields">
                      <input
                        type="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        onKeyDown={e => e.key === 'Enter' && handleForgotPassword()}
                        autoFocus
                      />
                    </div>
                    {error && <p className="auth-error">{error}</p>}
                    <button
                      className="auth-submit-btn"
                      onClick={handleForgotPassword}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Envoi...' : 'Réinitialiser →'}
                    </button>
                  </>
                )}
                <p className="auth-switch" style={{ marginTop: '10px' }}>
                  <button className="auth-switch-link" onClick={() => handleTabChange('login')}>
                    ← Retour à la connexion
                  </button>
                </p>
              </>
            ) : (
              <>
                <p className="auth-subtitle">Rejoins la communauté pour partager et retrouver tes analyses.</p>
                {successMsg ? (
                  <div className="auth-success">{successMsg}</div>
                ) : (
                  <>
                    <div className="auth-fields">
                      <input
                        type="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        autoFocus
                      />
                      <input
                        type="password"
                        placeholder="Mot de passe (min. 6 caractères)"
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                      />
                      <input
                        type="password"
                        placeholder="Confirmer le mot de passe"
                        value={form.confirmPassword}
                        onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                        onKeyDown={e => e.key === 'Enter' && handleRegister()}
                      />
                    </div>
                    {error && <p className="auth-error">{error}</p>}
                    <button
                      className="auth-submit-btn"
                      onClick={handleRegister}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Création...' : 'Créer mon compte →'}
                    </button>
                  </>
                )}
                <p className="auth-switch">
                  Déjà un compte ?{' '}
                  <button className="auth-switch-link" onClick={() => handleTabChange('login')}>
                    Se connecter
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .auth-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 24px;
        }
        .auth-modal {
          width: 100%;
          max-width: 420px;
          background: #0f0f1a;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6),
                      0 0 0 1px rgba(124, 58, 237, 0.15);
        }
        .auth-modal-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 24px 28px 0;
          position: relative;
        }
        .auth-modal-logo {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          object-fit: cover;
        }
        .auth-modal-title {
          font-size: 1.1rem;
          font-weight: 800;
          color: white;
          margin: 0;
          flex: 1;
        }
        .auth-modal-close {
          background: rgba(255, 255, 255, 0.08);
          border: none;
          color: rgba(255, 255, 255, 0.5);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .auth-modal-close:hover {
          background: rgba(255, 255, 255, 0.15);
          color: white;
        }
        .auth-tabs {
          display: flex;
          margin: 20px 28px 0;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 14px;
          padding: 4px;
          gap: 4px;
        }
        .auth-tab {
          flex: 1;
          padding: 10px;
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.5);
          border-radius: 11px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .auth-tab.active {
          background: linear-gradient(135deg, #7c3aed, #c026d3);
          color: white;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
        }
        .auth-modal-body {
          padding: 24px 28px 28px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .auth-subtitle {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.5);
          margin: 0;
          line-height: 1.5;
        }
        .auth-fields {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .auth-fields input {
          width: 100%;
          padding: 13px 16px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          color: white;
          font-size: 0.92rem;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          box-sizing: border-box;
        }
        .auth-fields input:focus {
          border-color: rgba(124, 58, 237, 0.6);
          background: rgba(124, 58, 237, 0.08);
        }
        .auth-fields input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }
        .auth-error {
          font-size: 0.82rem;
          color: #f87171;
          font-weight: 500;
          margin: 0;
          padding: 10px 14px;
          background: rgba(239, 68, 68, 0.1);
          border-radius: 10px;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        .auth-success {
          font-size: 0.85rem;
          color: #34d399;
          font-weight: 500;
          padding: 14px;
          background: rgba(52, 211, 153, 0.1);
          border-radius: 12px;
          border: 1px solid rgba(52, 211, 153, 0.2);
          text-align: center;
        }
        .auth-submit-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #7c3aed, #c026d3);
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 8px 24px rgba(124, 58, 237, 0.35);
        }
        .auth-submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 12px 32px rgba(124, 58, 237, 0.5);
        }
        .auth-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .auth-switch {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.4);
          text-align: center;
          margin: 0;
        }
        .auth-switch-link {
          background: none;
          border: none;
          color: #a78bfa;
          font-weight: 600;
          cursor: pointer;
          text-decoration: underline;
          font-size: inherit;
        }
        .auth-switch-link:hover { color: #c4b5fd; }
      `}</style>
    </>
  );
}
