const { dbOperations } = require('../config/database');
const { updateHtmlFile } = require('../services/htmlGenerator.service');

let lastUpdate = Date.now();

exports.getAllExperience = async (req, res) => {
  try {
    const experience = await dbOperations.experience.getAll();
    res.json(experience);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'expérience' });
  }
};

exports.createExperience = async (req, res) => {
  try {
    const { position, period, description } = req.body;
    lastUpdate = Date.now();

    const newExperience = await dbOperations.experience.create({ position, period, description });

    await updateHtmlFile();
    res.json(newExperience);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'expérience' });
  }
};

exports.updateExperience = async (req, res) => {
  try {
    const { id } = req.params;
    const { position, period, description } = req.body;
    lastUpdate = Date.now();

    const updatedExperience = await dbOperations.experience.update(id, { position, period, description });

    if (!updatedExperience) {
      return res.status(404).json({ error: 'Expérience non trouvée' });
    }

    await updateHtmlFile();
    res.json(updatedExperience);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'expérience' });
  }
};

exports.deleteExperience = async (req, res) => {
  try {
    const { id } = req.params;
    lastUpdate = Date.now();

    await dbOperations.experience.delete(id);
    await updateHtmlFile();
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'expérience' });
  }
};

exports.moveUp = async (req, res) => {
  try {
    await dbOperations.experience.moveUp(req.params.id);
    res.json({ success: true, message: 'Ordre mis à jour' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.moveDown = async (req, res) => {
  try {
    await dbOperations.experience.moveDown(req.params.id);
    res.json({ success: true, message: 'Ordre mis à jour' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
