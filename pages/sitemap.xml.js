import { songs } from '../data/songs';

const EXTERNAL_DATA_URL = 'https://bachatalyrics.com';

function generateSiteMap(songs) {
  const today = new Date().toISOString().split('T')[0];
  
  const staticPages = [
    '',
    '/musicality',
    '/jack-and-jill',
    '/contact',
    '/passes'
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     ${staticPages.map((page) => `
     <url>
       <loc>${EXTERNAL_DATA_URL}${page}</loc>
       <lastmod>${today}</lastmod>
       <changefreq>weekly</changefreq>
       <priority>${page === '' ? '1.0' : '0.8'}</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/en${page}</loc>
       <lastmod>${today}</lastmod>
       <changefreq>weekly</changefreq>
       <priority>${page === '' ? '1.0' : '0.8'}</priority>
     </url>`).join('')}
      ${songs
        .map(({ id, dateAdded, year }) => {
          // Use dateAdded (precise) if available, otherwise fall back to Jan 1 of the song's year
          const songDate = dateAdded || `${year}-01-01`;
          return `
        <url>
            <loc>${EXTERNAL_DATA_URL}/song/${id}</loc>
            <lastmod>${songDate}</lastmod>
            <changefreq>monthly</changefreq>
            <priority>0.8</priority>
        </url>
        <url>
            <loc>${EXTERNAL_DATA_URL}/en/song/${id}</loc>
            <lastmod>${songDate}</lastmod>
            <changefreq>monthly</changefreq>
            <priority>0.8</priority>
        </url>
      `;
        })
        .join('')}
   </urlset>
 `;
}

function SiteMap() {
  // getServerSideProps will do the heavy lifting
}

export async function getServerSideProps({ res }) {
  const sitemap = generateSiteMap(songs);

  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
}

export default SiteMap;
