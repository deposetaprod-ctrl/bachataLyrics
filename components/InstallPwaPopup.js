import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function InstallPwaPopup() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [platform, setPlatform] = useState(null); // 'ios' | 'android' | 'other'
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const router = useRouter();
  const { locale } = router || { locale: 'fr' };

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    
    // Check if dismissed previously
    const isDismissed = localStorage.getItem('pwaPromptDismissed');

    if (isStandalone || isDismissed) {
      return;
    }

    // Track page views in session to avoid showing on first land
    let views = parseInt(sessionStorage.getItem('pageViews') || '0', 10);
    
    const handleRouteChange = () => {
      views += 1;
      sessionStorage.setItem('pageViews', views.toString());
      
      // If user has navigated to a second page, they are engaged -> trigger prompt
      if (views >= 2) {
        checkAndShowPrompt();
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    
    // Also check on initial mount (in case they refreshed on their 3rd page view)
    views += 1;
    sessionStorage.setItem('pageViews', views.toString());
    if (views >= 2) {
      checkAndShowPrompt();
    }

    function checkAndShowPrompt() {
      if (showPrompt) return; // already showing
      
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      const isAndroid = /android/.test(userAgent);

      if (isIOS) {
        setPlatform('ios');
        // Delay slightly so it doesn't clash instantly with the page transition
        setTimeout(() => setShowPrompt(true), 1500);
      } else if (isAndroid) {
        setPlatform('android');
        if (deferredPrompt) {
          setShowPrompt(true);
        } else {
          // Fallback manual instructions if event not caught
          setTimeout(() => setShowPrompt(true), 1500);
        }
      }
    }

    // Android specific event
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // If they already met the view requirement, show it now
      if (parseInt(sessionStorage.getItem('pageViews') || '0', 10) >= 2) {
        setPlatform('android');
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [deferredPrompt, router.events, showPrompt]);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwaPromptDismissed', 'true');
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else {
      // Manual instructions for Android if event is not available
      handleDismiss(); // Or keep it open so they read the manual instructions
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="pwa-popup-overlay">
      <div className="pwa-popup-card animate-slide-up">
        <button className="pwa-close-btn" onClick={handleDismiss} aria-label="Fermer">✕</button>
        <div className="pwa-icon">📱</div>
        <h3 className="pwa-title">
          {locale === 'en' ? 'Install the App' : 'Installer l\'Application'}
        </h3>
        
        {platform === 'ios' && (
          <div className="pwa-instructions">
            <p>
              {locale === 'en' 
                ? 'Install Bachata Lyrics on your iPhone for a better experience and offline access.' 
                : 'Installe Bachata Lyrics sur ton iPhone pour une meilleure expérience et un accès hors ligne.'}
            </p>
            <p className="pwa-safari-warning">
              {locale === 'en'
                ? '⚠️ Note: You must open this page in Safari for this to work.'
                : '⚠️ Note : il faut ouvrir ce site dans Safari pour que ça fonctionne.'}
            </p>
            <ol>
              <li>
                {locale === 'en' ? 'Tap the ' : 'Touche l\'icône '}
                <strong>{locale === 'en' ? 'Share' : 'Partager'}</strong> 
                <svg className="share-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                  <polyline points="16 6 12 2 8 6"></polyline>
                  <line x1="12" y1="2" x2="12" y2="15"></line>
                </svg>
                {locale === 'en' ? ' button.' : ' en bas de l\'écran.'}
              </li>
              <li>
                {locale === 'en' ? 'Scroll down and select ' : 'Fais défiler et sélectionne '}
                <strong>{locale === 'en' ? '"Add to Home Screen"' : '"Sur l\'écran d\'accueil"'} <span style={{fontSize: '1.2rem'}}>+</span></strong>
              </li>
            </ol>
          </div>
        )}

        {platform === 'android' && (
          <div className="pwa-instructions">
            <p>
              {locale === 'en' 
                ? 'Install Bachata Lyrics on your phone for a better experience.' 
                : 'Installe Bachata Lyrics sur ton téléphone pour une meilleure expérience et un accès hors ligne.'}
            </p>
            {deferredPrompt ? (
              <button className="pwa-install-btn hover-scale" onClick={handleInstallClick}>
                {locale === 'en' ? 'Install Now' : 'Installer Maintenant'}
              </button>
            ) : (
              <ol>
                <li>
                  {locale === 'en' ? 'Tap the menu icon ' : 'Touche le menu '}
                  <strong>(⋮)</strong>
                </li>
                <li>
                  {locale === 'en' ? 'Select ' : 'Sélectionne '}
                  <strong>{locale === 'en' ? '"Install app"' : '"Installer l\'application"'}</strong>
                  {locale === 'en' ? ' or ' : ' ou '}
                  <strong>{locale === 'en' ? '"Add to Home screen"' : '"Ajouter à l\'écran d\'accueil"'}</strong>
                </li>
              </ol>
            )}
          </div>
        )}

      </div>

      <style jsx>{`
        .pwa-popup-overlay {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          max-width: 400px;
          z-index: 9999;
        }
        .pwa-popup-card {
          background: rgba(30, 27, 75, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(167, 139, 250, 0.3);
          border-radius: 20px;
          padding: 24px;
          color: white;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(167, 139, 250, 0.1);
          position: relative;
        }
        .animate-slide-up {
          animation: slideUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .pwa-close-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 14px;
        }
        .pwa-icon {
          font-size: 32px;
          text-align: center;
          margin-bottom: 8px;
        }
        .pwa-title {
          text-align: center;
          margin: 0 0 12px 0;
          font-size: 18px;
          font-weight: 700;
          color: #e2e8f0;
        }
        .pwa-instructions p {
          font-size: 14px;
          color: #94a3b8;
          text-align: center;
          margin-bottom: 16px;
          line-height: 1.5;
        }
        .pwa-safari-warning {
          font-size: 13px !important;
          color: #fbbf24 !important;
          font-weight: 600;
          margin-top: -8px;
        }
        .pwa-instructions ol {
          padding-left: 20px;
          margin: 0;
          font-size: 14px;
          color: #cbd5e1;
          line-height: 1.6;
        }
        .pwa-instructions li {
          margin-bottom: 8px;
        }
        .share-icon {
          display: inline-block;
          vertical-align: middle;
          margin: 0 2px;
        }
        strong {
          color: white;
        }
        .pwa-install-btn {
          width: 100%;
          padding: 12px;
          border-radius: 12px;
          background: linear-gradient(135deg, #c026d3, #7c3aed);
          color: white;
          border: none;
          font-weight: bold;
          cursor: pointer;
          font-size: 16px;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
        }
      `}</style>
    </div>
  );
}
