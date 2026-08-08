const { dbOperations } = require('../config/database');
const { updateHtmlFile } = require('../services/htmlGenerator.service');
const { formatPersonalInfo } = require('../utils/formatters');

let lastUpdate = Date.now();

exports.getPersonalInfo = async (req, res) => {
  try {
    const personalInfo = await dbOperations.personalInfo.get();
    res.json(formatPersonalInfo(personalInfo));
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des informations personnelles' });
  }
};

exports.updatePersonalInfo = async (req, res) => {
  try {
    const { name, title, email, phone, birthday, location, aboutText } = req.body;

    lastUpdate = Date.now();

    const updateData = { name, title, email, phone, birthday, location };

    if (aboutText) {
      updateData.aboutText = aboutText;
    }

    if (req.files?.avatar) {
      updateData.avatar = `/assets/images/${req.files.avatar[0].filename}`;
    }
    if (req.files?.cv) {
      updateData.cvFile = `/assets/documents/${req.files.cv[0].filename}`;
    }

    const updatedInfo = await dbOperations.personalInfo.update(updateData);
    await updateHtmlFile();
    res.json(formatPersonalInfo(updatedInfo));
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des informations personnelles' });
  }
};

exports.downloadCV = async (req, res) => {
  try {
    const path = require('path');
    const personalInfo = await dbOperations.personalInfo.get();
    
    if (personalInfo && personalInfo.cv_file) {
      const docsDir = path.resolve(__dirname, '..', 'public', 'assets', 'documents');
      // On retire tout préfixe pour ne garder que le nom du fichier (sécurité supplémentaire)
      const fileName = path.basename(personalInfo.cv_file);
      const filePath = path.join(docsDir, fileName);
      
      // Vérification que le fichier résolu est bien dans le dossier autorisé
      if (!filePath.startsWith(docsDir)) {
        return res.status(403).json({ error: 'Accès interdit' });
      }

      res.download(filePath, 'CV.pdf');
    } else {
      res.status(404).json({ error: 'CV non trouvé' });
    }
  } catch (error) {
    console.error('Erreur téléchargement CV:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
