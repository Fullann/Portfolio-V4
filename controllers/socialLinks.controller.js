const { dbOperations } = require('../config/database');
const { updateHtmlFile } = require('../services/htmlGenerator.service');

let lastUpdate = Date.now();

exports.getAllSocialLinks = async (req, res) => {
  try {
    const socialLinks = await dbOperations.socialLinks.getAll();
    res.json(socialLinks);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des liens sociaux' });
  }
};

exports.createSocialLink = async (req, res) => {
  try {
    const { name, icon, url } = req.body;
    lastUpdate = Date.now();

    const newSocialLink = await dbOperations.socialLinks.create({ name, icon, url });

    await updateHtmlFile();
    res.json(newSocialLink);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la création du lien social' });
  }
};

exports.updateSocialLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, url } = req.body;
    lastUpdate = Date.now();

    const updatedSocialLink = await dbOperations.socialLinks.update(id, { name, icon, url });

    if (!updatedSocialLink) {
      return res.status(404).json({ error: 'Lien social non trouvé' });
    }

    await updateHtmlFile();
    res.json(updatedSocialLink);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du lien social' });
  }
};

exports.deleteSocialLink = async (req, res) => {
  try {
    const { id } = req.params;
    lastUpdate = Date.now();

    await dbOperations.socialLinks.delete(id);
    await updateHtmlFile();
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du lien social' });
  }
};
