// Fixture hanya untuk tes. Build production tidak boleh memakainya.
export function fixture(count) {
 return Array.from({length:count},(_,i)=>({
  id:'fixture-'+i,slug:'fixture-'+i,title:'Work '+(count-i),category:['motion','design','code'][i%3],
  description:'Test fixture',tools:[],thumbnail:{url:'assets/img/different.webp',alt:'Test'},
  mediaType:'image',links:[],workDate:i%4===0?null:i%4===1?'2025-04-14':i%4===2?'2026-10-26':'2024-02-29',
  order:i,featured:true,previousSlugs:[]
 }));
}
