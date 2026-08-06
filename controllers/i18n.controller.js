const { dbOperations } = require('../config/database');

exports.getLanguages = async (req, res) => {
  try {
    const languages = await dbOperations.i18n.getActiveLanguages();
    res.json(languages);
  } catch (error) {
    console.error('Erreur i18n getLanguages:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des langues' });
  }
};

exports.getAllLanguages = async (req, res) => {
  try {
    const languages = await dbOperations.i18n.getAllLanguages();
    res.json(languages);
  } catch (error) {
    console.error('Erreur i18n getAllLanguages:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des langues' });
  }
};

exports.getTranslations = async (req, res) => {
  try {
    const { lang } = req.params;
    const translations = await dbOperations.i18n.getTranslations(lang);
    res.json(translations);
  } catch (error) {
    console.error('Erreur i18n getTranslations:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des traductions' });
  }
};

exports.updateTranslations = async (req, res) => {
  try {
    const { lang } = req.params;
    const translationsObj = req.body;

    if (!translationsObj || typeof translationsObj !== 'object') {
      return res.status(400).json({ error: 'Données de traduction invalides' });
    }

    const updated = await dbOperations.i18n.updateTranslations(lang, translationsObj);
    res.json({ success: true, translations: updated });
  } catch (error) {
    console.error('Erreur i18n updateTranslations:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des traductions' });
  }
};

exports.toggleLanguage = async (req, res) => {
  try {
    const { code, isActive } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Code langue requis' });
    }

    const languages = await dbOperations.i18n.toggleLanguageActive(code, Boolean(isActive));
    res.json({ success: true, languages });
  } catch (error) {
    console.error('Erreur i18n toggleLanguage:', error);
    res.status(500).json({ error: 'Erreur lors de la modification de la langue' });
  }
};
