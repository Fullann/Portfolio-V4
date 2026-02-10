const { dbOperations } = require('../config/database');
const { updateHtmlFile } = require('../services/htmlGenerator.service');

let lastUpdate = Date.now();

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await dbOperations.categories.getAll();
    res.json(categories);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des catégories' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, displayName } = req.body;

    const existingCategory = await dbOperations.categories.getByName(name.toLowerCase());
    if (existingCategory) {
      return res.status(400).json({ error: 'Cette catégorie existe déjà' });
    }

    lastUpdate = Date.now();

    const newCategory = await dbOperations.categories.create({
      name: name.toLowerCase().replace(/\s+/g, ' ').trim(),
      displayName: displayName || name
    });

    await updateHtmlFile();
    res.json(newCategory);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la catégorie' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, displayName } = req.body;

    lastUpdate = Date.now();

    const category = await dbOperations.categories.getById(id);
    if (!category) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }

    const oldName = category.name;
    const newName = name ? name.toLowerCase().replace(/\s+/g, ' ').trim() : category.name;
    const newDisplayName = displayName || category.display_name;

    const updatedCategory = await dbOperations.categories.update(id, {
      name: newName,
      displayName: newDisplayName
    });

    if (oldName !== newName) {
      await dbOperations.portfolioProjects.updateCategoryReferences(oldName, newName, newDisplayName);
    }

    await updateHtmlFile();
    res.json(updatedCategory);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la catégorie' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await dbOperations.categories.getById(id);
    if (!category) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }

    const projectsUsingCategory = (await dbOperations.portfolioProjects.getAll())
      .filter(p => p.filter_category === category.name);

    if (projectsUsingCategory.length > 0) {
      return res.status(400).json({
        error: `Impossible de supprimer cette catégorie. ${projectsUsingCategory.length} projet(s) l'utilisent encore.`,
        projects: projectsUsingCategory.map(p => p.title)
      });
    }

    lastUpdate = Date.now();
    await dbOperations.categories.delete(id);
    await updateHtmlFile();
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la catégorie' });
  }
};
