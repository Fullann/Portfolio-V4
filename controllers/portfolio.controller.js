const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const { dbOperations } = require('../config/database');
const { updateHtmlFile } = require('../services/htmlGenerator.service');
const { formatPortfolioProject } = require('../utils/formatters');

let lastUpdate = Date.now();

exports.getAllPortfolioProjects = catchAsync(async (req, res, next) => {
  const projects = await dbOperations.portfolioProjects.getAll();
  const formattedProjects = await Promise.all(projects.map(formatPortfolioProject));
  res.json(formattedProjects);
});

exports.getProjectTranslations = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const translations = await dbOperations.portfolioProjects.getTranslations(id);
  res.json(translations);
});

exports.createPortfolioProject = catchAsync(async (req, res, next) => {
  const { title, category, description, repoLink, liveLink, filterCategory, isCurrentWork, isVisible, translations } = req.body;
  const image = req.file ? `/assets/images/${req.file.filename}` : null;

  lastUpdate = Date.now();

  const newProject = await dbOperations.portfolioProjects.create({
    title,
    category,
    image,
    description,
    repoLink: repoLink || '',
    liveLink: liveLink || '',
    filterCategory: filterCategory || category,
    isCurrentWork: isCurrentWork === '1' || isCurrentWork === 1 || isCurrentWork === 'true' || isCurrentWork === true ? 1 : 0,
    isVisible: isVisible !== undefined ? (isVisible === '1' || isVisible === 1 || isVisible === 'true' || isVisible === true ? 1 : 0) : 1
  });

  if (translations && translations !== 'undefined' && translations !== 'null') {
    const parsedTranslations = typeof translations === 'string' ? JSON.parse(translations) : translations;
    await dbOperations.portfolioProjects.updateTranslations(newProject.id, parsedTranslations);
  }

  await updateHtmlFile();
  res.json(await formatPortfolioProject(newProject));
});

exports.updatePortfolioProject = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { title, category, description, repoLink, liveLink, filterCategory, isCurrentWork, isVisible, translations } = req.body;

  lastUpdate = Date.now();

  const updateData = { title, category, description, repoLink, liveLink, filterCategory };
  if (isCurrentWork !== undefined) {
    updateData.isCurrentWork = isCurrentWork === '1' || isCurrentWork === 1 || isCurrentWork === 'true' || isCurrentWork === true ? 1 : 0;
  }
  if (isVisible !== undefined) {
    updateData.isVisible = isVisible === '1' || isVisible === 1 || isVisible === 'true' || isVisible === true ? 1 : 0;
  }
  if (req.file) {
    updateData.image = `/assets/images/${req.file.filename}`;
  }

  const updatedProject = await dbOperations.portfolioProjects.update(id, updateData);
  if (!updatedProject) {
    return next(new AppError('Projet portfolio non trouvé', 404));
  }

  if (translations && translations !== 'undefined' && translations !== 'null') {
    const parsedTranslations = typeof translations === 'string' ? JSON.parse(translations) : translations;
    await dbOperations.portfolioProjects.updateTranslations(id, parsedTranslations);
  }

  await updateHtmlFile();
  res.json(await formatPortfolioProject(updatedProject));
});

exports.toggleCurrentWork = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { isCurrentWork } = req.body;

  lastUpdate = Date.now();

  const updatedProject = await dbOperations.portfolioProjects.toggleCurrentWork(id, isCurrentWork);
  if (!updatedProject) {
    return next(new AppError('Projet portfolio non trouvé', 404));
  }

  await updateHtmlFile();
  res.json(await formatPortfolioProject(updatedProject));
});

exports.toggleVisibility = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { isVisible } = req.body;

  lastUpdate = Date.now();

  const updatedProject = await dbOperations.portfolioProjects.toggleVisibility(id, isVisible);
  if (!updatedProject) {
    return next(new AppError('Projet portfolio non trouvé', 404));
  }

  await updateHtmlFile();
  res.json(await formatPortfolioProject(updatedProject));
});

exports.deletePortfolioProject = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  lastUpdate = Date.now();

  await dbOperations.portfolioProjects.delete(id);
  await updateHtmlFile();
  res.json({ success: true });
});
