const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const { dbOperations } = require('../config/database');
const { updateHtmlFile } = require('../services/htmlGenerator.service');


exports.getAllSkills = catchAsync(async (req, res, next) => {
  const skills = await dbOperations.skills.getAll();
  res.json(skills);
});

exports.createSkill = catchAsync(async (req, res, next) => {
  const { name, percentage, category, icon } = req.body;

  const parsedPercentage = parseInt(percentage) || 80;
  if (parsedPercentage < 0 || parsedPercentage > 100) {
    return next(new AppError('Le pourcentage doit être entre 0 et 100', 400));
  }

  const newSkill = await dbOperations.skills.create({
    name,
    percentage: parsedPercentage,
    category: category || 'Frontend',
    icon: icon || ''
  });

  await updateHtmlFile();
  res.json(newSkill);
});

exports.updateSkill = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, percentage, category, icon } = req.body;

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (percentage !== undefined) updateData.percentage = parseInt(percentage);
  if (category !== undefined) updateData.category = category;
  if (icon !== undefined) updateData.icon = icon;

  const updatedSkill = await dbOperations.skills.update(id, updateData);

  if (!updatedSkill) {
    return next(new AppError('Compétence non trouvée', 404));
  }

  await updateHtmlFile();
  res.json(updatedSkill);
});

exports.deleteSkill = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  await dbOperations.skills.delete(id);
  await updateHtmlFile();
  res.json({ success: true });
});
