import { useState, useEffect } from 'react';

export default function PasswordGate({ children }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (localStorage.getItem('app_unlocked') === 'true') {
      setIsUnlocked(true);
    }
  }, []);

  if (!isMounted) return null;

  if (isUnlocked) {
    return <>{children}</>;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === 'love') {
      localStorage.setItem('app_unlocked', 'true');
      setIsUnlocked(true);
    } else {
      setError('Mot de passe incorrect');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-primary, #0a0a0f)', color: 'var(--text-primary, #f0f0f8)', padding: '2rem' }}>
      <h1 style={{ marginBottom: '1rem', textAlign: 'center', fontFamily: "'Playfair Display', serif", fontSize: '2.5rem' }}>Accès Réservé</h1>
      <p style={{ marginBottom: '2.5rem', textAlign: 'center', maxWidth: '400px', lineHeight: '1.5', color: 'var(--text-secondary, #8888aa)' }}>
        Pour obtenir le mot de passe et accéder à l'application, envoie-moi un message sur Instagram :<br/><br/>
        <a href="https://www.instagram.com/max_dance_love" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '10px', color: 'var(--accent, #a855f7)', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.2rem', padding: '12px 24px', background: 'var(--accent-dim, rgba(168, 85, 247, 0.15))', borderRadius: '8px', border: '1px solid rgba(168, 85, 247, 0.25)' }}>
          @max_dance_love
        </a>
      </p>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '300px' }}>
        <input 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          style={{ width: '100%', padding: '1rem', marginBottom: '1rem', borderRadius: '12px', border: '1px solid var(--border, rgba(255, 255, 255, 0.07))', backgroundColor: 'var(--bg-card, #16161f)', color: 'var(--text-primary, #fff)', outline: 'none', fontSize: '1rem' }}
        />
        {error && <p style={{ color: 'var(--red, #ef4444)', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>}
        <button type="submit" style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: 'none', backgroundColor: 'var(--accent, #a855f7)', color: '#fff', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', fontSize: '1rem' }}>
          Déverrouiller
        </button>
      </form>
    </div>
  );
}
