const { dbOperations } = require('../config/database');

// Liste des clés autorisées (whitelist)
const ALLOWED_KEYS = [
  'site_name',
  'site_description',
  'site_author',
  'base_url',
  'admin_email',
  'hcaptcha_sitekey',
  'hcaptcha_secret',
];

// Clés sensibles masquées dans les réponses GET
const SENSITIVE_KEYS = ['hcaptcha_secret'];

exports.getSettings = async (req, res) => {
  try {
    const settings = await dbOperations.settings.getAll();

    // Masquer les clés sensibles
    const safeSettings = { ...settings };
    for (const key of SENSITIVE_KEYS) {
      if (safeSettings[key]) {
        safeSettings[key] = '••••••••';
      }
    }

    res.json(safeSettings);
  } catch (error) {
    console.error('Erreur récupération settings:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const updates = req.body;

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Données invalides' });
    }

    // Filtrer uniquement les clés autorisées
    const filteredUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      if (ALLOWED_KEYS.includes(key)) {
        // Ne pas écraser un secret si la valeur est le masque
        if (SENSITIVE_KEYS.includes(key) && value === '••••••••') {
          continue;
        }
        filteredUpdates[key] = value;
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ error: 'Aucun paramètre valide à mettre à jour' });
    }

    await dbOperations.settings.setBulk(filteredUpdates);

    console.log(`✅ Settings mis à jour: ${Object.keys(filteredUpdates).join(', ')}`);

    res.json({
      success: true,
      message: 'Paramètres mis à jour avec succès',
      updated: Object.keys(filteredUpdates)
    });
  } catch (error) {
    console.error('Erreur mise à jour settings:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Route publique : retourner uniquement la sitekey hCaptcha (pas le secret)
exports.getHcaptchaSitekey = async (req, res) => {
  try {
    const sitekey = await dbOperations.settings.get('hcaptcha_sitekey');
    res.json({ sitekey: sitekey || '' });
  } catch (error) {
    console.error('Erreur récupération hCaptcha sitekey:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
