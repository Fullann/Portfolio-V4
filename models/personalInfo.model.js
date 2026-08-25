const { pool, safeUpdate } = require('../config/dbPool');

const personalInfoModel = {
  get: async () => {
    const [rows] = await pool.execute(
      "SELECT * FROM personal_info WHERE id = 1"
    );
    return rows[0];
  },
  update: async (data) => {
    await safeUpdate("personal_info", 1, data, {
      name: "name",
      title: "title",
      email: "email",
      phone: "phone",
      birthday: "birthday",
      location: "location",
      avatar: "avatar",
      aboutText: "about_text",
      cvFile: "cv_file"
    });
    return personalInfoModel.get();
  },
  getTranslations: async () => {
    const [rows] = await pool.execute(
      "SELECT lang_code, translation_key, translation_value FROM translations WHERE translation_key LIKE 'personal_%'"
    );
    
    const translations = {};
    rows.forEach(r => {
      const field = r.translation_key.replace('personal_', ''); // title, about_text, cv_file
      if (!translations[r.lang_code]) translations[r.lang_code] = {};
      translations[r.lang_code][field] = r.translation_value;
    });
    return translations;
  },
  updateTranslations: async (translationsObj) => {
    for (const [lang, fields] of Object.entries(translationsObj)) {
      for (const [field, value] of Object.entries(fields)) {
        if (value === undefined || value === null) continue;
        const key = `personal_${field}`;
        await pool.execute(
          `INSERT INTO translations (lang_code, translation_key, translation_value)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE translation_value = VALUES(translation_value)`,
          [lang, key, value]
        );
      }
    }
  }
};

module.exports = personalInfoModel;
