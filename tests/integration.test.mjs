import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
import {validateWorks} from '../scripts/build.mjs';
import {fetchPublishedWorks,PUBLIC_WORKS_QUERY} from '../scripts/lib/sanity-query.mjs';
import {loadLegacyRecords,recordToPublicWork,ROOT} from '../scripts/lib/legacy.mjs';
import {documentFor,migrateRecords} from '../studio/scripts/migration-core.mjs';

test('18 karya dan seluruh referensi aset lama tetap valid',()=>{
 const records=loadLegacyRecords();assert.equal(records.length,18);
 assert.equal(validateWorks(records.map(recordToPublicWork)).errors.length,0);
 for(const r of records){assert.ok(fs.existsSync(path.join(ROOT,r.thumbnailPath)));assert.equal(r.workDate,'2025-04-14');}
});
test('query published, tanpa draft/version/internal, dan kegagalan tidak fallback',async()=>{
 let called;
 const result=await fetchPublishedWorks({projectId:'test',dataset:'production'},async(url,options)=>{
  called={url,options};return {ok:true,text:async()=>JSON.stringify({result:[]})};
 });
 assert.deepEqual(result,[]);assert.equal(called.url.searchParams.get('perspective'),'published');
 assert.match(PUBLIC_WORKS_QUERY,/drafts/);assert.match(PUBLIC_WORKS_QUERY,/versions/);
 assert.doesNotMatch(PUBLIC_WORKS_QUERY,/reviewNotes|dateIsPlaceholder|legacyId/);
 await assert.rejects(fetchPublishedWorks({projectId:'test',dataset:'production'},async()=>({ok:false,status:500,text:async()=>''})),/HTTP 500/);
 await assert.rejects(fetchPublishedWorks({projectId:'test',dataset:'production'},async()=>({ok:true,text:async()=>'not-json'})),/JSON/);
});
test('build menolak draft, duplikat dan local pada Vercel',()=>{
 const raw=recordToPublicWork(loadLegacyRecords()[0]);
 assert.ok(validateWorks([{...raw,id:'drafts.work-x'}]).errors.length);
 assert.ok(validateWorks([raw,raw]).errors.length);
 const out=spawnSync(process.execPath,['scripts/build.mjs','--source=local'],{cwd:ROOT,env:{...process.env,VERCEL:'1'},encoding:'utf8'});
 assert.notEqual(out.status,0);assert.match(out.stderr,/ditolak di Vercel/);
});
test('migrasi idempotent, draft baru saja, edit tanggal dan slug tidak tertimpa',async()=>{
 const records=loadLegacyRecords().slice(0,2);
 const existing=documentFor(records[0]);existing.workDate='2026-01-02';existing.slug.current='edited-slug';
 const docs=[existing];let uploads=0;
 const client={fetch:async()=>docs.slice(),assets:{upload:async(type,stream)=>{stream.destroy();uploads++;return {_id:'image-test'};}},createIfNotExists:async doc=>{if(!docs.some(d=>d._id===doc._id))docs.push(doc);}};
 assert.deepEqual(await migrateRecords(records,client),{created:1,skipped:1});
 assert.deepEqual(await migrateRecords(records,client),{created:0,skipped:2});
 assert.equal(uploads,1);assert.equal(docs[0].workDate,'2026-01-02');assert.equal(docs[0].slug.current,'edited-slug');
 assert.ok(docs.every(d=>d._id.startsWith('drafts.')));
});
test('store membedakan error dari kosong dan dapat retry',async()=>{
 let calls=0;
 const sandbox={window:{PortfolioWorksCore:{normalizeWorks:a=>a,isWorkCategory:()=>true}},document:{body:null},fetch:async()=>{calls++;if(calls===1)throw new Error('offline');return {ok:true,json:async()=>({source:'sanity',works:[]})};}};
 vm.runInNewContext(fs.readFileSync(path.join(ROOT,'js/works-store.js'),'utf8'),sandbox);
 await assert.rejects(sandbox.window.PortfolioWorksStore.load(),/offline/);
 assert.equal((await sandbox.window.PortfolioWorksStore.load()).works.length,0);assert.equal(calls,2);
});
test('hero 3D: semua modul ada di daftar build, allowlist server, dan import relatif valid',async()=>{
 const {HERO_SCENE_JS}=await import('../scripts/build.mjs');
 const dir=path.join(ROOT,'js/hero-scene');
 const files=fs.readdirSync(dir).filter(f=>f.endsWith('.js')).sort();
 assert.deepEqual([...HERO_SCENE_JS].sort(),files,'HERO_SCENE_JS harus mencakup semua file js/hero-scene');
 const serve=fs.readFileSync(path.join(ROOT,'scripts/serve.mjs'),'utf8');
 for(const f of files){
  assert.match(serve,new RegExp(f.replace('.js','').replace('-','\\-')),`serve.mjs belum mengizinkan ${f}`);
  const src=fs.readFileSync(path.join(dir,f),'utf8');
  for(const m of src.matchAll(/(?:from|import\()\s*'(\.[^']+)'/g)){
   const target=path.resolve(dir,m[1]);
   if(target.includes(path.join('js','vendor','three')))continue;
   assert.ok(fs.existsSync(target),`${f} mengimpor file yang tidak ada: ${m[1]}`);
  }
 }
 const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 assert.match(html,/<script type="module" src="js\/hero-scene\/index.js"><\/script>/);
 assert.match(html,/data-hero-visual aria-hidden="true"/);
 assert.ok(fs.existsSync(path.join(ROOT,'node_modules/three/build/three.core.js')),'dependency three belum terpasang (npm ci)');
});
test('HTML memakai core/store dan tidak lagi memuat legacy',()=>{
 for(const file of ['index.html','works.html','project.html']){
  const text=fs.readFileSync(path.join(ROOT,file),'utf8');
  assert.match(text,/js\/works-core.js/);assert.match(text,/js\/works-store.js/);assert.doesNotMatch(text,/<script[^>]+works-data/);
 }
});
