const { dbOperations } = require('../config/database');

async function generateSitemap() {
  // Récupérer base_url depuis les settings DB
  const baseUrl = await dbOperations.settings.get('base_url') || 'http://localhost:3000';
  
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
  <url>
    <loc>${baseUrl}/download-cv</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
`;

    blogs.forEach(blog => {
      let lastmod = new Date().toISOString();
      if (blog.date) {
        try { lastmod = new Date(blog.date).toISOString(); } catch(e) {}
      }
      sitemap += `
  <url>
    <loc>${baseUrl}/blog/${encodeURI(blog.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
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

async function generateRobotsTxt() {
  const baseUrl = await dbOperations.settings.get('base_url') || 'http://localhost:3000';
  
  return `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`;
}

const sharp = require('sharp');

async function generateOgImage(title) {
  const width = 1200;
  const height = 630;
  
  // Create an SVG with the text
  // We use standard web safe fonts like Arial or Helvetica
  const svgText = `
    <svg width="${width}" height="${height}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1E293B" />
          <stop offset="100%" stop-color="#0F172A" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)" />
      
      <text x="50%" y="45%" font-family="sans-serif" font-size="64" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">
        ${title}
      </text>
      
      <text x="50%" y="85%" font-family="sans-serif" font-size="32" fill="#94A3B8" text-anchor="middle">
        Lire l'article complet
      </text>
    </svg>
  `;

  try {
    return await sharp(Buffer.from(svgText))
      .png()
      .toBuffer();
  } catch (error) {
    console.error("Erreur lors de la génération de l'image OG:", error);
    throw error;
  }
}

module.exports = {
  generateSitemap,
  generateRobotsTxt,
  generateOgImage
};
