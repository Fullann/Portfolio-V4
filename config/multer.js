const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration du stockage pour les images et documents
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const destDir = file.fieldname.startsWith('cv')
      ? path.join(__dirname, '..', 'public', 'assets', 'documents')
      : path.join(__dirname, '..', 'public', 'assets', 'images');

    // S'assurer que le dossier existe sur le serveur (ex: o2switch)
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    cb(null, destDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    if (file.fieldname.startsWith('cv')) {
      cb(null, file.fieldname + '-' + uniqueSuffix + '.pdf');
    } else {
      cb(null, file.fieldname + '-' + uniqueSuffix);
    }
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
  fileFilter: (req, file, cb) => {
    if (file.fieldname.startsWith('cv')) {
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
