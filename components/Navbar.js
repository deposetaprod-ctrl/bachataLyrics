import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Navbar({ user, supabaseClient, onLoginClick, onSuggestClick, activePage = 'home', children }) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="logo" onClick={() => router.push('/')} style={{ cursor: 'pointer', zIndex: 101 }}>
            <img src="/LOGO_PWA.PNG" alt="Logo" className="logo-img" />
            <span className="logo-text">Bachata Flow</span>
          </div>

          {/* Desktop Links */}
          <div className="nav-links desktop-only">
            <span 
              onClick={() => router.push('/')} 
              style={{ color: activePage === 'home' ? 'var(--accent)' : 'inherit', cursor: 'pointer' }}
            >Sons</span>

            <span 
              onClick={() => router.push('/musicality')} 
              style={{ color: activePage === 'musicality' ? 'var(--accent)' : 'inherit', cursor: 'pointer' }}
            >Musicalité</span>
            <span 
              onClick={() => router.push('/jack-and-jill')} 
              style={{ color: activePage === 'jnj' ? 'var(--accent)' : 'inherit', cursor: 'pointer' }}
            >Jack & Jill</span>
            
            <div className="auth-profile">
              {user ? (
                <div className="user-logged animate-fade-in">
                  <span className="user-name">👤 {user.email?.split('@')[0]}</span>
                  <button className="btn-logout" onClick={() => supabaseClient?.auth?.signOut()}>
                    Déconnexion
                  </button>
                </div>
              ) : (
                <button className="btn-login" onClick={onLoginClick}>
                  Connexion / S'inscrire
                </button>
              )}
            </div>
          </div>

          {/* Optional children (e.g. search bar) rendered in the middle */}
          {children && (
            <div className="navbar-custom-content">
              {children}
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <button 
            className="mobile-menu-btn mobile-only" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {mobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </>
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay animate-fade-in mobile-only">
          <div className="mobile-menu-links">
            <button onClick={() => { setMobileMenuOpen(false); router.push('/'); }} className={activePage === 'home' ? 'active' : ''}>🎶 Sons</button>

            <button onClick={() => { setMobileMenuOpen(false); router.push('/musicality'); }} className={activePage === 'musicality' ? 'active' : ''}>🥁 Musicalité</button>
            <button onClick={() => { setMobileMenuOpen(false); router.push('/jack-and-jill'); }} className={activePage === 'jnj' ? 'active' : ''}>🏆 Jack & Jill</button>
            
            {onSuggestClick && (
              <button 
                onClick={() => { setMobileMenuOpen(false); onSuggestClick(); }}
                style={{ 
                  background: 'linear-gradient(135deg, #c026d3, #7c3aed)',
                  color: 'white',
                  marginTop: '8px'
                }}
              >
                ✨ Proposer un son
              </button>
            )}

            <div className="mobile-auth-section">
              {user ? (
                <>
                  <div className="mobile-user-name">👤 {user.email?.split('@')[0]}</div>
                  <button className="btn-logout" style={{ width: '100%' }} onClick={() => supabaseClient?.auth?.signOut()}>
                    Déconnexion
                  </button>
                </>
              ) : (
                <button className="btn-login" style={{ width: '100%', padding: '12px', fontSize: '1rem' }} onClick={() => { setMobileMenuOpen(false); onLoginClick(); }}>
                  Connexion / S'inscrire
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .desktop-only {
          display: flex;
        }
        .mobile-only {
          display: none;
        }
        
        .navbar-custom-content {
          flex: 1;
          display: flex;
          justify-content: flex-end;
          align-items: center;
        }

        .mobile-menu-btn {
          color: white;
          background: transparent;
          border: none;
          cursor: pointer;
          display: none;
          z-index: 101;
        }

        /* Hover animation on logo & menu links */
        .mobile-menu-links button:hover {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }

        @media (max-width: 900px) {
          .desktop-only {
            display: none !important;
          }
          .mobile-only {
            display: block;
          }
          .navbar-inner {
            gap: 12px;
          }
          .navbar-custom-content {
            margin-right: 12px;
            justify-content: flex-end;
            width: 100%;
          }
          .mobile-menu-overlay {
            position: fixed;
            top: 64px; /* below navbar */
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(10, 10, 15, 0.98);
            backdrop-filter: blur(20px);
            z-index: 99;
            display: flex;
            flex-direction: column;
            padding: 24px;
            overflow-y: auto;
          }
          .mobile-menu-links {
            display: flex;
            flex-direction: column;
            gap: 16px;
            height: 100%;
          }
          .mobile-menu-links button {
            text-align: left;
            font-size: 1.2rem;
            font-weight: 700;
            color: var(--text-secondary);
            background: none;
            border: none;
            padding: 16px 20px;
            border-radius: 16px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .mobile-menu-links button.active {
            color: white;
            background: var(--accent-dim);
            border-left: 4px solid var(--accent);
          }
          .mobile-auth-section {
            margin-top: auto;
            padding-top: 32px;
            border-top: 1px solid var(--border);
          }
          .mobile-user-name {
            margin-bottom: 16px;
            color: var(--text-muted);
            font-weight: 600;
            text-align: center;
          }
        }
      `}</style>
    </>
  );
}
