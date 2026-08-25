/**
 * Génère un slug URL-safe à partir d'une chaîne.
 * @param {string} str - La chaîne à convertir
 * @returns {string} Le slug généré
 */
function toSlug(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')                      // décompose les accents
    .replace(/[\u0300-\u036f]/g, '')       // supprime les diacritiques
    .replace(/[^a-z0-9]+/g, '-')          // remplace non-alphanum par tiret
    .replace(/(^-|-$)/g, '');             // supprime tirets de début/fin
}

module.exports = { toSlug };
