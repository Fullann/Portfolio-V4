/**
 * Convertit une valeur booléenne polymorphe en entier 0 ou 1.
 * Gère les cas : '1', 1, 'true', true → 1 ; tout le reste → 0
 * @param {*} val
 * @returns {0|1}
 */
function toBoolInt(val) {
  return val === '1' || val === 1 || val === 'true' || val === true ? 1 : 0;
}

/**
 * Débounce une fonction asynchrone : annule et replanifie si appelée avant
 * que le délai ne soit écoulé. Retourne une promesse qui se résout quand
 * la fonction est finalement exécutée.
 * @param {Function} fn - Fonction async à débouncer
 * @param {number} delayMs - Délai en millisecondes
 * @returns {Function} La fonction débouncée
 */
function debounceAsync(fn, delayMs) {
  let timer = null;
  let resolvePending = [];
  let rejectPending = [];

  return function (...args) {
    return new Promise((resolve, reject) => {
      resolvePending.push(resolve);
      rejectPending.push(reject);

      if (timer) clearTimeout(timer);

      timer = setTimeout(async () => {
        const resolvers = resolvePending;
        const rejectors = rejectPending;
        resolvePending = [];
        rejectPending = [];
        timer = null;

        try {
          const result = await fn.apply(this, args);
          resolvers.forEach(r => r(result));
        } catch (err) {
          rejectors.forEach(r => r(err));
        }
      }, delayMs);
    });
  };
}

module.exports = { toBoolInt, debounceAsync };
