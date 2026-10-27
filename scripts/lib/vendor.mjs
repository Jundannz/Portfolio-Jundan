/* ==========================================================================
   VENDOR THREE.JS
   Sumber kebenaran: dependency npm "three" (lihat package.json).
   Fungsi ini menyalin file ESM yang dibutuhkan browser + LICENSE ke
   <targetRoot>/js/vendor/three/. Dipakai oleh:
   - scripts/build.mjs  → dist/js/vendor/three (production)
   - scripts/vendor.mjs → js/vendor/three (preview lokal, otomatis via npm run dev)
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './legacy.mjs';

// three.module.js mengimpor './three.core.js', jadi keduanya wajib ada
export const THREE_FILES = ['build/three.module.js', 'build/three.core.js', 'LICENSE'];

export function syncThreeVendor(targetRoot) {
  const src = path.join(ROOT, 'node_modules', 'three');
  if (!fs.existsSync(path.join(src, 'package.json'))) {
    throw new Error('Dependency "three" belum terpasang. Jalankan: npm ci');
  }
  const version = JSON.parse(fs.readFileSync(path.join(src, 'package.json'), 'utf8')).version;
  const out = path.join(targetRoot, 'js', 'vendor', 'three');
  fs.mkdirSync(out, { recursive: true });
  for (const file of THREE_FILES) {
    fs.copyFileSync(path.join(src, file), path.join(out, path.basename(file)));
  }
  return { version, out };
}
