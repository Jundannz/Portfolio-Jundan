#!/usr/bin/env node
/* ==========================================================================
   BUILD DATA KARYA
   --------------------------------------------------------------------------
   Membuat data/works.json (satu-satunya sumber data karya untuk halaman
   publik) lalu, untuk target "dist", menyalin file situs ke folder dist/.

   Pemakaian:
     node scripts/build.mjs                         # Sanity → dist/ (production)
     node scripts/build.mjs --source=local --target=root
                                                    # data lama → ./data/works.json (dev)
     node scripts/build.mjs --source=fixture:31-mixed --target=root
                                                    # fixture tes → ./data/works.json

   Aturan keamanan:
   - Jika Sanity gagal, build GAGAL (exit 1). Tidak ada fallback diam-diam ke
     data lama, supaya karya yang sudah dihapus/unpublish tidak muncul lagi.
   - Sumber "local"/"fixture" ditolak saat berjalan di Vercel.
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { ROOT, loadLegacyRecords, recordToPublicWork } from './lib/legacy.mjs';
import { readSanityEnv, fetchPublishedWorks } from './lib/sanity-query.mjs';
import { loadDotEnv } from './lib/env.mjs';

const require = createRequire(import.meta.url);
const core = require('../js/works-core.js');

// File/folder situs publik yang disalin ke dist/. Folder lain (studio/,
// scripts/, tests/, node_modules/) dan js/works-data.js tidak ikut.
const SITE_FILES = ['index.html', 'works.html', 'project.html'];
const SITE_DIRS = ['css', 'assets'];
const SITE_JS = ['works-core.js', 'works-store.js', 'pages.js', 'script.js', 'dino.js'];

function parseArgs(argv) {
  const args = { source: 'sanity', target: 'dist' };
  for (const arg of argv) {
    const m = arg.match(/^--(source|target)=(.+)$/);
    if (m) args[m[1]] = m[2];
    else throw new Error('Argumen tidak dikenal: ' + arg);
  }
  if (!['dist', 'root'].includes(args.target)) throw new Error('--target harus "dist" atau "root"');
  return args;
}

/** Validasi ketat: data rusak membuat build gagal, bukan diam-diam dibuang. */
export function validateWorks(rawWorks) {
  const errors = [];
  const warnings = [];
  const seen = new Map();

  if (!Array.isArray(rawWorks)) return { errors: ['Daftar karya tidak valid'], warnings };
  rawWorks.forEach((raw, i) => {
    const label = `#${i + 1} (${raw && raw.slug ? raw.slug : 'tanpa slug'})`;
    if (!raw || typeof raw !== 'object') { errors.push(`${label}: data kosong`); return; }
    if (/^(drafts|versions)\./.test(raw.id || raw._id || '')) errors.push(`${label}: dokumen draft/version dilarang dalam output publik`);
    if (!raw.title || !String(raw.title).trim()) errors.push(`${label}: judul kosong`);
    if (!core.isValidSlug(raw.slug)) errors.push(`${label}: slug tidak valid`);
    else if (seen.has(raw.slug)) errors.push(`${label}: slug ganda dengan ${seen.get(raw.slug)}`);
    else seen.set(raw.slug, label);
    if (!core.isWorkCategory(raw.category)) errors.push(`${label}: kategori "${raw.category}" tidak dikenal`);
    if (raw.workDate && !core.isValidDate(raw.workDate)) errors.push(`${label}: workDate "${raw.workDate}" bukan tanggal YYYY-MM-DD`);
    if (!raw.workDate) warnings.push(`${label}: belum punya tanggal karya (ditaruh paling akhir saat sort tanggal)`);
    if (!raw.thumbnail || !raw.thumbnail.url) warnings.push(`${label}: belum punya thumbnail`);

    const work = core.normalizeWork(raw);
    if (work && work.media.invalidReason) warnings.push(`${label}: ${work.media.invalidReason}`);
    (Array.isArray(raw.links) ? raw.links : []).forEach((link, j) => {
      if (!link || !core.safeExternalUrl(link.url)) errors.push(`${label}: tautan ke-${j + 1} bukan URL http(s) yang valid`);
    });
  });

  // Slug lama tidak boleh bentrok dengan slug aktif karya lain
  rawWorks.forEach((raw) => {
    (raw && raw.previousSlugs || []).forEach((old) => {
      if (seen.has(old) && old !== raw.slug) {
        errors.push(`Slug lama "${old}" milik ${raw.slug} dipakai karya lain`);
      }
    });
  });

  return { errors, warnings };
}

