import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="fr">
      <Head>
        <meta charSet="UTF-8" />
        <meta name="description" content="Bachata Flow — Paroles de bachata bilingues (espagnol / français), analyse musicale et progression de danse. L'app des passionnés de bachata." />
        <meta name="theme-color" content="#0a0a0f" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <link rel="manifest" href="/manifest.json" />

        {/* Favicon — vrai logo */}
        <link rel="icon" type="image/png" href="/LOGO_PWA.PNG" />
        <link rel="apple-touch-icon" href="/LOGO_PWA.PNG" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Bachata Flow" />
        <meta property="og:title" content="Bachata Flow — Paroles de Bachata en Français" />
        <meta property="og:description" content="Découvrez les plus belles paroles de bachata traduites en français, entraînez votre oreille musicale et progressez en danse." />
        <meta property="og:image" content="https://bachatalyrics.com/LOGO_PWA.PNG" />
        <meta property="og:locale" content="fr_FR" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Bachata Flow" />
        <meta name="twitter:description" content="Paroles de bachata bilingues + Musicality Trainer pour les danseurs." />
        <meta name="twitter:image" content="https://bachatalyrics.com/LOGO_PWA.PNG" />

        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
