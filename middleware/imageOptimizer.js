const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Fonction d'optimisation automatique des images
async function optimizeImage(inputPath, outputPath, options = {}) {
  try {
    const { width = 1920, height = 1080, quality = 80, format = 'webp' } = options;

    let sharpInstance = sharp(inputPath);
    sharpInstance = sharpInstance.resize(width, height, {
      fit: 'inside',
      withoutEnlargement: true
    });

    if (format === 'webp') {
      sharpInstance = sharpInstance.webp({ quality });
    } else if (format === 'jpeg' || format === 'jpg') {
      sharpInstance = sharpInstance.jpeg({ quality });
    } else if (format === 'png') {
      sharpInstance = sharpInstance.png({ quality: Math.round(quality / 10) });
    }

    await sharpInstance.toFile(outputPath);

    const originalStats = fs.statSync(inputPath);
    const optimizedStats = fs.statSync(outputPath);
    const originalSize = (originalStats.size / 1024).toFixed(2);
    const optimizedSize = (optimizedStats.size / 1024).toFixed(2);
    const savings = (((originalSize - optimizedSize) / originalSize) * 100).toFixed(1);

    console.log(`✅ Image optimisée: ${path.basename(inputPath)} -> ${path.basename(outputPath)} (${originalSize}KB -> ${optimizedSize}KB, -${savings}%)`);

    return { success: true, originalSize, optimizedSize, savings, outputPath };
  } catch (error) {
    console.error('❌ Erreur lors de l\'optimisation:', error);
    return { success: false, error: error.message };
  }
}

// Traiter un fichier individuel
async function processSingleFile(fileObj) {
  if (!fileObj || fileObj.fieldname === 'cv') {
    return;
  }
  const isImage = /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(fileObj.filename || fileObj.originalname || '');
  if (!isImage) {
    return;
  }

  const originalPath = fileObj.path;
  const fileName = path.parse(fileObj.filename).name;
  const outputPath = path.join(fileObj.destination, `${fileName}.webp`);

  let optimizationOptions = { format: 'webp', quality: 85 };

  if (fileObj.fieldname === 'image' || fileObj.fieldname === 'logo') {
    optimizationOptions = { ...optimizationOptions, width: 800, height: 600 };
  } else if (fileObj.fieldname === 'avatar') {
    optimizationOptions = { ...optimizationOptions, width: 300, height: 300 };
  }

  const result = await optimizeImage(originalPath, outputPath, optimizationOptions);

  if (result.success) {
    if (fs.existsSync(originalPath) && originalPath !== outputPath) {
      try {
        fs.unlinkSync(originalPath);
      } catch (e) {
        // Ignorer erreur suppression temporaire
      }
    }
    fileObj.path = outputPath;
    fileObj.filename = `${fileName}.webp`;
    fileObj.optimized = true;
    fileObj.optimizationStats = {
      originalSize: result.originalSize,
      optimizedSize: result.optimizedSize,
      savings: result.savings
    };
  }
}

// Middleware d'optimisation pour multer (gère req.file et req.files)
const optimizeUploadedImage = async (req, res, next) => {
  try {
    if (req.file) {
      await processSingleFile(req.file);
    } else if (req.files) {
      if (Array.isArray(req.files)) {
        for (const f of req.files) {
          await processSingleFile(f);
        }
      } else if (typeof req.files === 'object') {
        for (const key of Object.keys(req.files)) {
          const filesArr = req.files[key];
          if (Array.isArray(filesArr)) {
            for (const f of filesArr) {
              await processSingleFile(f);
            }
          }
        }
      }
    }
    next();
  } catch (error) {
    console.error('Erreur lors de l\'optimisation de l\'upload:', error);
    next();
  }
};

module.exports = {
  optimizeImage,
  optimizeUploadedImage
};
