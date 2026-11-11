const catchAsync = require("../utils/catchAsync");
const { dbOperations } = require('../config/database');

/**
 * Enregistrement anonyme d'événements (page view, CV download, project click)
 * Respectueux de la vie privée (pas de cookies, pas d'IP enregistrée).
 */
const VALID_EVENT_TYPES = ['page_view', 'cv_download', 'project_click', 'blog_view'];

exports.trackEvent = catchAsync(async (req, res, _next) => {
  const { type = 'page_view', target = '' } = req.body || {};
  if (!VALID_EVENT_TYPES.includes(type)) {
    return res.status(400).json({ error: 'Type d\'événement invalide' });
  }
  await dbOperations.analytics.trackEvent(type, String(target || '').slice(0, 255));
  res.json({ success: true });
});

/**
 * Récupération des statistiques agrégées pour le tableau de bord admin.
 */
exports.getDashboardStats = catchAsync(async (req, res, _next) => {
  const stats = await dbOperations.analytics.getDashboardStats();
  res.json(stats);
});
