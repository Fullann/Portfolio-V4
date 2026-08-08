const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const { dbOperations } = require('../config/database');
const { updateHtmlFile } = require('../services/htmlGenerator.service');
const { formatPersonalInfo } = require('../utils/formatters');

let lastUpdate = Date.now();

exports.getPersonalInfo = catchAsync(async (req, res, next) => {
  const personalInfo = await dbOperations.personalInfo.get();
  res.json(formatPersonalInfo(personalInfo));
});

exports.updatePersonalInfo = catchAsync(async (req, res, next) => {
  const { name, title, email, phone, birthday, location, aboutText } = req.body;

  lastUpdate = Date.now();

  const updateData = { name, title, email, phone, birthday, location };

  if (aboutText) {
    updateData.aboutText = aboutText;
  }

  if (req.files?.avatar) {
    updateData.avatar = `/assets/images/${req.files.avatar[0].filename}`;
  }
  if (req.files?.cv) {
    updateData.cvFile = `/assets/documents/${req.files.cv[0].filename}`;
  }

  const updatedInfo = await dbOperations.personalInfo.update(updateData);
  await updateHtmlFile();
  res.json(formatPersonalInfo(updatedInfo));
});

exports.downloadCV = catchAsync(async (req, res, next) => {
  const path = require('path');
  const personalInfo = await dbOperations.personalInfo.get();

  if (personalInfo && personalInfo.cv_file) {
    const docsDir = path.resolve(__dirname, '..', 'public', 'assets', 'documents');
    // On retire tout préfixe pour ne garder que le nom du fichier (sécurité supplémentaire)
    const fileName = path.basename(personalInfo.cv_file);
    const filePath = path.join(docsDir, fileName);
    
    // Vérification que le fichier résolu est bien dans le dossier autorisé
    if (!filePath.startsWith(docsDir)) {
      return next(new AppError('Accès interdit', 403));
    }

    res.download(filePath, 'CV.pdf');
  } else {
    return next(new AppError('CV non trouvé', 404));
  }
});
