const { dbOperations } = require('../config/database');
const { updateHtmlFile } = require('../services/htmlGenerator.service');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');
const path = require('path');
const fs = require('fs').promises;

let lastUpdate = Date.now();

exports.getLastUpdate = async (req, res) => {
  try {
    res.json({ 
      updated: false,
      lastUpdate: lastUpdate 
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.resetAllData = async (req, res) => {
  try {
    console.log(`🗑️ Suppression de toutes les données par: ${req.user?.username || 'Inconnu'}`);

    // Supprimer toutes les données
    await dbOperations.blogs.deleteAll?.() || Promise.resolve();
    await dbOperations.portfolioProjects.deleteAll?.() || Promise.resolve();
    await dbOperations.projects.deleteAll?.() || Promise.resolve();
    await dbOperations.testimonials.deleteAll?.() || Promise.resolve();
    await dbOperations.clients.deleteAll?.() || Promise.resolve();
    await dbOperations.skills.deleteAll?.() || Promise.resolve();
    await dbOperations.experience.deleteAll?.() || Promise.resolve();
    await dbOperations.education.deleteAll?.() || Promise.resolve();
    await dbOperations.socialLinks.deleteAll?.() || Promise.resolve();

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

  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error);
    res.status(500).json({
      error: 'Erreur lors de la réinitialisation des données',
      details: error.message
    });
  }
};

exports.getAccountInfo = async (req, res) => {
  try {
    const admin = await dbOperations.admin.getByUsername(req.user.username);
    
    if (!admin) {
      return res.status(404).json({ error: 'Compte non trouvé' });
    }

    res.json({
      id: admin.id,
      username: admin.username,
      created_at: admin.created_at || null
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.updateAccount = async (req, res) => {
  try {
    const { newUsername } = req.body;

    if (!newUsername || newUsername.trim().length === 0) {
      return res.status(400).json({ error: 'Le nom d\'utilisateur ne peut pas être vide' });
    }

    // Vérifier si le nouveau nom existe déjà (sauf si c'est le même)
    if (newUsername !== req.user.username) {
      const existingUser = await dbOperations.admin.getByUsername(newUsername);
      if (existingUser) {
        return res.status(400).json({ error: 'Ce nom d\'utilisateur est déjà pris' });
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
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Vérifications
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Les nouveaux mots de passe ne correspondent pas' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' });
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(newPassword)) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins une lettre et un chiffre' });
    }

    // Vérifier l'ancien mot de passe
    const admin = await dbOperations.admin.getById(req.user.id);
    
    if (!admin) {
      return res.status(404).json({ error: 'Compte non trouvé' });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, admin.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
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
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors du changement de mot de passe' });
  }
};

exports.getOptimizationStats = async (req, res) => {
  try {
    const imagesDir = path.join(__dirname, '..', 'public', 'assets', 'images');
    
    let totalImages = 0;
    let optimizedImages = 0;
    let totalSize = 0;

    try {
      const files = await fs.readdir(imagesDir);
      
      for (const file of files) {
        const filePath = path.join(imagesDir, file);
        
        try {
          const stats = await fs.stat(filePath);
          
          if (stats.isFile() && /\.(jpg|jpeg|png|webp|gif)$/i.test(file)) {
            totalImages++;
            totalSize += stats.size;
            
            // Considérer les .webp comme optimisés
            if (file.endsWith('.webp')) {
              optimizedImages++;
            }
          }
        } catch (statError) {
          // Ignorer les fichiers inaccessibles
          console.warn(`Impossible de lire: ${file}`);
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
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: error.message 
    });
  }
};
