import {defineField, defineType} from 'sanity';

const validSlug = value => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value || '');
const validUrl = value => { try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; } };
const youtube = value => {
  try { const u=new URL(value); return ['youtube.com','www.youtube.com','m.youtube.com','youtu.be','www.youtu.be','youtube-nocookie.com','www.youtube-nocookie.com'].includes(u.hostname) && /(?:v=|\/)([\w-]{11})(?:[?&#/]|$)/.test(value); } catch { return false; }
};

// Cek slug aktif serta alias agar URL lama tidak mengarah ke proyek lain.
async function uniqueSlug(slug, context) {
  const id = context.document?._id?.replace(/^drafts\./, '');
  const count = await context.getClient({apiVersion:'2025-02-19'}).fetch(
    'count(*[_type == "work" && !(_id in [$id, $draft]) && (slug.current == $slug || $slug in previousSlugs)])',
    {id: id || '', draft:'drafts.'+id, slug}, {perspective:'raw'});
  return count === 0;
}
const imageField = (name,title,required=false) => defineField({
  name,title,type:'image',options:{hotspot:true},
  fields:[{name:'alt',title:'Alt text',type:'string',validation:r=>r.required()}],
  validation:r=>required?r.required().assetRequired():r
});

export const work = defineType({
  name:'work',title:'Karya',type:'document',
  initialValue:{featured:false,dateIsPlaceholder:false,mediaType:'image'},
  orderings:[
    {title:'Urutan kurasi',name:'curated',by:[{field:'manualOrder',direction:'asc'},{field:'slug.current',direction:'asc'}]},
    {title:'Tanggal terbaru',name:'newest',by:[{field:'workDate',direction:'desc'}]},
    {title:'Judul A–Z',name:'title',by:[{field:'title',direction:'asc'}]}
  ],
  fields:[
    defineField({name:'title',title:'Judul',type:'string',validation:r=>r.required()}),
    defineField({name:'slug',title:'Slug / URL',type:'slug',description:'Pertahankan slug lama. Jika diganti, masukkan slug sebelumnya ke Alias URL lama.',options:{source:'title',maxLength:96,isUnique:uniqueSlug},validation:r=>r.required().custom(v=>!v || validSlug(v.current) || 'Gunakan huruf kecil, angka, dan tanda hubung.')}),
    defineField({name:'category',title:'Kategori',type:'string',options:{list:[{title:'Motion',value:'motion'},{title:'Design',value:'design'},{title:'Code',value:'code'}]},validation:r=>r.required()}),
    defineField({name:'description',title:'Deskripsi',type:'text',rows:4,validation:r=>r.required()}),
    defineField({name:'tools',title:'Tools',type:'array',of:[{type:'string'}],options:{layout:'tags'}}),
    imageField('thumbnail','Thumbnail',true),
    defineField({name:'mediaType',title:'Jenis media',type:'string',options:{list:[{title:'Gambar',value:'image'},{title:'YouTube',value:'youtube'},{title:'Video langsung',value:'video'}]},validation:r=>r.required()}),
    {...imageField('detailImage','Gambar detail (opsional; default thumbnail)'),hidden:({document})=>document?.mediaType!=='image'},
    defineField({name:'youtubeUrl',title:'URL YouTube',type:'url',hidden:({document})=>document?.mediaType!=='youtube',validation:r=>r.custom((v,c)=>c.document?.mediaType!=='youtube'||youtube(v)||'Isi URL video YouTube yang valid.')}),
    defineField({name:'videoFile',title:'Upload video',type:'file',options:{accept:'video/*'},description:'Pilih upload ATAU URL video. Video besar disarankan melalui YouTube.',hidden:({document})=>document?.mediaType!=='video',validation:r=>r.custom((v,c)=>c.document?.mediaType!=='video'||Boolean(v?.asset?._ref)!==Boolean(c.document?.videoUrl)||'Isi tepat satu sumber: upload atau URL video.')}),
    defineField({name:'videoUrl',title:'URL video langsung',type:'url',description:'URL file playable (misalnya MP4), bukan halaman Google Drive.',hidden:({document})=>document?.mediaType!=='video',validation:r=>r.custom(v=>!v||(validUrl(v)&&!['drive.google.com','docs.google.com'].includes(new URL(v).hostname))||'Gunakan URL http(s) video langsung; Drive masuk tautan tambahan.')}),
    defineField({name:'links',title:'Tautan tambahan',type:'array',of:[{name:'workLink',type:'object',fields:[{name:'label',title:'Label (Drive, Instagram, GitHub, dll.)',type:'string',validation:r=>r.required()},{name:'url',title:'URL',type:'url',validation:r=>r.required().uri({scheme:['https','http']})}]}]}),
    defineField({name:'workDate',title:'Tanggal karya',type:'date',options:{dateFormat:'DD/MM/YYYY'},description:'Tanggal pembuatan karya, bukan upload/publish. 14 April 2025 pada hasil migrasi adalah tanggal sementara; periksa dan ubah melalui kalender.',validation:r=>r.required()}),
    defineField({name:'dateIsPlaceholder',title:'Tanggal masih sementara',type:'boolean',description:'Nonaktifkan setelah tanggal karya lama telah diperiksa/diperbaiki. Tidak tampil di website.'}),
    defineField({name:'manualOrder',title:'Urutan manual',type:'number',description:'Angka kecil tampil lebih awal. Gunakan 10, 20, 30 agar mudah menyisipkan karya.',validation:r=>r.required().integer().min(0).max(999999999)}),
    defineField({name:'featured',title:'Featured di beranda',type:'boolean',description:'Maksimal 6 pilihan pertama sesuai urutan manual per filter.'}),
    defineField({name:'previousSlugs',title:'Alias URL lama',type:'array',of:[{type:'string'}],validation:r=>r.unique().custom(async(v,c)=>{for(const slug of v||[]) {if(!validSlug(slug))return 'Alias harus berformat slug.'; if(slug===c.document?.slug?.current)return 'Alias tidak boleh sama dengan slug aktif.'; if(!await uniqueSlug(slug,c))return 'Alias sudah dipakai karya lain: '+slug;}return true;})}),
    defineField({name:'legacyId',title:'ID migrasi',type:'string',readOnly:true,hidden:true}),
    defineField({name:'reviewNotes',title:'Catatan pemeriksaan data lama',type:'text',readOnly:true,description:'Catatan migrasi, bukan untuk informasi rahasia. Tidak diekspor ke website.'})
  ],
  preview:{select:{title:'title',subtitle:'category',media:'thumbnail'}}
});
