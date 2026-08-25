const { dbOperations } = require('../config/database');

/**
 * Génère un flux RSS 2.0 pour les articles de blog.
 */
async function generateRssFeed() {
  const baseUrl = await dbOperations.settings.get('base_url') || 'http://localhost:3000';
  const siteName = await dbOperations.settings.get('site_name') || 'Mon Portfolio';
  const siteDesc = await dbOperations.settings.get('site_description') || 'Articles récents de mon blog';
  
  const blogs = await dbOperations.blogs.getAll();

  const escapeXml = (unsafe) => {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
      }
    });
  };

  let rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${escapeXml(siteName)} - Blog</title>
  <link>${baseUrl}</link>
  <description>${escapeXml(siteDesc)}</description>
  <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
  <language>fr-fr</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
`;

  blogs.forEach(blog => {
    // Format pubDate correctly for RSS (RFC 822)
    const pubDate = blog.date ? new Date(blog.date).toUTCString() : new Date().toUTCString();
    
    rss += `
  <item>
    <title>${escapeXml(blog.title)}</title>
    <link>${baseUrl}/blog/${encodeURI(blog.slug)}</link>
    <guid isPermaLink="true">${baseUrl}/blog/${encodeURI(blog.slug)}</guid>
    <description>${escapeXml(blog.excerpt || '')}</description>
    <pubDate>${pubDate}</pubDate>
    <category>${escapeXml(blog.category || 'Général')}</category>
  </item>
`;
  });

  rss += `</channel>
</rss>`;

  return rss;
}

module.exports = { generateRssFeed };
