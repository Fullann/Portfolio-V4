const { dbOperations } = require('../config/database');
const { updateHtmlFile } = require('../services/htmlGenerator.service');

let lastUpdate = Date.now();

exports.getAllProjects = async (req, res) => {
  try {
    const projects = await dbOperations.projects.getAll();
    res.json(projects);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des projets' });
  }
};

exports.createProject = async (req, res) => {
  try {
    const { title, category, description } = req.body;
    const image = req.file ? `/assets/images/${req.file.filename}` : null;

    if (req.file && req.file.optimized) {
      console.log(`📊 Optimisation: ${req.file.optimizationStats.savings}% d'économie`);
    }

    lastUpdate = Date.now();

    const newProject = await dbOperations.projects.create({
      title,
      category,
      image,
      description
    });

    await updateHtmlFile();
    res.json(newProject);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la création du projet' });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, description } = req.body;

    lastUpdate = Date.now();

    const updateData = { title, category, description };
    if (req.file) {
      updateData.image = `/assets/images/${req.file.filename}`;
    }

    const updatedProject = await dbOperations.projects.update(id, updateData);
    if (!updatedProject) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    await updateHtmlFile();
    res.json(updatedProject);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du projet' });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    lastUpdate = Date.now();

    await dbOperations.projects.delete(id);
    await updateHtmlFile();
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du projet' });
  }
};

// Export lastUpdate pour les autres modules
exports.getLastUpdate = () => lastUpdate;
exports.updateLastUpdate = () => { lastUpdate = Date.now(); };
