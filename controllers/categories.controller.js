const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const { dbOperations } = require('../config/database');
const { updateHtmlFile } = require('../services/htmlGenerator.service');

let lastUpdate = Date.now();

exports.getAllCategories = catchAsync(async (req, res, next) => {
  const categories = await dbOperations.categories.getAll();
  res.json(categories);
});

exports.createCategory = catchAsync(async (req, res, next) => {
  const { name, displayName } = req.body;

  const existingCategory = await dbOperations.categories.getByName(name.toLowerCase());
  if (existingCategory) {
    return next(new AppError('Cette catégorie existe déjà', 400));
  }

  lastUpdate = Date.now();

  const newCategory = await dbOperations.categories.create({
    name: name.toLowerCase().replace(/\s+/g, ' ').trim(),
    displayName: displayName || name
  });

  await updateHtmlFile();
  res.json(newCategory);
});

exports.updateCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, displayName } = req.body;

  lastUpdate = Date.now();

  const category = await dbOperations.categories.getById(id);
  if (!category) {
    return next(new AppError('Catégorie non trouvée', 404));
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
});

exports.deleteCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const category = await dbOperations.categories.getById(id);
  if (!category) {
    return next(new AppError('Catégorie non trouvée', 404));
  }

  const projectsUsingCategory = (await dbOperations.portfolioProjects.getAll())
    .filter(p => p.filter_category === category.name);

  if (projectsUsingCategory.length > 0) {
    return next(new AppError(
      `Impossible de supprimer cette catégorie. ${projectsUsingCategory.length} projet(s) l'utilisent encore.`,
      400
    ));
  }

  lastUpdate = Date.now();
  await dbOperations.categories.delete(id);
  await updateHtmlFile();
  res.json({ success: true });
});
