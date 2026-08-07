'use strict';

/**
 * CloudLinux LVE - Compatibilité WASM pour Node.js 20+
 *
 * Node 20+ utilise undici (client HTTP interne) pour fournir le global fetch().
 * undici initialise son parser HTTP (llhttp) via WebAssembly au démarrage.
 * Sur les hébergements CloudLinux (PlanetHoster, o2switch...), l'allocation
 * mémoire WebAssembly est bloquée par les limites LVE du noyau.
 *
 * Stratégie :
 *   1. Intercepter le rejet non géré venant de l'init WASM d'undici → ne pas crasher
 *   2. Supprimer globalThis.fetch() → aucune librairie ne peut déclencher undici
 *   3. Express, axios, mysql2 utilisent le module http natif de Node → pas d'impact
 */

// ─── 1. Supprimer le rejet WASM non géré ─────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  const msg = (reason && reason.message) ? reason.message : String(reason || '');

  const isWasmFailure =
    (reason instanceof RangeError && msg.includes('Wasm')) ||
    msg.includes('Cannot allocate Wasm memory') ||
    msg.includes('[compat] WebAssembly');

  if (isWasmFailure) {
    process.stderr.write(
      '[compat] Initialisation WASM supprimée (CloudLinux LVE) — ' +
      "L'app utilise le module http natif, aucun impact fonctionnel.\n"
    );
    return; // ← NE PAS throw → le process continue normalement
  }

  // Tous les autres rejets non gérés → comportement par défaut (crash)
  process.stderr.write(`[FATAL] Unhandled rejection: ${msg}\n`);
  process.exit(1);
});

// ─── 2. Supprimer fetch() global pour éviter tout déclenchement d'undici ─────
try {
  delete globalThis.fetch;
  delete globalThis.Headers;
  delete globalThis.Request;
  delete globalThis.Response;
} catch (_) {
  // Non critique — certains environnements ne permettent pas la suppression
}

process.stdout.write('[compat] Mode compatibilité CloudLinux LVE actif\n');
