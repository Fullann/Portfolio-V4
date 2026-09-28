/**
 * Utilitaire pour normaliser et convertir les liens d'images GitHub.
 * 
 * GitHub stocke les fichiers dans des vues web (/blob/) qui retournent du HTML.
 * Pour afficher une image dans une balise <img> ou du Markdown, l'URL doit pointer
 * vers le contenu brut (raw.githubusercontent.com ou /raw/).
 */

/**
 * Convertit une URL GitHub (blob ou page de dépôt) en lien direct vers l'image brute.
 * Exemples gérés :
 * - https://github.com/user/repo/blob/main/path/to/img.png
 *   -> https://raw.githubusercontent.com/user/repo/main/path/to/img.png
 * - https://github.com/user/repo/blob/master/path/to/img.png?raw=true
 *   -> https://raw.githubusercontent.com/user/repo/master/path/to/img.png
 * - https://github.com/user/repo/raw/main/path/to/img.png
 *   -> https://raw.githubusercontent.com/user/repo/main/path/to/img.png
 * - https://raw.githubusercontent.com/user/repo/main/path/to/img.png (inchangé)
 *
 * @param {string} url - L'URL à normaliser
 * @returns {string} L'URL directe de l'image
 */
function normalizeGitHubUrl(url) {
  if (!url || typeof url !== 'string') return url;
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  // 1. Détection URL GitHub type blob ou raw sur github.com
  // Format : https://github.com/:owner/:repo/(blob|raw)/:branchAndPath
  const githubBlobRegex = /^https?:\/\/github\.com\/([^/\s]+)\/([^/\s]+)\/(?:blob|raw)\/(.+)$/i;
  const match = trimmed.match(githubBlobRegex);

  if (match) {
    const owner = match[1];
    const repo = match[2];
    // Nettoyer d'éventuels paramètres d'URL (?raw=true, #hash, etc.)
    const cleanPath = match[3].split('?')[0].split('#')[0];
    return `https://raw.githubusercontent.com/${owner}/${repo}/${cleanPath}`;
  }

  // 2. Détection GitHub avec paramètre ?raw=true direct sur un autre lien github.com
  if (trimmed.includes('github.com') && trimmed.includes('?raw=true')) {
    const withoutQuery = trimmed.replace(/\?raw=true/gi, '');
    const m = withoutQuery.match(/^https?:\/\/github\.com\/([^/\s]+)\/([^/\s]+)\/(?:blob|raw)\/(.+)$/i);
    if (m) {
      return `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}`;
    }
  }

  // Si l'URL est déjà brute ou provient d'un autre hébergeur, la retourner telle quelle
  return trimmed;
}

/**
 * Analyse un texte Markdown ou HTML et remplace tous les liens d'images GitHub
 * (syntaxe ![alt](url) ou <img src="url"> ou URLs brutes) par leurs équivalents directs.
 *
 * @param {string} content - Le contenu Markdown ou HTML
 * @returns {string} Le contenu avec les URLs d'images GitHub normalisées
 */
function normalizeGitHubUrlsInMarkdown(content) {
  if (!content || typeof content !== 'string') return content;

  // Remplace toutes les URLs GitHub /blob/ ou /raw/ par raw.githubusercontent.com
  return content.replace(
    /https?:\/\/github\.com\/([^/\s"')]+)\/([^/\s"')]+)\/(?:blob|raw)\/([^/\s"')]+(?:\/[^\s"')]+)*)/gi,
    (fullMatch, owner, repo, rest) => {
      const cleanRest = rest.split('?')[0].split('#')[0];
      return `https://raw.githubusercontent.com/${owner}/${repo}/${cleanRest}`;
    }
  );
}

/**
 * Vérifie si une chaîne est une URL GitHub d'image
 * @param {string} url
 * @returns {boolean}
 */
function isGitHubImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return /github\.com|raw\.githubusercontent\.com/i.test(url);
}

module.exports = {
  normalizeGitHubUrl,
  normalizeGitHubUrlsInMarkdown,
  isGitHubImageUrl
};
