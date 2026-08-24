// Boutique page — Bachata Lyrics merch
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import SeoFooter from '../components/SeoFooter';
import { track } from '@vercel/analytics';

const PRODUCTS = [
  {
    id: 'tshirt-lyrics-white',
    name: {
      fr: "T-Shirt Blanc « Lyrics don't make sense »",
      en: "White T-Shirt « Lyrics don't make sense »",
    },
    description: {
      fr: "T-shirt oversize premium en coton épais blanc. Texte « LDMS » à l'avant, « Lyrics don't make sense » dans le dos. Coupe décontractée streetwear.",
      en: "Premium heavyweight oversized white cotton tee. 'LDMS' on the front, 'Lyrics don't make sense' on the back. Relaxed streetwear fit.",
    },
    seoStory: {
      fr: `Conçu pour les danseurs qui font des vagues romantiques sur des paroles de dépression. La prochaine fois que tu danses sur <a href="/song/obsesion-aventura" class="seo-link">Obsesión d'Aventura</a> ou <a href="/song/el-perdedor-aventura" class="seo-link">El Perdedor</a>, regarde bien les paroles !`,
      en: `Designed for dancers doing body rolls to deeply tragic lyrics. Next time you dance to <a href="/en/song/obsesion-aventura" class="seo-link">Aventura's Obsesión</a>, check the meaning of the words!`
    },
    price: 40,
    currency: '€',
    images: ['/mockups/tshirt_lyrics_white.png'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    color: 'Blanc',
    badge: { fr: 'Nouveau', en: 'New Arrival' },
    features: {
      fr: ['100% coton bio épais', 'Coupe oversize unisexe', 'Impression haute qualité', 'Livraison offerte en France'],
      en: ['100% organic heavyweight cotton', 'Unisex oversized fit', 'High-quality print', 'Free shipping in France'],
    },
  },
  {
    id: 'tshirt-lyrics-black',
    name: {
      fr: "T-Shirt Noir « Lyrics don't make sense »",
      en: "Black T-Shirt « Lyrics don't make sense »",
    },
    description: {
      fr: "T-shirt oversize premium en coton épais noir. Texte « LDMS » à l'avant, « Lyrics don't make sense » dans le dos. Coupe décontractée streetwear.",
      en: "Premium heavyweight oversized black cotton tee. 'LDMS' on the front, 'Lyrics don't make sense' on the back. Relaxed streetwear fit.",
    },
    seoStory: {
      fr: `Parce que la bachata sensuelle demande un style sombre et élégant. Parfait pour se fondre dans l'ambiance des soirées sur des sons de <a href="/song/propuesta-indecente-romeo-santos" class="seo-link">Romeo Santos</a>.`,
      en: `Because sensual bachata calls for dark, elegant streetwear. Perfect for blending into the party vibe while listening to <a href="/en/song/propuesta-indecente-romeo-santos" class="seo-link">Romeo Santos</a>.`
    },
    price: 40,
    currency: '€',
    images: ['/mockups/tshirt_lyrics_black.png'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    color: 'Noir',
    badge: { fr: 'Nouveau', en: 'New Arrival' },
    features: {
      fr: ['100% coton bio épais', 'Coupe oversize unisexe', 'Impression haute qualité', 'Livraison offerte en France'],
      en: ['100% organic heavyweight cotton', 'Unisex oversized fit', 'High-quality print', 'Free shipping in France'],
    },
  },
  {
    id: 'tshirt-logo-purple',
    name: {
      fr: "T-Shirt Blanc Logo Violet",
      en: "White T-Shirt Purple Logo",
    },
    description: {
      fr: "T-shirt oversize premium en coton épais. Texte à l'avant, grand logo violet Bachata Lyrics imprimé dans le dos.",
      en: "Premium heavyweight oversized cotton tee. Text on the front, large purple Bachata Lyrics logo printed on the back.",
    },
    seoStory: {
      fr: `Affiche ton amour pour la culture dominicaine et les paroles de bachata. Un must-have que tu danses sur de la <a href="/song/furioso-violento-esme" class="seo-link">Moderne</a> ou de la Traditionnelle.`,
      en: `Show your love for Dominican culture and bachata lyrics. A must-have whether you dance to <a href="/en/song/furioso-violento-esme" class="seo-link">Modern</a> or Traditional styles.`
    },
    price: 45,
    currency: '€',
    images: ['/mockups/tshirt_logo_purple.png'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    color: 'Blanc cassé',
    badge: { fr: 'Édition Spéciale', en: 'Special Edition' },
    features: {
      fr: ['100% coton bio épais', 'Coupe oversize unisexe', 'Impression haute qualité au dos', 'Livraison offerte en France'],
      en: ['100% organic heavyweight cotton', 'Unisex oversized fit', 'High-quality back print', 'Free shipping in France'],
    },
  },
];

function ProductCard({ product, locale, t }) {
  const [selectedSize, setSelectedSize] = useState(null);
  const [orderStatus, setOrderStatus] = useState('idle'); // idle | form | sending | success | error

  const handleOrder = () => {
    if (!selectedSize) return;
    track('click_preorder', { product_id: product.id, size: selectedSize });
    setOrderStatus('form');
  };

  return (
    <div className="boutique-product-card" style={{ marginBottom: '4rem' }}>
      {/* Image Side */}
      <div className="boutique-product-image-area">
        <div className="boutique-limited-badge">{t(product.badge)}</div>
        <Image
          src={product.images[0]}
          alt={t(product.name)}
          width={800}
          height={800}
          className="boutique-product-img"
        />
      </div>

      {/* Details Side */}
      <div className="boutique-product-details">
        <div className="boutique-product-header">
          <h2 className="boutique-product-name">{t(product.name)}</h2>
          <div className="boutique-product-price">
            <span className="price-amount">{product.price}{product.currency}</span>
            <span className="price-label">{locale === 'en' ? 'tax included' : 'TTC'}</span>
          </div>
        </div>

        <p className="boutique-product-desc">{t(product.description)}</p>
        
        {/* SEO Story */}
        {product.seoStory && (
          <div 
            className="boutique-seo-story"
            dangerouslySetInnerHTML={{ __html: t(product.seoStory) }}
          />
        )}

        {/* Features */}
        <ul className="boutique-features">
          {t(product.features).map((feat, i) => (
            <li key={i}>
              <span className="feature-check">✓</span> {feat}
            </li>
          ))}
        </ul>

        {/* Size Selector */}
        <div className="boutique-size-section">
          <label className="boutique-size-label">
            {locale === 'en' ? 'Select your size' : 'Choisis ta taille'}
          </label>
          <div className="boutique-sizes">
            {product.sizes.map((size) => (
              <button
                key={size}
                className={`boutique-size-btn ${selectedSize === size ? 'active' : ''}`}
                onClick={() => {
                  setSelectedSize(size);
                  track('select_size', { product_id: product.id, size });
                }}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        {orderStatus === 'idle' && (
          <button
            className={`boutique-cta ${!selectedSize ? 'disabled' : ''}`}
            onClick={handleOrder}
            disabled={!selectedSize}
          >
            {!selectedSize
              ? (locale === 'en' ? '👆 Pick a size first' : '👆 Choisis ta taille d\'abord')
              : (locale === 'en' ? `🛒 Pre-order — ${product.price}${product.currency}` : `🛒 Précommander — ${product.price}${product.currency}`)}
          </button>
        )}

        {/* Order Form */}
        {orderStatus === 'form' && (
          <OrderForm
            locale={locale}
            product={product}
            selectedSize={selectedSize}
            onStatusChange={setOrderStatus}
          />
        )}

        {orderStatus === 'success' && (
          <div className="boutique-success">
            <div className="success-icon">🎉</div>
            <h3>{locale === 'en' ? 'Pre-order confirmed!' : 'Précommande confirmée !'}</h3>
            <p>{locale === 'en' ? 'We\'ll email you when your tee is ready. Thank you!' : 'On te contacte par mail quand ton t-shirt est prêt. Merci !'}</p>
          </div>
        )}

        {orderStatus === 'error' && (
          <div className="boutique-error">
            <p>{locale === 'en' ? 'Something went wrong. Please try again.' : 'Une erreur est survenue. Réessaye.'}</p>
            <button className="boutique-cta" onClick={() => setOrderStatus('form')}>
              {locale === 'en' ? 'Try again' : 'Réessayer'}
            </button>
          </div>
        )}

        {/* Trust Signals */}
        <div className="boutique-trust">
          <span>🚚 {locale === 'en' ? 'Free shipping (FR)' : 'Livraison offerte (FR)'}</span>
          <span>🔒 {locale === 'en' ? 'Secure payment' : 'Paiement sécurisé'}</span>
          <span>📦 {locale === 'en' ? 'Ships in 5-7 days' : 'Expédié sous 5-7 jours'}</span>
        </div>
      </div>
    </div>
  );
}

export default function Boutique() {
  const router = useRouter();
  const { locale } = router || { locale: 'fr' };

  const t = (obj) => obj[locale] || obj['fr'];

  return (
    <>
      <Head>
        <title>{locale === 'en' ? "Shop — Bachata Lyrics | Exclusive Merch" : "Boutique — Bachata Lyrics | Merch Exclusif"}</title>
        <meta
          name="description"
          content={locale === 'en'
            ? "Shop exclusive Bachata Lyrics merchandise. Premium t-shirts designed for bachata dancers."
            : "Boutique officielle Bachata Lyrics. T-shirts premium conçus pour les danseurs de bachata."}
        />
        <meta property="og:title" content="Boutique — Bachata Lyrics" />
        <meta property="og:description" content="Découvrez notre collection exclusive de vêtements pour danseurs de bachata." />
        <meta property="og:url" content="https://bachatalyrics.com/boutique" />
      </Head>

      <Navbar activePage="boutique" onLoginClick={() => router.push('/')} />

      <div className="boutique-page">
        {/* Hero */}
        <section className="boutique-hero">
          <div className="boutique-hero-glow" />
          <div className="boutique-hero-content">
            <span className="boutique-badge">{locale === 'en' ? '🛍️ Official Store' : '🛍️ Boutique Officielle'}</span>
            <h1 className="boutique-title">
              {locale === 'en' ? (
                <>Dance in <span className="accent-gradient">style</span></>
              ) : (
                <>Danse avec du <span className="accent-gradient">style</span></>
              )}
            </h1>
            <p className="boutique-subtitle">
              {locale === 'en'
                ? "Exclusive merch for the Bachata Lyrics community. Designed by dancers, for dancers."
                : "Du merch exclusif pour la communauté Bachata Lyrics. Conçu par des danseurs, pour des danseurs."}
            </p>
          </div>
        </section>

        {/* Product Showcase */}
        <section className="boutique-product-section">
          {PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} locale={locale} t={t} />
          ))}
        </section>
      </div>

      <SeoFooter currentPage="boutique" />

      <style jsx>{`
        .boutique-seo-story {
          font-size: 0.9rem;
          color: var(--text-secondary, #9ca3af);
          font-style: italic;
          margin-top: -12px;
          margin-bottom: 24px;
          line-height: 1.6;
          background: rgba(167, 139, 250, 0.05);
          padding: 12px 16px;
          border-left: 3px solid #a855f7;
          border-radius: 4px;
        }
        .boutique-seo-story :global(.seo-link) {
          color: #c026d3;
          text-decoration: underline;
          text-decoration-color: rgba(192, 38, 211, 0.4);
          font-weight: 600;
          transition: all 0.2s;
        }
        .boutique-seo-story :global(.seo-link:hover) {
          color: #e879f9;
          text-decoration-color: #e879f9;
        }
      `}</style>
    </>
  );
}

function OrderForm({ locale, product, selectedSize, onStatusChange }) {
  const [form, setForm] = useState({ name: '', email: '', address: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          message: `🛒 PRÉCOMMANDE BOUTIQUE\n\nProduit: ${product.name.fr}\nTaille: ${selectedSize}\nAdresse: ${form.address}\nEmail: ${form.email}`,
        }),
      });

      if (res.ok) {
        track('submit_preorder_success', { product_id: product.id, size: selectedSize });
        onStatusChange('success');
      } else {
        track('submit_preorder_error', { product_id: product.id, size: selectedSize, type: 'api_error' });
        onStatusChange('error');
      }
    } catch {
      track('submit_preorder_error', { product_id: product.id, size: selectedSize, type: 'network_error' });
      onStatusChange('error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="boutique-order-form">
      <div className="boutique-form-group">
        <label>{locale === 'en' ? 'Full name' : 'Nom complet'}</label>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder={locale === 'en' ? 'Your name...' : 'Ton nom...'}
        />
      </div>
      <div className="boutique-form-group">
        <label>Email</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="ton@email.com"
        />
      </div>
      <div className="boutique-form-group">
        <label>{locale === 'en' ? 'Shipping address' : 'Adresse de livraison'}</label>
        <textarea
          required
          rows={2}
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          placeholder={locale === 'en' ? 'Full address...' : 'Adresse complète...'}
        />
      </div>
      <div className="boutique-form-actions">
        <button type="button" className="boutique-form-cancel" onClick={() => onStatusChange('idle')}>
          {locale === 'en' ? 'Cancel' : 'Annuler'}
        </button>
        <button type="submit" className="boutique-cta" disabled={sending}>
          {sending
            ? (locale === 'en' ? '⏳ Sending...' : '⏳ Envoi...')
            : (locale === 'en' ? `Confirm — ${product.price}${product.currency}` : `Confirmer — ${product.price}${product.currency}`)}
        </button>
      </div>
    </form>
  );
}
