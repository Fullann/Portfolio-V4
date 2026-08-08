const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const { dbOperations } = require('../config/database');
const { updateHtmlFile } = require('../services/htmlGenerator.service');
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
