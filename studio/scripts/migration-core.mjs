import fs from 'node:fs';
import path from 'node:path';
import {ROOT} from '../../scripts/lib/legacy.mjs';

export function assetPath(value) {
  if (!value || /^https?:\/\//i.test(value)) return null;
  const full = path.resolve(ROOT, value);
  const base = path.join(ROOT, 'assets') + path.sep;
  if (!full.startsWith(base) || !fs.statSync(full).isFile()) throw new Error('Aset lokal tidak valid: ' + value);
  return full;
}

export function documentFor(record, assets={}) {
  return {
    _id:'drafts.work-'+record.slug, _type:'work',
    legacyId:record.legacyId, title:record.title, slug:{_type:'slug',current:record.slug},
    category:record.category, description:record.description, tools:record.tools,
    workDate:record.workDate, dateIsPlaceholder:record.dateIsPlaceholder,
    manualOrder:(record.legacyIndex+1)*10, featured:record.featured,
    mediaType:record.mediaType, ...(record.youtubeUrl?{youtubeUrl:record.youtubeUrl}:{}),
    links:record.links.map((l,i)=>({...l,_type:'workLink',_key:'link-'+i})),
    reviewNotes:record.reviewNotes,
    ...(assets.thumbnail?{thumbnail:{_type:'image',asset:{_type:'reference',_ref:assets.thumbnail},alt:record.thumbnailAlt}}:{}),
    ...(assets.video?{videoFile:{_type:'file',asset:{_type:'reference',_ref:assets.video}}}:{}),
    ...(record.videoPath && /^https?:\/\//i.test(record.videoPath)?{videoUrl:record.videoPath}:{})
  };
}

export function alreadyMigrated(record, docs) {
  return docs.some(d=>[d._id?.replace(/^drafts\./,''),d.legacyId,d.slug?.current,...(d.previousSlugs||[])].some(v=>v===record.slug || v==='work-'+record.slug));
}

// Buat draft saja. Tidak pernah patch/replace dokumen CMS yang sudah ada.
export async function migrateRecords(records,client) {
  const existing = await client.fetch('*[_type == "work"]{_id,legacyId,slug,previousSlugs}',{}, {perspective:'raw'});
  const result={created:0,skipped:0};
  const uploads=new Map();
  async function upload(type,value) {
    if (!value) return undefined;
    if (uploads.has(value)) return uploads.get(value);
    const file=assetPath(value);
    if (!file) throw new Error('Thumbnail remote perlu diunggah manual: '+value);
    const asset=await client.assets.upload(type,fs.createReadStream(file),{filename:path.basename(file)});
    uploads.set(value,asset._id);
    return asset._id;
  }
  for (const record of records) {
    if (alreadyMigrated(record,existing)) {result.skipped++;continue;}
    const thumbnail=await upload('image',record.thumbnailPath);
    const video=record.videoPath&&!/^https?:\/\//i.test(record.videoPath)?await upload('file',record.videoPath):undefined;
    const doc=documentFor(record,{thumbnail,video});
    await client.createIfNotExists(doc);
    existing.push(doc);result.created++;
  }
  return result;
}

