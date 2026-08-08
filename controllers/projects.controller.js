const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const { dbOperations } = require('../config/database');
const { updateHtmlFile } = require('../services/htmlGenerator.service');

let lastUpdate = Date.now();

exports.getAllProjects = catchAsync(async (req, res, next) => {
  const projects = await dbOperations.projects.getAll();
  res.json(projects);
});

exports.createProject = catchAsync(async (req, res, next) => {
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
});

exports.updateProject = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { title, category, description } = req.body;

  lastUpdate = Date.now();

  const updateData = { title, category, description };
  if (req.file) {
    updateData.image = `/assets/images/${req.file.filename}`;
  }

  const updatedProject = await dbOperations.projects.update(id, updateData);
  if (!updatedProject) {
    return next(new AppError('Projet non trouvé', 404));
  }

  await updateHtmlFile();
  res.json(updatedProject);
});

exports.deleteProject = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  lastUpdate = Date.now();

  await dbOperations.projects.delete(id);
  await updateHtmlFile();
  res.json({ success: true });
});

// Export lastUpdate pour les autres modules
exports.getLastUpdate = () => lastUpdate;
exports.updateLastUpdate = () => { lastUpdate = Date.now(); };
