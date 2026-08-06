const { generateSitemap, generateRobotsTxt } = require('../services/seo.service');

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
