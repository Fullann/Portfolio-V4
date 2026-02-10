const { dbOperations } = require('../config/database');
const { updateHtmlFile } = require('../services/htmlGenerator.service');

let lastUpdate = Date.now();

exports.getAllSkills = async (req, res) => {
  try {
    const skills = await dbOperations.skills.getAll();
    res.json(skills);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des compétences' });
  }
};

exports.createSkill = async (req, res) => {
  try {
    const { name, percentage } = req.body;
    
    if (percentage < 0 || percentage > 100) {
      return res.status(400).json({ error: 'Le pourcentage doit être entre 0 et 100' });
    }

    lastUpdate = Date.now();

    const newSkill = await dbOperations.skills.create({
      name,
      percentage: parseInt(percentage)
    });

    await updateHtmlFile();
    res.json(newSkill);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la compétence' });
  }
};

exports.updateSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, percentage } = req.body;
    lastUpdate = Date.now();

    const updatedSkill = await dbOperations.skills.update(id, {
      name,
      percentage: parseInt(percentage)
    });

    if (!updatedSkill) {
      return res.status(404).json({ error: 'Compétence non trouvée' });
    }

    await updateHtmlFile();
    res.json(updatedSkill);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la compétence' });
  }
};

exports.deleteSkill = async (req, res) => {
  try {
    const { id } = req.params;
    lastUpdate = Date.now();

    await dbOperations.skills.delete(id);
    await updateHtmlFile();
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la compétence' });
  }
};
