const { pool } = require('../config/dbPool');

const i18nModel = {
  getAllLanguages: async () => {
    const [rows] = await pool.execute("SELECT * FROM languages ORDER BY is_default DESC, code ASC");
    return rows;
  },

  getActiveLanguages: async () => {
    const [rows] = await pool.execute("SELECT * FROM languages WHERE is_active = 1 ORDER BY is_default DESC, code ASC");
    return rows;
  },

  getTranslations: async (langCode) => {
    // Exclure les clés se terminant par _content (ex: blogs) pour la performance du frontend public
    const [rows] = await pool.execute(
      "SELECT translation_key, translation_value FROM translations WHERE lang_code = ? AND translation_key NOT LIKE '%_content'", 
      [langCode]
    );
    const dictionary = {};
    rows.forEach(r => {
      dictionary[r.translation_key] = r.translation_value;
    });
    return dictionary;
  },
  
  // Nouvelle méthode pour récupérer TOUTES les traductions (pour l'admin)
  getAllTranslationsForAdmin: async (langCode) => {
    const [rows] = await pool.execute("SELECT translation_key, translation_value FROM translations WHERE lang_code = ?", [langCode]);
    const dictionary = {};
    rows.forEach(r => {
      dictionary[r.translation_key] = r.translation_value;
    });
    return dictionary;
  },

  updateTranslations: async (langCode, translationsObj) => {
    for (const [key, value] of Object.entries(translationsObj)) {
      await pool.execute(
        `INSERT INTO translations (lang_code, translation_key, translation_value)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE translation_value = VALUES(translation_value)`,
        [langCode, key, value]
      );
    }
    return i18nModel.getTranslations(langCode);
  },

  toggleLanguageActive: async (code, isActive) => {
    await pool.execute("UPDATE languages SET is_active = ? WHERE code = ?", [isActive ? 1 : 0, code]);
    return i18nModel.getAllLanguages();
  }
};

module.exports = i18nModel;