async function loadSource(source) {
  const onVercel = Boolean(process.env.VERCEL);
  if (source !== 'sanity' && onVercel) {
    throw new Error(`Sumber "${source}" hanya untuk pengembangan lokal dan ditolak di Vercel.`);
  }

  if (source === 'sanity') {
    const env = readSanityEnv();
    const works = await fetchPublishedWorks(env);
    return { source: 'sanity', works };
  }
  if (source === 'local') {
    return { source: 'local', works: loadLegacyRecords().map(recordToPublicWork) };
  }
  const fixture = source.match(/^fixture:([a-z0-9-]+)$/);
  if (fixture) {
    const count = fixture[1].match(/^(0|1|15|16|30|31)-mixed$/);
    if (!count) throw new Error('Fixture tersedia: 0, 1, 15, 16, 30, 31 diikuti -mixed');
    const { fixture: generate } = await import('../tests/fixtures/generate.mjs');
    return { source: 'fixture', works: generate(Number(count[1])) };
  }
  throw new Error('Sumber tidak dikenal: ' + source);
}

function copyRecursive(from, to) {
  fs.cpSync(from, to, { recursive: true });
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  // Tulis ke file sementara lalu rename agar file lama tidak setengah tertimpa
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n');
  fs.renameSync(tmp, file);
}

async function main() {
  loadDotEnv(path.join(ROOT, '.env'));
  const args = parseArgs(process.argv.slice(2));

  const { source, works } = await loadSource(args.source);
  const { errors, warnings } = validateWorks(works);
  warnings.forEach((w) => console.warn('⚠ ' + w));
  if (errors.length) {
    errors.forEach((e) => console.error('✖ ' + e));
    throw new Error(`${errors.length} masalah data karya. Perbaiki di CMS lalu build ulang.`);
  }
  if (!works.length) console.warn('⚠ Tidak ada karya published. Galeri akan menampilkan kondisi kosong.');

  const publicFields = ['id','title','slug','category','description','tools','thumbnail','detailImage','mediaType','youtubeUrl','videoUrl','links','workDate','order','featured','previousSlugs'];
  const publicWorks = works.map(w => Object.fromEntries(publicFields.filter(k => w[k] !== undefined).map(k => [k,w[k]])));
  const payload = { source, generatedAt: new Date().toISOString(), works: publicWorks };

  if (args.target === 'root') {
    writeJson(path.join(ROOT, 'data', 'works.json'), payload);
    console.log(`✔ data/works.json ditulis (${works.length} karya, sumber: ${source})`);
    return;
  }

  // Target dist: bangun ke folder sementara, baru tukar ke dist/ bila sukses
  const outDir = path.join(ROOT, 'dist');
  const tmpDir = path.join(ROOT, '.dist-tmp');
  for (const directory of [outDir,tmpDir]) {
    if (path.dirname(directory) !== ROOT) throw new Error('Folder output di luar proyek');
  }
  fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(tmpDir, 'js'), { recursive: true });
  SITE_FILES.forEach((f) => fs.copyFileSync(path.join(ROOT, f), path.join(tmpDir, f)));
  SITE_DIRS.forEach((d) => copyRecursive(path.join(ROOT, d), path.join(tmpDir, d)));
  SITE_JS.forEach((f) => fs.copyFileSync(path.join(ROOT, 'js', f), path.join(tmpDir, 'js', f)));
  writeJson(path.join(tmpDir, 'data', 'works.json'), payload);

  fs.rmSync(outDir, { recursive: true, force: true });
  fs.renameSync(tmpDir, outDir);
  console.log(`✔ dist/ siap (${works.length} karya published, sumber: ${source})`);
}

const isDirectRun = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isDirectRun) {
  main().catch((err) => {
    console.error('\n✖ BUILD GAGAL: ' + err.message);
    console.error('  Website yang sedang live tidak berubah. Perubahan dari CMS BELUM tayang.');
    process.exit(1);
  });
}
