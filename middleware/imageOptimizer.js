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

// Middleware d'optimisation pour multer
const optimizeUploadedImage = async (req, res, next) => {
  if (!req.file || req.file.fieldname === 'cv') {
    return next();
  }

  try {
    const originalPath = req.file.path;
    const fileName = path.parse(req.file.filename).name;
    const outputPath = path.join(req.file.destination, `${fileName}.webp`);

    let optimizationOptions = { format: 'webp', quality: 85 };

    if (req.file.fieldname === 'image' || req.file.fieldname === 'logo') {
      optimizationOptions = { ...optimizationOptions, width: 800, height: 600 };
    } else if (req.file.fieldname === 'avatar') {
      optimizationOptions = { ...optimizationOptions, width: 200, height: 200 };
    }

    const result = await optimizeImage(originalPath, outputPath, optimizationOptions);

    if (result.success) {
      fs.unlinkSync(originalPath);
      req.file.path = outputPath;
      req.file.filename = `${fileName}.webp`;
      req.file.optimized = true;
      req.file.optimizationStats = {
        originalSize: result.originalSize,
        optimizedSize: result.optimizedSize,
        savings: result.savings
      };
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
