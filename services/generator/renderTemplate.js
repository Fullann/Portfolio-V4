const ejs = require('ejs');
const path = require('path');

/**
 * Génère la chaîne HTML finale à l'aide du moteur de template EJS.
 * @param {Object} data - Les données formatées prêtes à être injectées dans le template.
 * @returns {Promise<string>} Le HTML généré.
 */
async function renderHtmlTemplate(data) {
  const templatePath = path.join(__dirname, '..', '..', 'views', 'index.ejs');
  
  // Rendre le fichier avec EJS
  // ejs.renderFile prend le chemin du fichier, les données et des options (optionnelles)
  return new Promise((resolve, reject) => {
    ejs.renderFile(templatePath, data, {}, (err, str) => {
      if (err) {
        reject(err);
      } else {
        resolve(str);
      }
    });
  });
}

module.exports = { renderHtmlTemplate };
