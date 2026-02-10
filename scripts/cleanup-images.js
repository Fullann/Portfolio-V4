#!/usr/bin/env node
'use strict';

// ============================================
// 🗑️ SCRIPT DE NETTOYAGE DES IMAGES NON UTILISÉES
// ============================================

const fs = require('fs').promises;
const path = require('path');
const mysql = require('mysql2/promise');

// Configuration
const IMAGE_DIRS = [
  './public/assets/images',
  './public/assets/documents'
];

const DB_CONFIG = {
  host: 'localhost',
  user: 'testuser',
  password: 'testuserpassword',
  database: 'portfolio',
  port:'3307'
};

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(emoji, message, color = colors.reset) {
  console.log(`${color}${emoji} ${message}${colors.reset}`);
}

function logSuccess(message) {
  log('✅', message, colors.green);
}

function logError(message) {
  log('❌', message, colors.red);
}

function logInfo(message) {
  log('ℹ️', message, colors.cyan);
}

function logWarning(message) {
  log('⚠️', message, colors.yellow);
}

function logSection(title) {
  console.log('\n' + colors.bright + colors.magenta + '═'.repeat(60) + colors.reset);
  console.log(colors.bright + colors.magenta + `  ${title}` + colors.reset);
  console.log(colors.bright + colors.magenta + '═'.repeat(60) + colors.reset + '\n');
}

// ============================================
// 📂 SCANNER LES FICHIERS
// ============================================

async function scanFiles(directory) {
  try {
    const files = await fs.readdir(directory);
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.pdf'].includes(ext);
    });
    
    return imageFiles.map(file => ({
      filename: file,
      fullPath: path.join(directory, file),
      directory: directory
    }));
  } catch (error) {
    logWarning(`Impossible de lire le dossier ${directory}: ${error.message}`);
    return [];
  }
}

async function getAllFiles() {
  logInfo('Scan des dossiers d\'images...');
  
  let allFiles = [];
  for (const dir of IMAGE_DIRS) {
    const files = await scanFiles(dir);
    allFiles = allFiles.concat(files);
  }
  
  logSuccess(`${allFiles.length} fichiers trouvés`);
  return allFiles;
}

// ============================================
// 🔍 VÉRIFIER L'UTILISATION DANS LA DB
// ============================================

async function getUsedImages(connection) {
  logInfo('Récupération des images utilisées dans la DB...');
  
  const usedImages = new Set();
  
  try {
    // Portfolio projects
    const [portfolioProjects] = await connection.query('SELECT image FROM portfolio_projects WHERE image IS NOT NULL');
    portfolioProjects.forEach(row => {
      if (row.image) {
        const filename = path.basename(row.image);
        usedImages.add(filename);
      }
    });
    logInfo(`  • ${portfolioProjects.length} images dans portfolio_projects`);
    
    // Projects
    const [projects] = await connection.query('SELECT image FROM projects WHERE image IS NOT NULL');
    projects.forEach(row => {
      if (row.image) {
        const filename = path.basename(row.image);
        usedImages.add(filename);
      }
    });
    logInfo(`  • ${projects.length} images dans projects`);
    
    // Blogs
    const [blogs] = await connection.query('SELECT image FROM blogs WHERE image IS NOT NULL');
    blogs.forEach(row => {
      if (row.image) {
        const filename = path.basename(row.image);
        usedImages.add(filename);
      }
    });
    logInfo(`  • ${blogs.length} images dans blogs`);
    
    // Clients (logo)
    const [clients] = await connection.query('SELECT logo FROM clients WHERE logo IS NOT NULL');
    clients.forEach(row => {
      if (row.logo) {
        const filename = path.basename(row.logo);
        usedImages.add(filename);
      }
    });
    logInfo(`  • ${clients.length} logos dans clients`);
    
    // Testimonials (avatar)
    const [testimonials] = await connection.query('SELECT avatar FROM testimonials WHERE avatar IS NOT NULL');
    testimonials.forEach(row => {
      if (row.avatar) {
        const filename = path.basename(row.avatar);
        usedImages.add(filename);
      }
    });
    logInfo(`  • ${testimonials.length} avatars dans testimonials`);
    
    // Personal info (avatar + cv)
    const [personalInfo] = await connection.query('SELECT avatar, cv_file FROM personal_info WHERE id = 1');
    if (personalInfo.length > 0) {
      if (personalInfo[0].avatar) {
        const filename = path.basename(personalInfo[0].avatar);
        usedImages.add(filename);
      }
      if (personalInfo[0].cv) {
        const filename = path.basename(personalInfo[0].cv);
        usedImages.add(filename);
      }
      logInfo(`  • Avatar et CV dans personal_info`);
    }
    
    logSuccess(`${usedImages.size} fichiers uniques utilisés dans la DB`);
    return usedImages;
    
  } catch (error) {
    logError(`Erreur lors de la récupération des images: ${error.message}`);
    throw error;
  }
}

// ============================================
// 🗑️ SUPPRIMER LES FICHIERS NON UTILISÉS
// ============================================

