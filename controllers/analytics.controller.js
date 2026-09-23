const catchAsync = require("../utils/catchAsync");
const { dbOperations } = require('../config/database');

/**
 * Enregistrement anonyme d'événements (page view, CV download, project click)
 * Respectueux de la vie privée (pas de cookies, pas d'IP enregistrée).
 */
exports.trackEvent = catchAsync(async (req, res, next) => {
  const { type, target } = req.body || {};
  await dbOperations.analytics.trackEvent(type || 'page_view', target || '');
  res.json({ success: true });
});

/**
 * Récupération des statistiques agrégées pour le tableau de bord admin.
 */
exports.getDashboardStats = catchAsync(async (req, res, next) => {
  const stats = await dbOperations.analytics.getDashboardStats();
  res.json(stats);
});
