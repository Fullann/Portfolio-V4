const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function optimizeExistingImages() {
  const imagesDir = path.join(__dirname, '../public/assets/images');
  
  if (!fs.existsSync(imagesDir)) {
    console.error('Dossier d\'images non trouvé');
    return;
  }
  
  const files = fs.readdirSync(imagesDir);
  let processed = 0;
  let totalSavings = 0;
  console.log(files)
  console.log('🚀 Optimisation des images existantes...');
  
  for (const file of files) {
    if (file.match(/\.(jpg|jpeg|png)$/i) && !file.includes('optimized')) {
      const inputPath = path.join(imagesDir, file);
      const fileName = path.parse(file).name;
      const outputPath = path.join(imagesDir, `${fileName}.webp`);
      
      // Éviter de traiter si déjà optimisé
      if (fs.existsSync(outputPath)) {
        continue;
      }
      
      try {
        const originalStats = fs.statSync(inputPath);
        const originalSize = originalStats.size / 1024;
        
        await sharp(inputPath)
          .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 85 })
          .toFile(outputPath);
        
        const newStats = fs.statSync(outputPath);
        const newSize = newStats.size / 1024;
        const savings = ((originalSize - newSize) / originalSize * 100);
        
        console.log(`✅ ${file} -> ${fileName}.webp (${originalSize.toFixed(2)}KB -> ${newSize.toFixed(2)}KB, -${savings.toFixed(1)}%)`);
        
        processed++;
        totalSavings += savings;
        
        // Supprimer l'original (optionnel)
        // fs.unlinkSync(inputPath);
        
      } catch (error) {
        console.error(`❌ Erreur avec ${file}:`, error.message);
      }
    }
  }
  
  const averageSavings = processed > 0 ? (totalSavings / processed).toFixed(1) : 0;
  console.log(`\n🎉 Optimisation terminée! ${processed} images traitées, économie moyenne: ${averageSavings}%`);
}

optimizeExistingImages().catch(console.error);
