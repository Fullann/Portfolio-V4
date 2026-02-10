const { dbOperations } = require('../config/database');

async function generateSitemap() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  
  try {
    const blogs = await dbOperations.blogs.getAll();

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
`;

    blogs.forEach(blog => {
      sitemap += `
  <url>
    <loc>${baseUrl}/blog/${blog.slug}</loc>
    <lastmod>${blog.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    });

    sitemap += '</urlset>';
    return sitemap;
  } catch (error) {
    console.error('Erreur génération sitemap:', error);
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
  }
}

function generateRobotsTxt() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  
  return `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`;
}

module.exports = {
  generateSitemap,
  generateRobotsTxt
};
