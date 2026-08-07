'use strict';

/**
 * CloudLinux LVE - Compatibilité WebAssembly
 *
 * Sur les hébergements CloudLinux (o2switch, PlanetHoster, etc.), la mémoire
 * WebAssembly est bloquée au niveau kernel. Ce script installe un shim minimal
 * avant que undici (le client HTTP interne de Node 20) ne tente de charger
 * son parser HTTP compilé en WASM (llhttp).
 *
 * Avec --jitless, WebAssembly est retiré de V8. Ce shim le redeffinit en JS pur
 * afin que undici détecte proprement l'indisponibilité et bascule sur son
 * implémentation JS de secours (llhttp-wasm.js / llhttp.js).
 */

if (typeof WebAssembly === 'undefined') {
  global.WebAssembly = {
    compile: () =>
      Promise.reject(
        new Error('[compat] WebAssembly indisponible (mode --jitless / CloudLinux LVE)')
      ),
    compileStreaming: () =>
      Promise.reject(
        new Error('[compat] WebAssembly indisponible (mode --jitless / CloudLinux LVE)')
      ),
    instantiate: () =>
      Promise.reject(
        new Error('[compat] WebAssembly indisponible (mode --jitless / CloudLinux LVE)')
      ),
    instantiateStreaming: () =>
      Promise.reject(
        new Error('[compat] WebAssembly indisponible (mode --jitless / CloudLinux LVE)')
      ),
    validate: () => false,
    Module: class Module {
      constructor() {
        throw new Error('[compat] WebAssembly.Module indisponible');
      }
    },
    Instance: class Instance {
      constructor() {
        throw new Error('[compat] WebAssembly.Instance indisponible');
      }
    },
    Memory: class Memory {
      constructor() {
        throw new Error('[compat] WebAssembly.Memory indisponible');
      }
    },
    Table: class Table {
      constructor() {
        throw new Error('[compat] WebAssembly.Table indisponible');
      }
    },
    Global: class Global {
      constructor() {
        throw new Error('[compat] WebAssembly.Global indisponible');
      }
    },
    Tag: class Tag {
      constructor() {
        throw new Error('[compat] WebAssembly.Tag indisponible');
      }
    },
  };

  console.log('[compat] Shim WebAssembly installé pour la compatibilité CloudLinux LVE');
}
