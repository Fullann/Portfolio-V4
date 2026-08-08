const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const { dbOperations } = require('../config/database');
const { updateHtmlFile } = require('../services/htmlGenerator.service');

let lastUpdate = Date.now();

exports.getAllExperience = catchAsync(async (req, res, next) => {
  const experience = await dbOperations.experience.getAll();
  res.json(experience);
});

exports.createExperience = catchAsync(async (req, res, next) => {
  const { position, period, description } = req.body;
  lastUpdate = Date.now();

  const newExperience = await dbOperations.experience.create({ position, period, description });

  await updateHtmlFile();
  res.json(newExperience);
});

exports.updateExperience = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { position, period, description } = req.body;
  lastUpdate = Date.now();

  const updatedExperience = await dbOperations.experience.update(id, { position, period, description });

  if (!updatedExperience) {
    return next(new AppError('Expérience non trouvée', 404));
  }

  await updateHtmlFile();
  res.json(updatedExperience);
});

exports.deleteExperience = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  lastUpdate = Date.now();

  await dbOperations.experience.delete(id);
  await updateHtmlFile();
  res.json({ success: true });
});

exports.moveUp = catchAsync(async (req, res, next) => {
  await dbOperations.experience.moveUp(req.params.id);
  res.json({ success: true, message: 'Ordre mis à jour' });
});

exports.moveDown = catchAsync(async (req, res, next) => {
  await dbOperations.experience.moveDown(req.params.id);
  res.json({ success: true, message: 'Ordre mis à jour' });
});

exports.bulkReorder = catchAsync(async (req, res, next) => {
  const { order } = req.body;
  if (!Array.isArray(order)) return next(new AppError('Format invalide', 400));

  await dbOperations.experience.bulkReorder(order);
  const { updateHtmlFile } = require('../services/htmlGenerator.service');
  await updateHtmlFile();

  res.json({ success: true, message: 'Ordre mis à jour' });
});
