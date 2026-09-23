const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const { dbOperations } = require('../config/database');
const { updateHtmlFile } = require('../services/htmlGenerator.service');

exports.getAllCertifications = catchAsync(async (req, res, next) => {
  const certifications = await dbOperations.certifications.getAll();
  res.json(certifications);
});

exports.getCertificationById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const certification = await dbOperations.certifications.getById(id);
  if (!certification) {
    return next(new AppError('Certification non trouvée', 404));
  }
  res.json(certification);
});

exports.createCertification = catchAsync(async (req, res, next) => {
  const { title, issuer, date, credentialUrl, credential_url } = req.body;
  const logo = req.file ? `/assets/images/${req.file.filename}` : (req.body.logo || '');

  const newCertification = await dbOperations.certifications.create({
    title,
    issuer: issuer || '',
    date: date || '',
    logo,
    credentialUrl: credentialUrl || credential_url || ''
  });

  await updateHtmlFile();
  res.json(newCertification);
});

exports.updateCertification = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { title, issuer, date, credentialUrl, credential_url, displayOrder } = req.body;

  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (issuer !== undefined) updateData.issuer = issuer;
  if (date !== undefined) updateData.date = date;
  if (credentialUrl !== undefined || credential_url !== undefined) {
    updateData.credentialUrl = credentialUrl || credential_url || '';
  }
  if (displayOrder !== undefined) updateData.displayOrder = displayOrder;

  if (req.file) {
    updateData.logo = `/assets/images/${req.file.filename}`;
  } else if (req.body.logo !== undefined) {
    updateData.logo = req.body.logo;
  }

  const updatedCertification = await dbOperations.certifications.update(id, updateData);
  if (!updatedCertification) {
    return next(new AppError('Certification non trouvée', 404));
  }

  await updateHtmlFile();
  res.json(updatedCertification);
});

exports.deleteCertification = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  await dbOperations.certifications.delete(id);
  await updateHtmlFile();
  res.json({ success: true });
});

exports.moveUp = catchAsync(async (req, res, next) => {
  await dbOperations.certifications.moveUp(req.params.id);
  await updateHtmlFile();
  res.json({ success: true, message: 'Ordre mis à jour' });
});

exports.moveDown = catchAsync(async (req, res, next) => {
  await dbOperations.certifications.moveDown(req.params.id);
  await updateHtmlFile();
  res.json({ success: true, message: 'Ordre mis à jour' });
});

exports.bulkReorder = catchAsync(async (req, res, next) => {
  const { order } = req.body;
  if (!Array.isArray(order)) return next(new AppError('Format invalide', 400));

  await dbOperations.certifications.bulkReorder(order);
  await updateHtmlFile();
  res.json({ success: true, message: 'Ordre mis à jour' });
});
