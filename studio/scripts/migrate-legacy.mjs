import path from 'node:path';
import {ROOT,loadLegacyRecords,recordToPublicWork} from '../../scripts/lib/legacy.mjs';
import {loadDotEnv} from '../../scripts/lib/env.mjs';
import {validateWorks} from '../../scripts/build.mjs';
import {assetPath,migrateRecords} from './migration-core.mjs';

try {
  const args=process.argv.slice(2);
  if(args.some(a=>a!=='--apply'))throw new Error('Argumen yang tersedia hanya --apply. Tanpa argumen = pemeriksaan lokal.');
  const records=loadLegacyRecords();
  const checked=validateWorks(records.map(recordToPublicWork));
  if(checked.errors.length)throw new Error(checked.errors.join('\n'));
  for(const r of records) {
    if(r.thumbnailPath)assetPath(r.thumbnailPath);
    if(r.videoPath)assetPath(r.videoPath);
  }
  console.log(`${records.length} karya; ${records.filter(r=>r.dateIsPlaceholder).length} tanggal sementara 14 April 2025.`);
  if(!args.includes('--apply')) {
    console.log('DRY RUN lokal: aset dan data diperiksa; belum menghubungi Sanity. --apply akan mengunggah aset dan membuat DRAFT saja.');
  } else {
    loadDotEnv(path.join(ROOT,'.env'));
    const projectId=process.env.SANITY_PROJECT_ID;
    const token=process.env.SANITY_WRITE_TOKEN;
    if(!projectId || projectId==='your_project_id' || !token)throw new Error('Isi SANITY_PROJECT_ID dan SANITY_WRITE_TOKEN di .env untuk migrasi.');
    const {createClient}=await import('@sanity/client');
    const client=createClient({projectId,dataset:process.env.SANITY_DATASET||'production',token,apiVersion:'2025-02-19',useCdn:false,perspective:'raw'});
    const result=await migrateRecords(records,client);
    console.log(`Selesai: ${result.created} draft dibuat; ${result.skipped} karya yang sudah ada dilewati tanpa perubahan. Periksa dan publish di Studio.`);
  }
} catch(error) { console.error('MIGRASI GAGAL: '+error.message);process.exitCode=1; }

