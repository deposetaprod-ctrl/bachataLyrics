import { songs } from '../data/songs';

const EXTERNAL_DATA_URL = 'https://bachatalyrics.com';

function generateSiteMap(songs) {
  const today = new Date().toISOString().split('T')[0];
  
  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <url>
       <loc>${EXTERNAL_DATA_URL}/</loc>
       <lastmod>${today}</lastmod>
       <changefreq>weekly</changefreq>
       <priority>1.0</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/musicality</loc>
       <lastmod>${today}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.8</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/passes</loc>
       <lastmod>${today}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.8</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/jack-and-jill</loc>
       <lastmod>${today}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.8</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/contact</loc>
       <lastmod>${today}</lastmod>
       <changefreq>yearly</changefreq>
       <priority>0.3</priority>
     </url>
     ${songs
       .map(({ id, year }) => {
         // Use Jan 1 of the song's year as a rough lastmod
         const songDate = `${year}-01-01`;
         return `
       <url>
           <loc>${`${EXTERNAL_DATA_URL}/song/${id}`}</loc>
           <lastmod>${songDate}</lastmod>
           <changefreq>monthly</changefreq>
           <priority>0.6</priority>
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
