import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Contact() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | loading | success | error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setStatus('success');
        setForm({ name: '', email: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <>
      <Head>
        <title>Contact — Bachata Lyrics</title>
        <meta name="description" content="Envoie-nous un message !" />
      </Head>

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="logo" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
            <div className="logo-icon">🎶</div>
            <span className="logo-text">Bachata Lyrics</span>
          </div>
          <div className="nav-links" style={{ display: 'flex', gap: '24px', fontWeight: 600, flex: 1, paddingLeft: '40px' }}>
            <span style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => router.push('/')}>Sons</span>
            <span style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => router.push('/passes')}>Passes</span>
            <span style={{ cursor: 'pointer', color: 'var(--accent)' }}>Contact</span>
          </div>
        </div>
      </nav>

      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
        <div style={{ width: '100%', maxWidth: '560px' }}>
          {/* Header */}
          <div style={{ marginBottom: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>💌</div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Nous contacter</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
              Une idée, une chanson à ajouter, un bug ? Écris-nous !
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Ton prénom
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Maximilien..."
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Ton email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="ton@email.com"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Ton message
              </label>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="J'aimerais que tu ajoutes la chanson..."
                style={{ ...inputStyle, resize: 'vertical', minHeight: '120px' }}
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              style={{
                marginTop: '8px',
                padding: '14px 24px',
                borderRadius: '999px',
                background: 'linear-gradient(135deg, #c026d3, #7c3aed)',
                color: 'white',
                fontWeight: 700,
                fontSize: '1rem',
                border: 'none',
                cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                opacity: status === 'loading' ? 0.7 : 1,
                transition: 'all 0.2s',
              }}
            >
              {status === 'loading' ? '⏳ Envoi...' : '✉️ Envoyer le message'}
            </button>

            {/* Feedback */}
            {status === 'success' && (
              <div style={{ textAlign: 'center', color: '#34d399', fontWeight: 600, padding: '16px', background: 'rgba(52,211,153,0.1)', borderRadius: '12px', border: '1px solid rgba(52,211,153,0.3)' }}>
                ✅ Message envoyé ! On te répond vite.
              </div>
            )}
            {status === 'error' && (
              <div style={{ textAlign: 'center', color: '#f87171', fontWeight: 600, padding: '16px', background: 'rgba(248,113,113,0.1)', borderRadius: '12px', border: '1px solid rgba(248,113,113,0.3)' }}>
                ❌ Une erreur s&apos;est produite. Réessaie dans un instant.
              </div>
            )}
          </form>
        </div>
      </div>

      <footer className="footer">
        <p>Fait avec <span>♥</span> pour les amoureux de bachata · {new Date().getFullYear()}</p>
      </footer>
    </>
  );
}

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  color: 'var(--text-primary)',
  fontSize: '0.95rem',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};
