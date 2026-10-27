/* ==========================================================================
   Membaca data lama js/works-data.js dan mengubahnya ke bentuk field CMS.
   Dipakai oleh:
   - scripts/build.mjs --source=local   (mode data lokal untuk pengembangan)
   - studio/scripts/migrate-legacy.mjs  (migrasi ke Sanity)
   File js/works-data.js TIDAK lagi dimuat oleh halaman publik.
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const LEGACY_FILE = path.join(ROOT, 'js', 'works-data.js');

// Tanggal placeholder yang ditentukan pemilik (BUKAN tanggal pembuatan karya)
export const PLACEHOLDER_DATE = '2025-04-14';

// Karya yang tampil di landing page lama (index.html, semua kategori).
// Saat migrasi, karya ini diberi featured = true.
export const LEGACY_FEATURED = [
  'different-mv-edit', 'pionir-gadjah-mada-2026-transition', 'logotype-jundannz',
  'thumbnail-early-bird', 'portfolio-website', 'airbnb-price-prediction',
  'jamet-mv-edit', 'hilang-pmv-edit', 'aint-it-fun-pmv-edit', '4ever-pmv-edit',
  'bazar-pamphlet', 'sca-banner', 'jundannz-banner', 'ayo-sandalan-banner',
  'mushroom-classification', 'library-management', 'tictactoe', 'rpg-game-system'
];

// Data lama yang meragukan → catatan internal untuk diperiksa pemilik
export const LEGACY_REVIEW_NOTES = {
  'sca-banner':
    'Tools "Jupyter Notebook, Python" disalin dari kartu landing page lama dan tampak tidak sesuai untuk karya desain. Mohon periksa.',
  'thumbnail-early-bird':
    'Kartu landing page lama (filter Design) menulis tools "After Effects", sedangkan data karya menulis "Illustrator". Mohon pastikan yang benar.'
};

export function loadLegacyWorks(file = LEGACY_FILE) {
  const code = fs.readFileSync(file, 'utf8');
  const sandbox = { window: {} };
  vm.runInNewContext(code, sandbox, { filename: file, timeout: 1000 });
  const works = sandbox.window.PORTFOLIO_WORKS;
  if (!Array.isArray(works)) throw new Error('js/works-data.js tidak berisi window.PORTFOLIO_WORKS');
  // Salin ke objek biasa (keluar dari konteks vm)
  return JSON.parse(JSON.stringify(works));
}

function isCalendarDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/**
 * Ubah satu karya lama ke bentuk field CMS (masih memakai path aset lokal).
 * `index` = urutan awal di works-data.js → dipakai untuk urutan curated.
 */
export function legacyToRecord(work, index) {
  const media = work.media || { type: 'image' };
  const hasDate = isCalendarDate(work.workDate);
  const record = {
    legacyId: work.slug,
    legacyIndex: index,
    title: work.title,
    slug: work.slug,
    category: work.category,
    description: work.description || '',
    tools: Array.isArray(work.tools) ? work.tools.slice() : [],
    thumbnailPath: work.thumbnail || null,
    thumbnailAlt: work.thumbnailAlt || work.title,
    mediaType: ['image', 'youtube', 'video'].includes(media.type) ? media.type : 'image',
    youtubeUrl: media.type === 'youtube' && media.youtubeId
      ? 'https://www.youtube.com/watch?v=' + media.youtubeId : null,
    videoPath: media.type === 'video' ? media.src || null : null,
    links: (work.links || []).map((l) => ({ label: l.label, url: l.url })),
    workDate: hasDate ? work.workDate : PLACEHOLDER_DATE,
    dateIsPlaceholder: !hasDate,
    featured: LEGACY_FEATURED.includes(work.slug),
    reviewNotes: LEGACY_REVIEW_NOTES[work.slug] || ''
  };
  return record;
}

export function loadLegacyRecords(file) {
  return loadLegacyWorks(file).map(legacyToRecord);
}

/** Bentuk publik (sama dengan hasil query Sanity) untuk mode data lokal. */
export function recordToPublicWork(record) {
  return {
    id: 'local-' + record.slug,
    title: record.title,
    slug: record.slug,
    category: record.category,
    description: record.description,
    tools: record.tools,
    thumbnail: record.thumbnailPath ? { url: record.thumbnailPath, alt: record.thumbnailAlt } : null,
    detailImage: null,
    mediaType: record.mediaType,
    youtubeUrl: record.youtubeUrl,
    videoUrl: record.videoPath,
    links: record.links,
    workDate: record.workDate,
    order: (record.legacyIndex + 1) * 10,
    featured: record.featured,
    previousSlugs: []
  };
}

