const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const { dbOperations } = require('../config/database');
const { updateHtmlFile } = require('../services/htmlGenerator.service');

let lastUpdate = Date.now();

exports.getAllSocialLinks = catchAsync(async (req, res, next) => {
  const socialLinks = await dbOperations.socialLinks.getAll();
  res.json(socialLinks);
});

exports.createSocialLink = catchAsync(async (req, res, next) => {
  const { name, icon, url } = req.body;
  lastUpdate = Date.now();

  const newSocialLink = await dbOperations.socialLinks.create({ name, icon, url });

  await updateHtmlFile();
  res.json(newSocialLink);
});

exports.updateSocialLink = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, icon, url } = req.body;
  lastUpdate = Date.now();

  const updatedSocialLink = await dbOperations.socialLinks.update(id, { name, icon, url });

  if (!updatedSocialLink) {
    return next(new AppError('Lien social non trouvé', 404));
  }

  await updateHtmlFile();
  res.json(updatedSocialLink);
});

exports.deleteSocialLink = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  lastUpdate = Date.now();

  await dbOperations.socialLinks.delete(id);
  await updateHtmlFile();
  res.json({ success: true });
});
