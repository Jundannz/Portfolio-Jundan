import {test} from 'node:test';
import assert from 'node:assert/strict';
import core from '../js/works-core.js';
import {fixture} from './fixtures/generate.mjs';

for(const n of [0,1,15,16,30,31]) test(`pagination ${n} karya: semua karya tepat sekali`,()=>{
 const works=core.normalizeWorks(fixture(n));
 const pages=Math.max(1,Math.ceil(n/15));const collected=[];
 for(let page=1;page<=pages;page++){
  const info=core.computeListing(works,{category:core.ALL,sort:'curated',page}).page;
  assert.ok(info.items.length<=15);assert.equal(info.total,n);assert.equal(info.totalPages,pages);
  collected.push(...info.items.map(w=>w.slug));
 }
 assert.equal(new Set(collected).size,n);
 assert.equal(core.paginate(works,999).page,pages);
});
test('filter lalu sort global lalu pagination; sumber tidak berubah',()=>{
 const works=core.normalizeWorks(fixture(47));const before=works.map(w=>w.slug);
 for(const sort of core.SORTS.map(s=>s.id)) {
  const result=core.computeListing(works,{category:'motion',sort,page:2});
  assert.equal(result.page.total,16);assert.equal(result.page.items.length,1);
  assert.deepEqual(result.page.items,core.sortWorks(works.filter(w=>w.category==='motion'),sort).slice(15));
 }
 assert.deepEqual(works.map(w=>w.slug),before);
});
test('tanggal kosong terakhir kedua arah; tanggal sama tie-break slug',()=>{
 const works=core.normalizeWorks([
  {title:'A',slug:'z',workDate:'2025-04-14',order:1},
  {title:'B',slug:'b',workDate:null},
  {title:'C',slug:'c',workDate:'2026-10-26'},
  {title:'D',slug:'a',workDate:'2025-04-14',order:99}]);
 assert.deepEqual(core.sortWorks(works,'date-asc').map(w=>w.slug),['a','z','c','b']);
 assert.deepEqual(core.sortWorks(works,'date-desc').map(w=>w.slug),['c','a','z','b']);
 assert.equal(core.isValidDate('2025-02-29'),false);assert.equal(core.isValidDate('2024-02-29'),true);
});
test('nama natural, kapitalisasi dan judul sama stabil',()=>{
 const works=core.normalizeWorks([{slug:'z',title:'Work 2'},{slug:'a',title:'work 2'},{slug:'b',title:'Work 10'}]);
 assert.deepEqual(core.sortWorks(works,'name-asc').map(w=>w.slug),['a','z','b']);
 assert.deepEqual(core.sortWorks(works,'name-desc').map(w=>w.slug),['b','a','z']);
});
test('URL tidak valid dan state roundtrip',()=>{
 for(const page of ['', '0','-1','1.5','x','1e2','1000001'])assert.equal(core.readListState('?category=x&sort=x&page='+page).page,1);
 const state={category:'motion',sort:'date-desc',page:2};
 assert.deepEqual(core.readListState(core.listStateToSearch(state)),state);
 assert.deepEqual(core.readListState('?category=x&sort=x'),{category:core.ALL,sort:'curated',page:1});
 assert.ok(core.pageList(10,30).includes('ellipsis'));
});
test('jumlah berkurang, featured dan rekomendasi',()=>{
 const works=core.normalizeWorks(fixture(31));
 assert.equal(core.computeListing(works.slice(0,15),{category:core.ALL,sort:'curated',page:3}).page.page,1);
 assert.equal(core.pickFeatured(works,core.ALL,6).length,6);
 assert.ok(core.pickMoreWorks(works,works[0],3).every(w=>w.slug!==works[0].slug));
});
test('URL berbahaya dan Drive tidak menjadi sumber media',()=>{
 for(const url of ['javascript:alert(1)','data:image/svg+xml,test','//evil.test/a','java\nscript:alert(1)','\\evil.test'])assert.equal(core.safeMediaUrl(url),null);
 assert.equal(core.safeExternalUrl('javascript:alert(1)'),null);
 assert.ok(core.normalizeWork({slug:'x',title:'X',mediaType:'video',videoUrl:'https://drive.google.com/file/d/123/view'}).media.invalidReason);
 assert.equal(core.parseYouTubeId('https://youtu.be/abcdefghijk'),'abcdefghijk');
 assert.equal(core.parseYouTubeId('https://evil.test/watch?v=abcdefghijk'),null);
});
