import Link from 'next/link';
import { songs } from '../data/songs';

/**
 * SEO Footer — Fournit des liens internes structurés pour améliorer le maillage
 * interne et aider Google à découvrir toutes les pages du site.
 */
export default function SeoFooter({ currentPage = '' }) {
  // Prendre les 8 chansons les plus récentes (par année desc, puis par ordre dans le tableau)
  const recentSongs = [...songs]
    .sort((a, b) => b.year - a.year)
    .slice(0, 8);

  return (
    <footer className="seo-footer">
      <div className="seo-footer-inner">
        {/* Navigation principale */}
        <nav className="seo-footer-nav" aria-label="Navigation du site">
          <div className="seo-footer-col">
            <h3>Bachata Flow</h3>
            <p className="seo-footer-desc">
              Paroles de bachata traduites en français et musicality trainer.
              L'application des passionnés de bachata.
            </p>
            <div style={{ marginTop: '20px' }}>
              <a 
                href="https://instagram.com/bachata_gang" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'white',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                  padding: '8px 16px',
                  borderRadius: '999px',
                  boxShadow: '0 4px 15px rgba(220, 39, 67, 0.3)',
                  transition: 'transform 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                📸 Rejoins-nous sur Instagram
              </a>
            </div>
          </div>

          <div className="seo-footer-col">
            <h4>Explorer</h4>
            <ul>
              {currentPage !== 'home' && (
                <li><Link href="/">🎵 Paroles de Bachata</Link></li>
              )}

              {currentPage !== 'musicality' && (
                <li><Link href="/musicality">🥁 Musicality Trainer</Link></li>
              )}
              {currentPage !== 'jnj' && (
                <li><Link href="/jack-and-jill">⚡ Jack & Jill Training</Link></li>
              )}
              {currentPage !== 'contact' && (
                <li><Link href="/contact">💌 Contact</Link></li>
              )}
            </ul>
          </div>

          <div className="seo-footer-col">
            <h4>Chansons récentes</h4>
            <ul>
              {recentSongs.map(song => (
                <li key={song.id}>
                  <Link href={`/song/${song.id}`}>
                    {song.title} — {song.artist}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Copyright */}
        <div className="seo-footer-bottom">
          <p>
            Fait avec <span style={{ color: '#c026d3' }}>♥</span> pour les amoureux de bachata · © {new Date().getFullYear()} Bachata Flow
          </p>
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
            <a 
              href="https://maximilien.digital" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.75rem', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.color = '#c026d3'}
              onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)'}
            >
              Développé par l'agence Maximilien Digital
            </a>
            <a 
              href="https://comeup.com/fr/service/382688/vous-developper-une-application-mobile-saas-avec-ou-sans-intelligence-artificielle" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.75rem', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.color = '#c026d3'}
              onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)'}
            >
              Maximilien - SAAS / Application Mobile
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        .seo-footer {
          margin-top: 80px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(0, 0, 0, 0.3);
        }
        .seo-footer-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 48px 24px 24px;
        }
        .seo-footer-nav {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr;
          gap: 40px;
        }
        @media (max-width: 768px) {
          .seo-footer-nav {
            grid-template-columns: 1fr;
            gap: 32px;
          }
        }
        .seo-footer-col h3 {
          font-size: 1.3rem;
          font-weight: 800;
          margin-bottom: 12px;
          background: linear-gradient(135deg, #c026d3, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .seo-footer-col h4 {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 12px;
        }
        .seo-footer-desc {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.85rem;
          line-height: 1.6;
        }
        .seo-footer-col ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .seo-footer-col ul li :global(a) {
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          font-size: 0.85rem;
          transition: color 0.2s;
        }
        .seo-footer-col ul li :global(a:hover) {
          color: #c026d3;
        }
        .seo-footer-bottom {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          text-align: center;
        }
        .seo-footer-bottom p {
          color: rgba(255, 255, 255, 0.3);
          font-size: 0.8rem;
        }
      `}</style>
    </footer>
  );
}
