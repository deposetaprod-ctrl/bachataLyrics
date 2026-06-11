import Head from 'next/head';
import { useRouter } from 'next/router';

const BASE_URL = 'https://bachatalyrics.com';

/**
 * Composant pour gérer l'URL canonique de chaque page.
 * Cela aide Google à identifier la version "officielle" d'une page
 * et évite les erreurs de "doublons sans URL canonique".
 * 
 * Inclut aussi les balises hreflang pour indiquer à Google
 * les versions FR et EN de chaque page.
 */
export default function Canonical() {
  const router = useRouter();
  
  // Supprime les paramètres de requête pour l'URL canonique (optionnel, mais souvent recommandé)
  const cleanPath = router.asPath.split('?')[0];
  
  // Gère le cas de la home page "/"
  const canonicalUrl = `${BASE_URL}${cleanPath === '/' ? '' : cleanPath}`;

  // Build the path without locale prefix for hreflang alternates
  const pathWithoutLocale = cleanPath.replace(/^\/en(\/|$)/, '/').replace(/\/$/, '') || '/';
  const frUrl = `${BASE_URL}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`;
  const enUrl = `${BASE_URL}/en${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`;

  return (
    <Head>
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:url" content={canonicalUrl} />
      <link rel="alternate" hrefLang="fr" href={frUrl} />
      <link rel="alternate" hrefLang="en" href={enUrl} />
      <link rel="alternate" hrefLang="x-default" href={frUrl} />
    </Head>
  );
}

