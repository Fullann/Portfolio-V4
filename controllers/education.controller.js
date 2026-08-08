const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const { dbOperations } = require('../config/database');
const { updateHtmlFile } = require('../services/htmlGenerator.service');

let lastUpdate = Date.now();

exports.getAllEducation = catchAsync(async (req, res, next) => {
  const education = await dbOperations.education.getAll();
  res.json(education);
});

exports.createEducation = catchAsync(async (req, res, next) => {
  const { institution, period, description } = req.body;
  lastUpdate = Date.now();

  const newEducation = await dbOperations.education.create({ institution, period, description });

  await updateHtmlFile();
  res.json(newEducation);
});

exports.updateEducation = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { institution, period, description } = req.body;
  lastUpdate = Date.now();

  const updatedEducation = await dbOperations.education.update(id, { institution, period, description });

  if (!updatedEducation) {
    return next(new AppError('Éducation non trouvée', 404));
  }

  await updateHtmlFile();
  res.json(updatedEducation);
});

exports.deleteEducation = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  lastUpdate = Date.now();

  await dbOperations.education.delete(id);
  await updateHtmlFile();
  res.json({ success: true });
});

exports.moveUp = catchAsync(async (req, res, next) => {
  await dbOperations.education.moveUp(req.params.id);
  res.json({ success: true, message: 'Ordre mis à jour' });
});

exports.moveDown = catchAsync(async (req, res, next) => {
  await dbOperations.education.moveDown(req.params.id);
  res.json({ success: true, message: 'Ordre mis à jour' });
});


exports.bulkReorder = catchAsync(async (req, res, next) => {
  const { order } = req.body;
  if (!Array.isArray(order)) return next(new AppError('Format invalide', 400));

  await dbOperations.education.bulkReorder(order);
  const { updateHtmlFile } = require('../services/htmlGenerator.service');
  await updateHtmlFile();

  res.json({ success: true, message: 'Ordre mis à jour' });
});
