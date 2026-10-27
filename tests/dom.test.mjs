import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {JSDOM} from 'jsdom';
import {ROOT,loadLegacyRecords,recordToPublicWork} from '../scripts/lib/legacy.mjs';
import {fixture} from './fixtures/generate.mjs';
const tick=()=>new Promise(r=>setTimeout(r,20));
async function page(file,data,search='',fetcher) {
 const dom=new JSDOM(fs.readFileSync(path.join(ROOT,file),'utf8'),{url:'http://localhost/'+file+search,runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;
 await new Promise(r=>w.addEventListener('load',r,{once:true}));
 w.matchMedia=()=>({matches:true,addEventListener(){}});w.scrollTo=()=>{};
 w.HTMLElement.prototype.scrollIntoView=()=>{};
 w.HTMLMediaElement.prototype.pause=()=>{};w.HTMLMediaElement.prototype.load=()=>{};
 w.console.error=()=>{};
 w.fetch=fetcher|| (async()=>({ok:true,json:async()=>({source:'sanity',works:data})}));
 for(const file of ['works-core.js','works-store.js','script.js'])w.eval(fs.readFileSync(path.join(ROOT,'js',file),'utf8'));
 w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 w.eval(fs.readFileSync(path.join(ROOT,'js/pages.js'),'utf8'));await tick();
 return {dom,w,d:w.document};
}
for(const n of [0,1,15,16,30,31])test(`DOM fixture ${n}: jumlah kartu, rentang, tombol dan halaman akhir`,async()=>{
 const {dom,d}=await page('works.html',fixture(n));
 try {
  assert.equal(d.querySelectorAll('#archive-grid .work-card').length,Math.min(n,15));
  assert.equal(d.querySelector('#archive-pagination').hidden,n<=15);
  if(n>15){d.querySelector('[aria-label="Next page"]').click();assert.equal(d.querySelectorAll('#archive-grid .work-card').length,Math.min(n-15,15));assert.equal(d.querySelector('#archive-pagination [aria-current="page"]').textContent,'2');}
  assert.equal(d.querySelector('#archive-empty').hidden,n>0);
 }finally{dom.window.close();}
});
test('DOM kombinasi filter, sort, page, Back/Forward, refresh dan konteks detail',async()=>{
 const {dom,w,d}=await page('works.html',fixture(47),'?page=999&sort=name-desc');
 try {
  assert.equal(new URL(w.location).searchParams.get('page'),'4');
  d.querySelector('[data-filter="motion"]').click();
  assert.equal(d.querySelectorAll('#archive-grid .work-card').length,15);
  assert.equal(d.querySelector('#archive-sort').value,'name-desc');
  d.querySelector('[aria-label="Next page"]').click();
  assert.equal(d.querySelectorAll('#archive-grid .work-card').length,1);
  const detailURL=d.querySelector('.work-card').getAttribute('href');
  const detail=await page('project.html',fixture(47),detailURL.slice(detailURL.indexOf('?')));
  assert.equal(detail.d.querySelector('#project-back').getAttribute('href'),'works.html?category=motion&sort=name-desc&page=2');detail.dom.window.close();
  const refreshed=await page('works.html',fixture(47),w.location.search);
  assert.equal(refreshed.d.querySelectorAll('#archive-grid .work-card').length,1);refreshed.dom.window.close();
  w.history.back();await tick();assert.equal(d.querySelectorAll('#archive-grid .work-card').length,15);
  w.history.forward();await tick();assert.equal(d.querySelectorAll('#archive-grid .work-card').length,1);
  const sort=d.querySelector('#archive-sort');sort.value='date-asc';sort.dispatchEvent(new w.Event('change'));
  assert.equal(new URL(w.location).searchParams.get('category'),'motion');assert.equal(new URL(w.location).searchParams.get('page'),null);
 }finally{dom.window.close();}
});
test('DOM error/retry, media gagal, proyek hilang dan data kosong',async()=>{
 let calls=0;
 const {dom,d,w}=await page('works.html',[], '',async()=>{if(calls++===0)throw new Error('offline');return {ok:true,json:async()=>({works:fixture(1)})};});
 try {
  assert.match(d.querySelector('#archive-load-status').textContent,/could not be loaded/);assert.equal(d.querySelector('#archive-empty').hidden,true);
  d.querySelector('#archive-load-status button').click();await tick();
  assert.equal(d.querySelectorAll('.work-card').length,1);
  d.querySelector('.work-card img').dispatchEvent(new w.Event('error'));
  assert.match(d.querySelector('.work-card .media-fallback').textContent,/Media not available/);
 }finally{dom.window.close();}
 const missing=await page('project.html',fixture(1),'?id=missing');assert.match(missing.d.querySelector('#project-root').textContent,/Project not found/);missing.dom.window.close();
 const failed=await page('project.html',[], '?id=fixture-0',async()=>{throw new Error('offline');});assert.match(failed.d.querySelector('#project-root').textContent,/could not be loaded/);failed.dom.window.close();
});
test('DOM featured 6 kartu per kategori, modal dinamis dan menu/store lama',async()=>{
 const {dom,d,w}=await page('index.html',loadLegacyRecords().map(recordToPublicWork));
 try {
  assert.equal(d.querySelectorAll('[data-featured-root] .show a').length,6);
  d.querySelector('#works [data-filter="code"]').click();await new Promise(r=>setTimeout(r,280));
  assert.equal(d.querySelectorAll('[data-featured-root] .show a').length,6);
  const card=d.querySelector('[data-featured-root] .show a');card.click();
  assert.ok(d.querySelector('#work-modal').classList.contains('active'));
  assert.match(d.querySelector('#work-modal-detail').getAttribute('href'),/portfolio-website/);
  d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape'}));assert.ok(!d.querySelector('#work-modal').classList.contains('active'));
  d.querySelector('#store-btn-nav').click();assert.ok(d.querySelector('#store-modal').classList.contains('active'));
  d.querySelector('#hamburger-btn').click();assert.equal(d.querySelector('#hamburger-btn').getAttribute('aria-expanded'),'true');
 }finally{dom.window.close();}
});
