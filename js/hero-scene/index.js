/* ==========================================================================
   ENTRY HERO 3D (dimuat sebagai <script type="module">)
   --------------------------------------------------------------------------
   File ini kecil dan TIDAK mengimpor Three.js secara langsung. Three.js baru
   diunduh (import dinamis) jika:
     - layar ≥ 1025px (layout desktop). Tablet & mobile tetap memakai
       dekorasi lama karena di sana dekorasi berada di belakang teks,
     - WebGL tersedia.
   Judul/CTA tidak menunggu apa pun dari file ini.

   Status pada elemen .hero-visual (dipakai CSS):
     data-state="loading" → scene sedang disiapkan (fallback disembunyikan)
     data-state="ready"   → canvas tampil
     data-state="fallback"→ ilustrasi statis SVG (library/WebGL gagal)
     data-state="off"     → visual tidak dipakai (mobile)

   Debug/console: window.PortfolioHeroScene.reinit() / .dispose()
   ========================================================================== */

import { HERO_SCENE_CONFIG } from './config.js';

// Harus sama dengan css/hero-3d.css dan skrip kecil di <head> index.html
// (responsive-tablet.css berlaku sampai 1024px)
const MIN_WIDTH_QUERY = '(min-width: 1025px)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const container = document.querySelector('[data-hero-visual]');
let instance = null;
let generation = 0; // mencegah hasil import lama menimpa inisialisasi terbaru

function setState(state) {
  const root = document.documentElement;
  root.classList.remove('hero3d-pending');
  // Dekorasi lama disembunyikan hanya saat scene dimuat/tampil
  root.classList.toggle('hero3d-active', state === 'loading' || state === 'ready');
  if (container) container.dataset.state = state;
}

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

function dispose() {
  generation++;
  if (instance) {
    instance.dispose();
    instance = null;
  }
}

async function init() {
  dispose();
  const myGeneration = generation;
  if (!container) return;

  if (!window.matchMedia(MIN_WIDTH_QUERY).matches) { setState('off'); return; }
  if (!webglAvailable()) { setState('fallback'); return; }

  setState('loading');
  const staticMode = window.matchMedia(REDUCED_MOTION_QUERY).matches;
  container.dataset.motion = staticMode ? 'reduced' : 'full';

  try {
    const { createHeroScene } = await import('./scene.js');
    if (myGeneration !== generation) return; // sudah diganti inisialisasi lain
    instance = createHeroScene(container, HERO_SCENE_CONFIG, {
      staticMode,
      onFirstFrame: () => setState('ready'),
      onContextLost: () => { dispose(); setState('fallback'); }
    });
  } catch (error) {
    if (myGeneration !== generation) return;
    console.warn('[hero-3d] Scene tidak dapat dimuat, memakai ilustrasi statis.', error);
    dispose();
    setState('fallback');
  }
}

// Inisialisasi ulang saat breakpoint atau preferensi gerak berubah
[MIN_WIDTH_QUERY, REDUCED_MOTION_QUERY].forEach((q) => {
  const mq = window.matchMedia(q);
  if (mq.addEventListener) mq.addEventListener('change', () => init());
});

window.PortfolioHeroScene = { reinit: init, dispose: () => { dispose(); setState('off'); } };

init();
