#!/usr/bin/env node
/* Salin Three.js dari node_modules ke js/vendor/three/ untuk preview lokal.
   Folder hasil salinan diabaikan Git (.gitignore); build production
   menyalin sendiri langsung ke dist/. */

import { ROOT } from './lib/legacy.mjs';
import { syncThreeVendor } from './lib/vendor.mjs';

try {
  const { version } = syncThreeVendor(ROOT);
  console.log(`✔ js/vendor/three siap (three ${version})`);
} catch (err) {
  console.error('✖ ' + err.message);
  process.exit(1);
}
