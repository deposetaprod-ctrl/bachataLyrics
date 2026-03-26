import Head from 'next/head';
import { useRouter } from 'next/router';

const BASE_URL = 'https://bachatalyrics.com';

/**
 * Composant pour gérer l'URL canonique de chaque page.
 * Cela aide Google à identifier la version "officielle" d'une page
 * et évite les erreurs de "doublons sans URL canonique".
 */
export default function Canonical() {
  const router = useRouter();
  
  // Supprime les paramètres de requête pour l'URL canonique (optionnel, mais souvent recommandé)
  const cleanPath = router.asPath.split('?')[0];
  
  // Gère le cas de la home page "/"
  const canonicalUrl = `${BASE_URL}${cleanPath === '/' ? '' : cleanPath}`;

  return (
    <Head>
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:url" content={canonicalUrl} />
    </Head>
  );
}
