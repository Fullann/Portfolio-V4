const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const { dbOperations } = require('../config/database');
const { updateHtmlFile } = require('../services/htmlGenerator.service');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');
const path = require('path');
const fs = require('fs').promises;

let lastUpdate = Date.now();

exports.getLastUpdate = catchAsync(async (req, res, next) => {
  res.json({ 
    updated: false,
    lastUpdate: lastUpdate 
  });
});

exports.resetAllData = catchAsync(async (req, res, next) => {
  console.log(`🗑️ Suppression de toutes les données par: ${req.user?.username || 'Inconnu'}`);

  // Supprimer toutes les données
  (await dbOperations.blogs.deleteAll?.()) || Promise.resolve();
  (await dbOperations.portfolioProjects.deleteAll?.()) || Promise.resolve();
  (await dbOperations.projects.deleteAll?.()) || Promise.resolve();
  (await dbOperations.testimonials.deleteAll?.()) || Promise.resolve();
  (await dbOperations.clients.deleteAll?.()) || Promise.resolve();
  (await dbOperations.skills.deleteAll?.()) || Promise.resolve();
  (await dbOperations.experience.deleteAll?.()) || Promise.resolve();
  (await dbOperations.education.deleteAll?.()) || Promise.resolve();
  (await dbOperations.socialLinks.deleteAll?.()) || Promise.resolve();

  lastUpdate = Date.now();

  // Mettre à jour le HTML si possible
  try {
    await updateHtmlFile();
    console.log('✅ Fichier HTML mis à jour');
  } catch (e) {
    console.warn('⚠️ Impossible de mettre à jour le HTML:', e.message);
  }

  console.log('✅ Toutes les données ont été supprimées');

  res.json({
    success: true,
    message: 'Toutes les données ont été réinitialisées avec succès'
  });
});

exports.getAccountInfo = catchAsync(async (req, res, next) => {
  const admin = await dbOperations.admin.getByUsername(req.user.username);

  if (!admin) {
    return next(new AppError('Compte non trouvé', 404));
  }

  res.json({
    id: admin.id,
    username: admin.username,
    created_at: admin.created_at || null
  });
});

exports.updateAccount = catchAsync(async (req, res, next) => {
  const { newUsername } = req.body;

  if (!newUsername || newUsername.trim().length === 0) {
    return next(new AppError('Le nom d\'utilisateur ne peut pas être vide', 400));
  }

  // Vérifier si le nouveau nom existe déjà (sauf si c'est le même)
  if (newUsername !== req.user.username) {
    const existingUser = await dbOperations.admin.getByUsername(newUsername);
    if (existingUser) {
      return next(new AppError('Ce nom d\'utilisateur est déjà pris', 400));
    }
  }

  // Mettre à jour le nom d'utilisateur en utilisant ta méthode update
  await dbOperations.admin.update(req.user.id, { username: newUsername });

  // Générer un nouveau token avec le nouveau username
  const newToken = jwt.sign(
    { username: newUsername, id: req.user.id },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  console.log(`✅ Nom d'utilisateur changé: ${req.user.username} → ${newUsername}`);

  res.json({
    success: true,
    message: 'Nom d\'utilisateur mis à jour',
    newToken
  });
});

exports.changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  // Vérifications
  if (!currentPassword || !newPassword || !confirmPassword) {
    return next(new AppError('Tous les champs sont requis', 400));
  }

  if (newPassword !== confirmPassword) {
    return next(new AppError('Les nouveaux mots de passe ne correspondent pas', 400));
  }

  if (newPassword.length < 8) {
    return next(new AppError('Le mot de passe doit contenir au moins 8 caractères', 400));
  }

  if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(newPassword)) {
    return next(
      new AppError('Le mot de passe doit contenir au moins une lettre et un chiffre', 400)
    );
  }

  // Vérifier l'ancien mot de passe
  const admin = await dbOperations.admin.getById(req.user.id);

  if (!admin) {
    return next(new AppError('Compte non trouvé', 404));
  }

  const isValidPassword = await bcrypt.compare(currentPassword, admin.password);

  if (!isValidPassword) {
    return next(new AppError('Mot de passe actuel incorrect', 401));
  }

  // Hasher et sauvegarder le nouveau mot de passe
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // Utiliser ta méthode update existante
  await dbOperations.admin.update(req.user.id, { password: hashedPassword });

  console.log(`✅ Mot de passe changé pour: ${req.user.username}`);

  res.json({
    success: true,
    message: 'Mot de passe changé avec succès'
  });
});

exports.getOptimizationStats = catchAsync(async (req, res, next) => {
  const imagesDir = path.join(__dirname, '..', 'public', 'assets', 'images');

  let totalImages = 0;
  let optimizedImages = 0;
  let totalSize = 0;

  try {
    const files = await fs.readdir(imagesDir);
    
    for (const file of files) {
      const filePath = path.join(imagesDir, file);

      const stats = await fs.stat(filePath);

      if (stats.isFile() && /\.(jpg|jpeg|png|webp|gif)$/i.test(file)) {
        totalImages++;
        totalSize += stats.size;
        
        // Considérer les .webp comme optimisés
        if (file.endsWith('.webp')) {
          optimizedImages++;
        }
      }
    }
  } catch (error) {
    console.warn('Impossible de lire le dossier images:', error.message);
  }

  const optimizationRate = totalImages > 0 
    ? Math.round((optimizedImages / totalImages) * 100) 
    : 0;

  const diskUsage = (totalSize / (1024 * 1024)).toFixed(2); // MB

  res.json({
    totalImages,
    optimizedImages,
    optimizationRate: `${optimizationRate}%`,
    totalDiskUsage: `${diskUsage} MB`
  });
});
