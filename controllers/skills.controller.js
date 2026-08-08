const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const { dbOperations } = require('../config/database');
const { updateHtmlFile } = require('../services/htmlGenerator.service');

let lastUpdate = Date.now();

exports.getAllSkills = catchAsync(async (req, res, next) => {
  const skills = await dbOperations.skills.getAll();
  res.json(skills);
});

exports.createSkill = catchAsync(async (req, res, next) => {
  const { name, percentage } = req.body;

  if (percentage < 0 || percentage > 100) {
    return next(new AppError('Le pourcentage doit être entre 0 et 100', 400));
  }

  lastUpdate = Date.now();

  const newSkill = await dbOperations.skills.create({
    name,
    percentage: parseInt(percentage)
  });

  await updateHtmlFile();
  res.json(newSkill);
});

exports.updateSkill = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, percentage } = req.body;
  lastUpdate = Date.now();

  const updatedSkill = await dbOperations.skills.update(id, {
    name,
    percentage: parseInt(percentage)
  });

  if (!updatedSkill) {
    return next(new AppError('Compétence non trouvée', 404));
  }

  await updateHtmlFile();
  res.json(updatedSkill);
});

exports.deleteSkill = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  lastUpdate = Date.now();

  await dbOperations.skills.delete(id);
  await updateHtmlFile();
  res.json({ success: true });
});
