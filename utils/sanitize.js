/**
 * Utilitaires de sanitization pour éviter les injections XSS.
 * À appliquer sur TOUTE donnée utilisateur interpolée dans du HTML brut.
 */

/**
 * Échappe les caractères HTML dangereux.
 * @param {string} str - La chaîne à échapper
 * @returns {string} La chaîne échappée
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

module.exports = { escapeHtml };
