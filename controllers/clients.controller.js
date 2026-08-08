const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const { dbOperations } = require('../config/database');
const { updateHtmlFile } = require('../services/htmlGenerator.service');

let lastUpdate = Date.now();

exports.getAllClients = catchAsync(async (req, res, next) => {
  const clients = await dbOperations.clients.getAll();
  res.json(clients);
});

exports.createClient = catchAsync(async (req, res, next) => {
  const { name, website, description } = req.body;
  const logo = req.file ? `/assets/images/${req.file.filename}` : null;

  lastUpdate = Date.now();

  const newClient = await dbOperations.clients.create({
    name,
    logo,
    website: website || '',
    description: description || ''
  });

  await updateHtmlFile();
  res.json(newClient);
});

exports.updateClient = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, website, description } = req.body;

  lastUpdate = Date.now();

  const updateData = { name, website, description };
  if (req.file) {
    updateData.logo = `/assets/images/${req.file.filename}`;
  }

  const updatedClient = await dbOperations.clients.update(id, updateData);
  if (!updatedClient) {
    return next(new AppError('Client non trouvé', 404));
  }

  await updateHtmlFile();
  res.json(updatedClient);
});

exports.deleteClient = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  lastUpdate = Date.now();

  await dbOperations.clients.delete(id);
  await updateHtmlFile();
  res.json({ success: true });
});
