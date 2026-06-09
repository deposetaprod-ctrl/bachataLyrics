// Boutique page — Bachata Lyrics merch
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import SeoFooter from '../components/SeoFooter';

const PRODUCTS = [
  {
    id: 'tshirt-lyrics',
    name: {
      fr: "T-Shirt « Lyrics don't make sense »",
      en: "T-Shirt « Lyrics don't make sense »",
    },
    description: {
      fr: "T-shirt oversize premium en coton épais. Texte « Lyrics don't make sense » brodé à l'avant, logo Bachata Lyrics imprimé dans le dos. Coupe décontractée streetwear.",
      en: "Premium heavyweight oversized cotton tee. 'Lyrics don't make sense' embroidered on the front, Bachata Lyrics logo printed on the back. Relaxed streetwear fit.",
    },
    price: 45,
    currency: '€',
    images: ['/tshirt_lyrics_real.jpg'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    color: 'Blanc cassé',
    badge: { fr: 'Édition Limitée', en: 'Limited Edition' },
    features: {
      fr: ['100% coton bio épais (240g/m²)', 'Coupe oversize unisexe', 'Broderie à l\'avant', 'Impression haute qualité au dos', 'Livraison offerte en France'],
      en: ['100% organic heavyweight cotton (240gsm)', 'Unisex oversized fit', 'Embroidery on front', 'High-quality back print', 'Free shipping in France'],
    },
  },
];

export default function Boutique() {
  const router = useRouter();
  const { locale } = router || { locale: 'fr' };
  const [selectedSize, setSelectedSize] = useState(null);
  const [orderStatus, setOrderStatus] = useState('idle'); // idle | form | sending | success | error

  const product = PRODUCTS[0];
  const t = (obj) => obj[locale] || obj['fr'];

  const handleOrder = () => {
    if (!selectedSize) return;
    setOrderStatus('form');
  };

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
          <div className="boutique-product-card">
            {/* Image Side */}
            <div className="boutique-product-image-area">
              <div className="boutique-limited-badge">{t(product.badge)}</div>
              <img
                src={product.images[0]}
                alt={t(product.name)}
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
                      onClick={() => setSelectedSize(size)}
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
        </section>
      </div>

      <SeoFooter currentPage="boutique" />
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
        onStatusChange('success');
      } else {
        onStatusChange('error');
      }
    } catch {
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
