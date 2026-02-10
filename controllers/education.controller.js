const { dbOperations } = require('../config/database');
const { updateHtmlFile } = require('../services/htmlGenerator.service');

let lastUpdate = Date.now();

exports.getAllEducation = async (req, res) => {
  try {
    const education = await dbOperations.education.getAll();
    res.json(education);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'éducation' });
  }
};

exports.createEducation = async (req, res) => {
  try {
    const { institution, period, description } = req.body;
    lastUpdate = Date.now();

    const newEducation = await dbOperations.education.create({ institution, period, description });

    await updateHtmlFile();
    res.json(newEducation);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'éducation' });
  }
};

exports.updateEducation = async (req, res) => {
  try {
    const { id } = req.params;
    const { institution, period, description } = req.body;
    lastUpdate = Date.now();

    const updatedEducation = await dbOperations.education.update(id, { institution, period, description });

    if (!updatedEducation) {
      return res.status(404).json({ error: 'Éducation non trouvée' });
    }

    await updateHtmlFile();
    res.json(updatedEducation);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'éducation' });
  }
};

exports.deleteEducation = async (req, res) => {
  try {
    const { id } = req.params;
    lastUpdate = Date.now();

    await dbOperations.education.delete(id);
    await updateHtmlFile();
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'éducation' });
  }
};

exports.moveUp = async (req, res) => {
  try {
    await dbOperations.education.moveUp(req.params.id);
    res.json({ success: true, message: 'Ordre mis à jour' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.moveDown = async (req, res) => {
  try {
    await dbOperations.education.moveDown(req.params.id);
    res.json({ success: true, message: 'Ordre mis à jour' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

