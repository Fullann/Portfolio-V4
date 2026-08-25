const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const { dbOperations } = require('../config/database');
const { updateHtmlFile } = require('../services/htmlGenerator.service');
const { formatPersonalInfo } = require('../utils/formatters');

exports.getPersonalInfo = catchAsync(async (req, res, next) => {
  const personalInfo = await dbOperations.personalInfo.get();
  const formatted = formatPersonalInfo(personalInfo);
  
  // Include translations
  const translations = await dbOperations.personalInfo.getTranslations();
  formatted.translations = translations;
  
  res.json(formatted);
});

exports.updatePersonalInfo = catchAsync(async (req, res, next) => {
  const { name, title, email, phone, birthday, location, aboutText, translations } = req.body;

  const updateData = { name, title, email, phone, birthday, location };

  if (aboutText) {
    updateData.aboutText = aboutText;
  }

  // Parse translations if sent as string
  let parsedTranslations = {};
  if (translations && translations !== 'undefined' && translations !== 'null') {
    parsedTranslations = typeof translations === 'string' ? JSON.parse(translations) : translations;
  }

  if (req.files && Array.isArray(req.files)) {
    // Find avatar
    const avatarFile = req.files.find(f => f.fieldname === 'avatar');
    if (avatarFile) {
      updateData.avatar = `/assets/images/${avatarFile.filename}`;
    }
    
    // Find default cv
    const defaultCv = req.files.find(f => f.fieldname === 'cv');
    if (defaultCv) {
      updateData.cvFile = `/assets/documents/${defaultCv.filename}`;
    }
    
    // Process language-specific CVs
    const cvFiles = req.files.filter(f => f.fieldname.startsWith('cv_'));
    for (const file of cvFiles) {
      const lang = file.fieldname.split('_')[1]; // e.g. cv_en -> en
      if (lang) {
        if (!parsedTranslations[lang]) parsedTranslations[lang] = {};
        parsedTranslations[lang]['cv_file'] = `/assets/documents/${file.filename}`;
      }
    }
  }

  const updatedInfo = await dbOperations.personalInfo.update(updateData);
  
  if (Object.keys(parsedTranslations).length > 0) {
    await dbOperations.personalInfo.updateTranslations(parsedTranslations);
  }
  
  await updateHtmlFile();
  
  const finalInfo = formatPersonalInfo(updatedInfo);
  finalInfo.translations = await dbOperations.personalInfo.getTranslations();
  res.json(finalInfo);
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
