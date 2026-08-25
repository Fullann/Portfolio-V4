const { generateSitemap, generateRobotsTxt, generateOgImage } = require('../services/seo.service');
const { generateRssFeed } = require('../services/rss.service');

exports.sitemap = async (req, res) => {
  try {
    const sitemap = await generateSitemap();
    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('Erreur génération sitemap:', error);
    res.status(500).send('Erreur lors de la génération du sitemap');
  }
};

exports.robots = async (req, res) => {
  try {
    const robotsTxt = await generateRobotsTxt();
    res.header('Content-Type', 'text/plain');
    res.send(robotsTxt);
  } catch (error) {
    console.error('Erreur génération robots.txt:', error);
    res.status(500).send('Erreur lors de la génération du robots.txt');
  }
};

exports.rss = async (req, res) => {
  try {
    const rss = await generateRssFeed();
    res.header('Content-Type', 'application/rss+xml');
    res.send(rss);
  } catch (error) {
    console.error('Erreur génération RSS:', error);
    res.status(500).send('Erreur lors de la génération du flux RSS');
  }
};

exports.ogImage = async (req, res) => {
  try {
    const title = req.query.title || 'Portfolio';
    const imageBuffer = await generateOgImage(title);
    
    res.header('Content-Type', 'image/png');
    res.header('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(imageBuffer);
  } catch (error) {
    console.error('Erreur génération image OG:', error);
    res.status(500).send("Erreur lors de la génération de l'image");
  }
};