async function deleteUnusedFiles(files, usedImages, dryRun = true) {
  logSection(dryRun ? '🔍 MODE SIMULATION (DRY RUN)' : '🗑️ SUPPRESSION DES FICHIERS');
  
  const unusedFiles = files.filter(file => !usedImages.has(file.filename));
  
  if (unusedFiles.length === 0) {
    logSuccess('Aucun fichier inutilisé trouvé ! 🎉');
    return { deleted: 0, totalSize: 0 };
  }
  
  logWarning(`${unusedFiles.length} fichiers inutilisés trouvés :`);
  console.log('');
  
  let totalSize = 0;
  let deleted = 0;
  
  for (const file of unusedFiles) {
    try {
      const stats = await fs.stat(file.fullPath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      totalSize += stats.size;
      
      const relPath = path.relative('.', file.fullPath);
      
      if (dryRun) {
        console.log(`  ${colors.yellow}🗑️  ${relPath}${colors.reset} ${colors.cyan}(${sizeKB} KB)${colors.reset}`);
      } else {
        await fs.unlink(file.fullPath);
        deleted++;
        console.log(`  ${colors.red}❌ SUPPRIMÉ: ${relPath}${colors.reset} ${colors.cyan}(${sizeKB} KB)${colors.reset}`);
      }
    } catch (error) {
      logError(`Erreur avec ${file.filename}: ${error.message}`);
    }
  }
  
  console.log('');
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  
  if (dryRun) {
    logInfo(`Espace qui serait libéré: ${totalSizeMB} MB`);
    logWarning('Utilisez --delete pour supprimer réellement les fichiers');
  } else {
    logSuccess(`${deleted} fichiers supprimés`);
    logSuccess(`Espace libéré: ${totalSizeMB} MB`);
  }
  
  return { deleted, totalSize };
}

// ============================================
// 📊 STATISTIQUES
// ============================================

function displayStats(totalFiles, usedImages, unusedCount) {
  logSection('📊 STATISTIQUES');
  
  const usedCount = usedImages.size;
  const usedPercent = ((usedCount / totalFiles) * 100).toFixed(1);
  const unusedPercent = ((unusedCount / totalFiles) * 100).toFixed(1);
  
  console.log(`  Total de fichiers:        ${colors.cyan}${totalFiles}${colors.reset}`);
  console.log(`  Fichiers utilisés:        ${colors.green}${usedCount}${colors.reset} (${usedPercent}%)`);
  console.log(`  Fichiers inutilisés:      ${colors.red}${unusedCount}${colors.reset} (${unusedPercent}%)`);
  console.log('');
}

// ============================================
// 🔒 FICHIERS À PROTÉGER
// ============================================

const PROTECTED_FILES = [
  'icon.ico',
  'logo.png',
  'logo.svg',
  'madebyfullann.svg',
  'icon-quote.svg',
  'placeholder.png',
  'default-avatar.png'
];

function isProtectedFile(filename) {
  return PROTECTED_FILES.some(protectedFile => 
    filename.toLowerCase().includes(protectedFile.toLowerCase())
  );
}
// ============================================
// 🚀 FONCTION PRINCIPALE
// ============================================

async function main() {
  console.log('\n' + colors.bright + colors.cyan);
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   🗑️  NETTOYAGE DES IMAGES NON UTILISÉES - v1.0          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  // Vérifier les arguments
  const args = process.argv.slice(2);
  const shouldDelete = args.includes('--delete') || args.includes('-d');
  const forceDelete = args.includes('--force') || args.includes('-f');
  
  if (shouldDelete) {
    logWarning('MODE SUPPRESSION ACTIVÉ !');
    if (!forceDelete) {
      logInfo('Utilisez --force pour confirmer la suppression');
      process.exit(0);
    }
  } else {
    logInfo('MODE SIMULATION (dry run)');
    logInfo('Aucun fichier ne sera supprimé');
  }
  
  console.log('');
  
  let connection;
  
  try {
    // Connexion à la DB
    logInfo('Connexion à la base de données...');
    connection = await mysql.createConnection(DB_CONFIG);
    logSuccess('Connecté à la DB');
    
    // Scanner les fichiers
    let allFiles = await getAllFiles();
    
    // Filtrer les fichiers protégés
    const protectedCount = allFiles.filter(f => isProtectedFile(f.filename)).length;
    allFiles = allFiles.filter(f => !isProtectedFile(f.filename));
    
    if (protectedCount > 0) {
      logInfo(`${protectedCount} fichiers protégés ignorés`);
    }
    
    // Récupérer les images utilisées
    const usedImages = await getUsedImages(connection);
    
    // Calculer les fichiers inutilisés
    const unusedFiles = allFiles.filter(file => !usedImages.has(file.filename));
    
    // Afficher les stats
    displayStats(allFiles.length, usedImages, unusedFiles.length);
    
    // Supprimer ou simuler
    const result = await deleteUnusedFiles(allFiles, usedImages, !shouldDelete || !forceDelete);
    
    // Résumé final
    if (!shouldDelete || !forceDelete) {
      logSection('💡 INSTRUCTIONS');
      logInfo('Pour supprimer réellement les fichiers, exécutez:');
      console.log(`\n  ${colors.bright}node cleanup-images.js --delete --force${colors.reset}\n`);
    } else {
      logSection('✅ NETTOYAGE TERMINÉ');
      logSuccess('Toutes les images inutilisées ont été supprimées !');
    }
    
  } catch (error) {
    logError(`Erreur: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Afficher l'aide
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
${colors.bright}Usage:${colors.reset}
  node cleanup-images.js [options]

${colors.bright}Options:${colors.reset}
  --help, -h          Afficher cette aide
  --delete, -d        Activer le mode suppression (nécessite --force)
  --force, -f         Confirmer la suppression
  
${colors.bright}Exemples:${colors.reset}
  ${colors.cyan}node cleanup-images.js${colors.reset}
    → Simuler le nettoyage (aucune suppression)
  
  ${colors.cyan}node cleanup-images.js --delete --force${colors.reset}
    → Supprimer réellement les fichiers inutilisés
  
${colors.bright}Fichiers protégés (jamais supprimés):${colors.reset}
  ${PROTECTED_FILES.map(f => `• ${f}`).join('\n  ')}
`);
  process.exit(0);
}

// Lancer le script
main().catch(error => {
  logError(`Erreur fatale: ${error.message}`);
  console.error(error);
  process.exit(1);
});
