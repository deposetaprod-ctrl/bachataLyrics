import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';

const SHIRTS = [
  {
    id: 'white',
    img: '/mockups/tshirt_lyrics_white.png',
    nameFr: "T-Shirt Blanc « Lyrics don't make sense »",
    nameEn: "White T-Shirt « Lyrics don't make sense »",
    price: 40
  },
  {
    id: 'black',
    img: '/mockups/tshirt_lyrics_black.png',
    nameFr: "T-Shirt Noir « Lyrics don't make sense »",
    nameEn: "Black T-Shirt « Lyrics don't make sense »",
    price: 40
  },
  {
    id: 'purple',
    img: '/mockups/tshirt_logo_purple.png',
    nameFr: "T-Shirt Blanc Logo Violet",
    nameEn: "White T-Shirt Purple Logo",
    price: 45
  }
];

export default function PromoPopup() {
  const [show, setShow] = useState(false);
  const [shirt, setShirt] = useState(null);
  const router = useRouter();
  const locale = router?.locale || 'fr';

  useEffect(() => {
    // Only trigger once per session
    if (sessionStorage.getItem('promo_seen')) return;
    
    // Pick a random shirt
    setShirt(SHIRTS[Math.floor(Math.random() * SHIRTS.length)]);

    const timer = setTimeout(() => {
      setShow(true);
      sessionStorage.setItem('promo_seen', 'true');
    }, 3 * 60 * 1000); // 3 minutes

    return () => clearTimeout(timer);
  }, []);

  const handleOrderClick = async (e) => {
    e.preventDefault();
    setShow(false);
    
    const itemName = locale === 'en' ? shirt.nameEn : shirt.nameFr;

    // Send email to admin
    fetch('/api/track-popup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item: itemName, price: shirt.price })
    }).catch(console.error);

    // Track event for admin dashboard
    const sessionId = sessionStorage.getItem('tracker_session_id');
    if (sessionId) {
      fetch('/api/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          type: 'popup_interaction',
          data: { action: 'went to the shop', item: itemName, price: shirt.price },
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: window.navigator.userAgent,
        })
      }).catch(console.error);
    }

    router.push('/boutique');
  };

  if (!show || !shirt) return null;

  return (
    <div className="promo-overlay" onClick={() => setShow(false)}>
      <div className="promo-modal" onClick={e => e.stopPropagation()}>
        <button className="promo-close" onClick={() => setShow(false)}>×</button>
        
        <div className="promo-image-container">
          <div className="promo-badge">{locale === 'en' ? 'New' : 'Nouveau'}</div>
          <Image src={shirt.img} alt={locale === 'en' ? shirt.nameEn : shirt.nameFr} width={400} height={400} className="promo-img" />
        </div>
        
        <div className="promo-content">
          <h3>{locale === 'en' ? shirt.nameEn : shirt.nameFr}</h3>
          <p className="promo-price">{shirt.price}€</p>
          <p className="promo-desc">
            {locale === 'en' 
              ? "Premium heavyweight oversized cotton tee. Relaxed streetwear fit." 
              : "T-shirt oversize premium en coton épais. Coupe décontractée streetwear."}
          </p>
          <div className="promo-actions">
            <button className="promo-btn-secondary" onClick={() => setShow(false)}>
              {locale === 'en' ? 'Maybe later' : 'Plus tard'}
            </button>
            <button className="promo-btn-primary" onClick={handleOrderClick}>
              {locale === 'en' ? 'Order now' : 'Commander'}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .promo-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 24px;
          animation: fadeIn 0.4s ease-out;
        }
        .promo-modal {
          background: var(--bg-card, #0a0a0f);
          border: 1px solid var(--border, rgba(255,255,255,0.1));
          border-radius: 24px;
          width: 100%;
          max-width: 400px;
          overflow: hidden;
          position: relative;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .promo-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: rgba(0, 0, 0, 0.5);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          cursor: pointer;
          z-index: 10;
          transition: background 0.2s;
        }
        .promo-close:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        .promo-image-container {
          position: relative;
          background: linear-gradient(145deg, #f5f0eb, #e8e0d8);
          height: 280px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .promo-badge {
          position: absolute;
          top: 16px;
          left: 16px;
          background: linear-gradient(135deg, #c026d3, #7c3aed);
          color: white;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
        }
        .promo-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transition: transform 0.3s;
        }
        .promo-content {
          padding: 24px;
          text-align: center;
        }
        .promo-content h3 {
          font-family: 'Playfair Display', serif;
          font-size: 1.3rem;
          font-weight: 700;
          margin-bottom: 8px;
          color: white;
        }
        .promo-price {
          font-size: 1.5rem;
          font-weight: 900;
          color: var(--accent, #a855f7);
          margin-bottom: 12px;
        }
        .promo-desc {
          font-size: 0.9rem;
          color: var(--text-secondary, #9ca3af);
          margin-bottom: 24px;
          line-height: 1.5;
        }
        .promo-actions {
          display: flex;
          gap: 12px;
        }
        .promo-btn-secondary {
          flex: 1;
          padding: 12px;
          background: transparent;
          border: 1px solid var(--border, rgba(255,255,255,0.1));
          color: var(--text-secondary, #9ca3af);
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .promo-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }
        .promo-btn-primary {
          flex: 1;
          padding: 12px;
          background: linear-gradient(135deg, #c026d3, #7c3aed);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.9rem;
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
        }
        .promo-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(124, 58, 237, 0.4);
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @media (max-width: 480px) {
          .promo-overlay {
            padding: 16px;
          }
          .promo-image-container {
            height: 220px;
            padding: 16px;
          }
          .promo-content {
            padding: 20px 16px;
          }
          .promo-content h3 {
            font-size: 1.15rem;
          }
          .promo-price {
            font-size: 1.3rem;
            margin-bottom: 8px;
          }
          .promo-desc {
            font-size: 0.85rem;
            margin-bottom: 16px;
          }
          .promo-btn-secondary, .promo-btn-primary {
            padding: 10px;
            font-size: 0.85rem;
          }
        }
        
        @media (max-height: 650px) {
          .promo-image-container {
            height: 160px;
          }
          .promo-content {
            padding: 16px;
          }
          .promo-desc {
            margin-bottom: 12px;
          }
        }
      `}</style>
    </div>
  );
}
