const multer = require('multer');
const path = require('path');

// Configuration du stockage pour les images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'cv') {
      cb(null, 'public/assets/documents/');
    } else {
      cb(null, 'public/assets/images/');
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    if (file.fieldname === 'cv') {
      cb(null, 'cv-' + uniqueSuffix + '.pdf');
    } else {
      cb(null, file.fieldname + '-' + uniqueSuffix);
    }
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'cv') {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Seuls les fichiers PDF sont acceptés pour le CV'));
      }
    } else {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Seules les images sont acceptées'));
      }
    }
  }
});

module.exports = upload;
