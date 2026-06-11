import Link from 'next/link';
import { useRouter } from 'next/router';

export default function ShopTheVibe({ song }) {
  const router = useRouter();
  const { locale } = router || { locale: 'fr' };

  if (!song || !song.tags) return null;

  // Determine the vibe based on tags
  const isDramatic = song.tags.some(t => ['Dramatique', 'Nostalgie', 'Triste', 'Sentimental', 'Romantique'].includes(t));
  const isSensual = song.tags.some(t => ['Sensual', 'Passion', 'Urbain', 'Urbaine', 'Moderne'].includes(t));

  let recommendedProduct = null;

  if (isDramatic) {
    recommendedProduct = {
      title: locale === 'en' ? "Lyrics Don't Make Sense (White)" : "Lyrics Don't Make Sense (Blanc)",
      desc: locale === 'en' 
        ? `You're about to dance sensually to a tragic song. This t-shirt was made for you.`
        : `Tu vas faire des vagues sur une chanson tragique ? Ce T-shirt est fait pour toi.`,
      img: '/mockups/tshirt_lyrics_white.png',
      link: '/boutique',
      color: '#f8fafc'
    };
  } else if (isSensual) {
    recommendedProduct = {
      title: locale === 'en' ? "Lyrics Don't Make Sense (Black)" : "Lyrics Don't Make Sense (Noir)",
      desc: locale === 'en'
        ? `Match the sensual vibe of this song with our premium dark streetwear.`
        : `Accorde-toi avec l'humeur de cette chanson grâce à ce t-shirt streetwear sombre.`,
      img: '/mockups/tshirt_lyrics_black.png',
      link: '/boutique',
      color: '#1e293b'
    };
  } else {
    // Default fallback
    recommendedProduct = {
      title: locale === 'en' ? "Official Bachata Lyrics Tee" : "T-Shirt Officiel Bachata Lyrics",
      desc: locale === 'en'
        ? `Show your love for the culture with our official apparel.`
        : `Montre ton amour pour la culture bachata avec notre t-shirt officiel.`,
      img: '/mockups/tshirt_logo_purple.png',
      link: '/boutique',
      color: '#581c87'
    };
  }

  return (
    <div className="vibe-container">
      <div className="vibe-inner">
        <div className="vibe-text">
          <span className="vibe-badge">🛍️ {locale === 'en' ? 'Shop the Vibe' : 'Shop the Vibe'}</span>
          <h3>{recommendedProduct.title}</h3>
          <p>{recommendedProduct.desc}</p>
          <Link href={recommendedProduct.link} className="vibe-cta">
            {locale === 'en' ? 'Discover in Shop' : 'Découvrir en boutique'} →
          </Link>
        </div>
        <div className="vibe-image">
          <img src={recommendedProduct.img} alt={recommendedProduct.title} />
        </div>
      </div>

      <style jsx>{`
        .vibe-container {
          max-width: 1280px;
          margin: 40px auto 20px;
          padding: 0 24px;
        }
        .vibe-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 24px 40px;
          overflow: hidden;
          position: relative;
        }
        .vibe-text {
          flex: 1;
          max-width: 500px;
          z-index: 2;
        }
        .vibe-badge {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #c026d3;
          margin-bottom: 12px;
          background: rgba(192, 38, 211, 0.15);
          padding: 4px 12px;
          border-radius: 999px;
        }
        .vibe-inner h3 {
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem;
          color: white;
          margin-bottom: 8px;
        }
        .vibe-inner p {
          color: var(--text-secondary);
          font-size: 0.95rem;
          margin-bottom: 20px;
          line-height: 1.5;
        }
        .vibe-cta {
          display: inline-flex;
          align-items: center;
          font-weight: 700;
          color: white;
          background: rgba(255,255,255,0.1);
          padding: 10px 20px;
          border-radius: 12px;
          transition: all 0.2s;
          border: 1px solid rgba(255,255,255,0.2);
        }
        .vibe-cta:hover {
          background: white;
          color: black;
          transform: translateY(-2px);
        }
        .vibe-image {
          position: absolute;
          right: -20px;
          bottom: -40px;
          width: 250px;
          height: 250px;
          z-index: 1;
          opacity: 0.9;
          transform: rotate(5deg);
          transition: transform 0.3s ease;
        }
        .vibe-inner:hover .vibe-image {
          transform: rotate(0deg) scale(1.05);
        }
        .vibe-image img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          filter: drop-shadow(0 10px 20px rgba(0,0,0,0.5));
        }

        @media (max-width: 768px) {
          .vibe-inner {
            flex-direction: column;
            padding: 24px;
            text-align: center;
          }
          .vibe-image {
            position: relative;
            right: auto;
            bottom: auto;
            width: 200px;
            height: 200px;
            margin-top: 20px;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
