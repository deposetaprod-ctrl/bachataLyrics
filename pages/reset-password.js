import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Script from 'next/script';
import Navbar from '../components/Navbar';

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [supabaseClient, setSupabaseClient] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.supabase) {
      const client = window.supabase.createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'
      );
      setSupabaseClient(client);
    }
  }, []);

  const handleResetPassword = async () => {
    if (!supabaseClient) return setError('Service indisponible.');
    if (password.length < 6) return setError('Le mot de passe doit faire au moins 6 caractères.');
    if (password !== confirmPassword) return setError('Les mots de passe ne correspondent pas.');

    setIsLoading(true);
    setError('');
    
    // Once the user arrives from the reset link, they are authenticated via the hash in the URL.
    // So we just update the user's password.
    const { error: updateError } = await supabaseClient.auth.updateUser({
      password: password
    });

    setIsLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="reset-password-page">
      <Head>
        <title>Réinitialiser le mot de passe — Bachata Flow</title>
      </Head>
      <Script 
        src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2" 
        strategy="beforeInteractive"
      />
      <Navbar />

      <main className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="glass" style={{ maxWidth: '400px', width: '100%', padding: '32px', borderRadius: '24px' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Nouveau mot de passe</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Entre ton nouveau mot de passe ci-dessous.
          </p>

          {success ? (
            <div style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.2)', color: '#34d399', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
              <p>✅ Ton mot de passe a été réinitialisé avec succès.</p>
              <button 
                onClick={() => router.push('/musicality')}
                style={{ background: 'linear-gradient(135deg, #7c3aed, #c026d3)', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '10px', marginTop: '16px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Retour à l'accueil
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="password"
                placeholder="Nouveau mot de passe"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', outline: 'none' }}
              />
              <input
                type="password"
                placeholder="Confirmer le mot de passe"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', outline: 'none' }}
              />
              {error && <p style={{ color: '#f87171', fontSize: '0.85rem' }}>{error}</p>}
              <button
                onClick={handleResetPassword}
                disabled={isLoading}
                style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #7c3aed, #c026d3)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px' }}
              >
                {isLoading ? 'Enregistrement...' : 'Enregistrer le mot de passe'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
