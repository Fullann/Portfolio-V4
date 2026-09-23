const { pool } = require('../config/dbPool');

const analyticsModel = {
  /**
   * Enregistre un événement anonyme agrégé par jour (100% privacy-friendly, pas d'IP ni cookie).
   */
  trackEvent: async (eventType, eventTarget = '') => {
    const validTypes = ['page_view', 'cv_download', 'project_click'];
    const type = validTypes.includes(eventType) ? eventType : 'page_view';
    const target = String(eventTarget).slice(0, 255);

    const [result] = await pool.execute(
      `INSERT INTO analytics_events (event_type, event_target, event_date, count)
       VALUES (?, ?, CURDATE(), 1)
       ON DUPLICATE KEY UPDATE count = count + 1`,
      [type, target]
    );

    return result;
  },

  /**
   * Récupère toutes les statistiques agrégées pour le tableau de bord admin.
   */
  getDashboardStats: async () => {
    // 1. Total des visites
    const [totalViewsRows] = await pool.execute(
      "SELECT COALESCE(SUM(count), 0) as total FROM analytics_events WHERE event_type = 'page_view'"
    );

    // 2. Visites des 7 derniers jours
    const [weekViewsRows] = await pool.execute(
      "SELECT COALESCE(SUM(count), 0) as total FROM analytics_events WHERE event_type = 'page_view' AND event_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)"
    );

    // 3. Téléchargements de CV
    const [cvDownloadsRows] = await pool.execute(
      "SELECT COALESCE(SUM(count), 0) as total FROM analytics_events WHERE event_type = 'cv_download'"
    );

    // 4. Clics totaux sur les projets
    const [projectClicksRows] = await pool.execute(
      "SELECT COALESCE(SUM(count), 0) as total FROM analytics_events WHERE event_type = 'project_click'"
    );

    // 5. Top 5 des projets les plus consultés
    const [topProjects] = await pool.execute(
      `SELECT event_target as project, SUM(count) as clicks
       FROM analytics_events
       WHERE event_type = 'project_click' AND event_target != ''
       GROUP BY event_target
       ORDER BY clicks DESC
       LIMIT 5`
    );

    // 6. Historique des vues sur les 7 derniers jours
    const [viewsHistory] = await pool.execute(
      `SELECT DATE_FORMAT(event_date, '%Y-%m-%d') as date, SUM(count) as views
       FROM analytics_events
       WHERE event_type = 'page_view' AND event_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY event_date
       ORDER BY event_date ASC`
    );

    return {
      totalViews: Number(totalViewsRows[0]?.total || 0),
      weekViews: Number(weekViewsRows[0]?.total || 0),
      cvDownloads: Number(cvDownloadsRows[0]?.total || 0),
      projectClicks: Number(projectClicksRows[0]?.total || 0),
      topProjects: topProjects.map(p => ({ project: p.project, clicks: Number(p.clicks) })),
      viewsHistory: viewsHistory.map(v => ({ date: v.date, views: Number(v.views) }))
    };
  },

  deleteAll: async () => {
    const [result] = await pool.execute("DELETE FROM analytics_events");
    return result;
  }
};

module.exports = analyticsModel;
