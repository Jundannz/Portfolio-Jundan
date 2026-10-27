# Portfolio Jundannz

Website HTML/CSS/JavaScript vanilla dengan Sanity Studio sebagai CMS. Hero, aset,
palet, font, grid/breakpoint, showreel, kontak, store, dan mini game tetap memakai
implementasi proyek asli. Tidak ada migrasi framework pada website publik.

Alur konten: **Sanity published → build → `dist/data/works.json` → website**.
Galeri, detail, rekomendasi, dan featured memakai data yang sama. Studio terpisah
dari output website; tidak ada login custom atau tautan admin di navigasi publik.

## Review lokal sekarang (tanpa akun Sanity)

Butuh Node.js >=22.12 (diuji dengan Node 24.21). Jalankan PowerShell di folder proyek:

```powershell
cd 'D:\Jundan\vscode\Portfolio Web Jundan Feature'
npm run data:local
npm run dev
```

Buka [beranda](http://127.0.0.1:8000/index.html) atau
[galeri](http://127.0.0.1:8000/works.html). Ini menampilkan 18 karya asli dengan badge
`DEV DATA: local`. Hentikan server dengan Ctrl+C. Jika port sudah dipakai:
`node scripts/serve.mjs . 8001`.

`data:local` hanya membaca arsip lama untuk pengembangan; jangan menjalankannya
untuk memperbarui konten setelah CMS aktif. Tidak ada fallback ke arsip saat CMS
atau data JSON gagal. Live Server juga bisa membuka halaman setelah data dibuat,
tetapi server bawaan membatasi file yang dilayani. Jangan membuka melalui `file://`.

Untuk memeriksa paket publik: `npm run build:local`, lalu `npm run preview`.
Production Vercel menolak sumber local/fixture dan selalu menjalankan `npm run build`.

## Setup Sanity (dilakukan pemilik)

1. Masuk ke [Sanity Manage](https://www.sanity.io/manage), buat/pilih proyek dan dataset
   `production`. Catat Project ID. Jangan jalankan inisialisasi yang menimpa Studio ini.
2. Berikan akses hanya kepada akun pengelola yang dipercaya melalui menu Members.
   Gunakan login/role bawaan Sanity. Orang lain tidak memperoleh akses tulis hanya
   karena mengetahui URL Studio. Dataset public mengizinkan pembacaan konten published;
   draft dan version memerlukan autentikasi. Jangan simpan rahasia dalam dokumen published
   atau aset, termasuk catatan pemeriksaan. Dataset private adalah pilihan bila kebutuhan
   privasi lebih luas, dengan paket yang mendukungnya.
3. Salin `.env.example` menjadi `.env` di root. Isi `SANITY_PROJECT_ID` dan
   `SANITY_DATASET`. Pada dataset public, biarkan `SANITY_READ_TOKEN` kosong.
   Untuk dataset private, gunakan token pembaca/Viewer khusus build.
4. Salin `studio/.env.example` menjadi `studio/.env`. Isi
   `SANITY_STUDIO_PROJECT_ID` dan `SANITY_STUDIO_DATASET` dengan proyek/dataset yang sama.
   Keduanya konfigurasi publik. **Jangan gunakan prefiks `SANITY_STUDIO_` untuk token.**
5. Tambahkan origin Studio `http://127.0.0.1:3333` pada pengaturan API/CORS Sanity,
   dengan Allow credentials. Jika menggunakan localhost, tambahkan origin itu persis.
   CORS bukan pengganti role/otorisasi. Website publik tidak memerlukan CORS Sanity
   karena mengambil JSON dari situsnya sendiri.
6. Pasang dan buka Studio:

```powershell
npm ci --prefix studio
npm run studio
```

Buka URL yang dicetak CLI (umumnya `http://127.0.0.1:3333`), lalu login sebagai
anggota proyek. Akun, resource Sanity, akses anggota, dan layanan eksternal belum
 dibuat/diubah oleh implementasi ini. Hosting Studio nantinya dapat menggunakan
hosting resmi Sanity, terpisah dari website; jangan deploy sebelum konfigurasi benar.

## Migrasi karya lama

`js/works-data.js` dipertahankan sebagai arsip. Jangan menghapus arsip/aset lokal
sebelum hasil migrasi diverifikasi. Tidak ada kebutuhan mengedit HTML kartu lagi.

```powershell
npm run migrate:check
```

Perintah tersebut hanya memeriksa data dan keberadaan aset lokal, tanpa request
Sanity. Untuk benar-benar migrasi, isi `SANITY_WRITE_TOKEN` dengan token berizin
Editor di `.env` root pada komputer sendiri, kemudian jalankan secara sadar:

```powershell
npm run migrate
```

Perintah ini mengunggah thumbnail/video lokal ke Sanity dan membuat **draft**,
bukan langsung publish. Upload menggunakan referensi aset CDN supaya Studio tidak
bergantung pada path Windows. Media video HTTPS tetap URL; Drive tetap tautan tambahan.
File asli tetap di `assets/` dan tetap tersedia untuk mode lokal.

Migrasi memakai ID deterministik `work-<slug>` dan `createIfNotExists`. Dokumen
published/draft yang cocok berdasarkan ID, legacyId, slug, atau alias dilewati.
Migrasi ulang tidak menimpa suntingan judul/tanggal/slug maupun membuat duplikat
untuk karya yang sudah ada. Jangan menjalankan migrasi lagi setelah sengaja menghapus
semua versi suatu karya: arsip lama masih memuat karya itu dan dapat mengimpornya kembali.
Jika sebagian migrasi gagal, periksa pesannya dan jalankan ulang; yang sudah ada dilewati.
Aset hasil upload yang belum sempat terkait dokumen dapat tersisa bila koneksi terputus.

Periksa 18 draft di Studio: judul, urutan, slug, media, tautan, dan tanggal.
Catatan review menandai tools yang meragukan pada SCA Banner dan Thumbnail Early Bird;
nilai lama dipertahankan, tidak ditebak. Setelah benar, publish karya yang dipilih.
Hapus token migrasi dari `.env`/cabut token bila tidak diperlukan lagi. Token tulis tidak
perlu tersedia di Vercel.

Semua karya lama yang belum bertanggal diberi **2025-04-14 (14 April 2025)** sesuai
instruksi pemilik, bukan tanggal terverifikasi. Ubah melalui date picker Tanggal karya,
lalu nonaktifkan Tanggal masih sementara. Simpan sebagai tanggal kalender, tanpa jam.
Karya baru wajib memiliki tanggal yang Anda pilih; tidak otomatis memakai placeholder.

## Pengelolaan karya di Studio

- Pilih **Karya → Create**, isi judul, slug unik, kategori Motion/Design/Code, deskripsi,
  daftar tools, thumbnail serta alt text. Kategori adalah tiga pilihan tetap desain saat ini.
- Pilih media: Gambar (gambar detail opsional, default thumbnail), YouTube (URL video),
  atau Video langsung (tepat satu dari upload video dan URL file playable). Google Drive
  dimasukkan ke Tautan tambahan, bukan URL video langsung. Tautan memerlukan label dan http(s).
- Atur **Urutan manual**: angka lebih kecil tampil lebih awal, misalnya 10, 20, 30.
  Gunakan 15 untuk menyisipkan di antaranya. Pilih tampilan daftar Urutan kurasi bila perlu.
- Aktifkan **Featured di beranda** untuk pilihan beranda. Maksimal 6 karya sesuai urutan
  kurasi per filter; All menampilkan 6 pilihan awal. Kategori kosong memberi pesan yang jelas.
- Edit otomatis tersimpan sebagai draft. **Publish** memperbarui versi published;
  perubahan draft atas karya published belum terlihat sampai dipublikasikan lagi.
- Gunakan menu dokumen **Unpublish** untuk menarik versi published; **Delete** untuk
  menghapus. Kedua tindakan tetap memerlukan build/deploy website yang sukses agar
  snapshot website publik berubah. Mengedit urutan/featured/tanggal juga perlu publish.
- Pertahankan slug lama. Jika perlu mengganti, isi Alias URL lama sebelum publish.
  Validasi menolak slug/alias yang bentrok. Detail URL lama akan diarahkan ke slug baru.

Setelah aktif, **Sanity menjadi satu-satunya sumber konten utama**. `data/works.json`
adalah output otomatis; jangan diedit manual. Thumbnail galeri dipotong dengan cover
 tanpa distorsi; hotspot Sanity membantu posisi crop. Gambar detail dan video mengikuti
proporsi aslinya. YouTube detail baru dimuat saat tombol Play ditekan. Modal beranda
mendukung media dinamis dan mempertahankan pratinjau Instagram dari tautan lama.

## Filter, sort, pagination

Galeri memproses published → filter kategori → sort seluruh hasil → pagination.
Sort tersedia: Curated order (default), Newest first, Oldest first, Name A–Z, Name Z–A.
Nama dibandingkan tanpa membedakan kapitalisasi dan angka secara natural. Slug menjadi
pembeda stabil. Tanggal kosong selalu terakhir di kedua arah. Tanggal tidak ditampilkan
pada kartu publik.

Maksimal 15 karya pada desktop/mobile, hanya kartu halaman aktif yang dibuat.
Previous/Next, nomor halaman, ellipsis, aria-current dan rentang/total tersedia;
kontrol pagination disembunyikan untuk 0–15 hasil. Ganti kategori mempertahankan sort,
ganti sort mempertahankan kategori, keduanya kembali ke halaman 1.

Contoh: `works.html?category=motion&sort=date-desc&page=2`.
Refresh, Back/Forward, dan tombol kembali detail mempertahankan konteks. Parameter
asing kembali ke default; halaman di luar jangkauan dikoreksi ke halaman terakhir.

## Build dan deployment Vercel (belum dijalankan ke production)

1. Isi konfigurasi CMS root. Untuk memeriksa konten CMS lokal, jalankan `npm run data:cms`,
   kemudian `npm run dev`. Ini tidak deploy.
2. Jalankan `npm run build`. Hasil `dist/` hanya HTML, CSS, JS publik, assets, dan JSON.
   `.env`, Studio, migrasi, tes, node_modules, serta works-data.js tidak disalin.
3. Saat Anda siap deploy, gunakan konfigurasi `vercel.json`: build `npm run build`,
   output `dist`, framework Other. Isi `SANITY_PROJECT_ID`, `SANITY_DATASET`, dan bila
   perlu `SANITY_READ_TOKEN` pada environment build Vercel. Jangan isi token tulis.
4. Lakukan deploy sesuai alur proyek Anda. Implementasi ini tidak melakukan commit,
   push, deploy, pembelian, atau menghubungkan repository.

Publish/unpublish tidak langsung memperbarui website: lakukan build/deploy baru.
Query memakai API non-CDN, perspective published, dan pengecualian draft/version.
Jika CMS gagal, build gagal dengan exit nonzero; tidak memakai arsip lokal diam-diam.
Deployment sukses sebelumnya dapat tetap online, termasuk konten yang baru ditarik,
sampai deployment penggantinya sukses. Selalu periksa hasil deployment sebelum menganggap
unpublish sudah tercermin pada website. Link aset/CDN yang sudah dibagikan tidak menjadi
privat hanya karena dokumen di-unpublish.

Opsi otomatis (belum dikonfigurasi): buat Vercel Deploy Hook, lalu webhook Sanity untuk
create/update/delete dokumen published `work` (filter `_type == "work" &&
!(_id in path("drafts.**")) && !(_id in path("versions.**"))`). Sertakan delete agar
unpublish ikut memicu build. Simpan URL hook di pengaturan layanan, bukan repository.
Uji publish dan unpublish serta status deployment. Lihat
[Vercel Deploy Hooks](https://vercel.com/docs/deploy-hooks) dan
[Sanity webhooks](https://www.sanity.io/docs/content-lake/webhooks).

## Penyimpanan media dan batas layanan

Sanity dipertahankan karena Studio siap pakai, draft/publish, skema, dan pengelolaan
aset cocok dengan frontend vanilla. Berdasarkan [harga resmi Sanity](https://www.sanity.io/pricing)
yang diperiksa 26 Oktober 2026, Free mencakup dataset public, 10 ribu dokumen,
100 GB aset, dan 100 GB bandwidth per bulan. Kuota/ketentuan bisa berubah;
cek dashboard Usage dan [batas teknis](https://www.sanity.io/docs/content-lake/technical-limits)
sebelum mengunggah video besar. File video langsung menghabiskan penyimpanan/bandwidth
setiap ditonton dan bukan layanan streaming/transcoding adaptif. YouTube cocok untuk
video panjang; Drive dapat menyimpan tautan file asli. Tidak ada layanan berbayar
baru atau penyimpanan alternatif yang diaktifkan.

## Pengujian dan troubleshooting

```powershell
npm ci
npm test
npm run migrate:check
npm run build:local
```

Tes menggunakan node:test dan jsdom. Fixture terpisah mencakup 0, 1, 15, 16, 30, 31;
filter/sort global, tanggal kosong/sama/placeholder/diperbarui, judul kapitalisasi/angka,
URL tidak valid, penurunan jumlah karya, detail/back/refresh/history, featured/modal,
error/retry dan media gagal, query published, migrasi berulang dengan mock, serta
penolakan sumber lokal pada Vercel. Tidak ada dummy di output production.

Untuk tes manual fixture: `node scripts/build.mjs --source=fixture:31-mixed --target=root`.
Setelah selesai **wajib** pulihkan `npm run data:local` (atau `npm run data:cms`).

- Galeri kosong/error: jalankan build data dan buka melalui HTTP. Lihat pesan:
  “No works published yet” berbeda dari “Works could not be loaded”; tombol Try again
  melakukan permintaan ulang. Cek `data/works.json` dan terminal build.
- Karya CMS belum muncul: pastikan sudah Publish pada dataset yang benar, lalu rebuild.
  Featured harus aktif untuk beranda. Pagination/filters dapat menyembunyikan hasil lain.
- Build CMS gagal: isi Project ID/dataset; periksa izin token read untuk private dataset,
  koneksi, tanggal valid, dan slug/alias duplikat. Jangan mengganti sumber production ke local.
- Studio gagal dibuka: Node >=22.12, `npm ci --prefix studio`, isi studio/.env, restart
  proses setelah perubahan env, cek CORS origin persis dan keanggotaan akun.
- Media gagal: periksa URL, akses/embedding provider, jenis/codec video. Website memberikan
  fallback dan tautan asli. Font Google dan embed pihak ketiga memerlukan internet.

Build Studio telah diuji dengan Project ID sintetis untuk bundling saja. Login CMS,
migrasi nyata/upload, edit/publish/unpublish, serta pembatasan akses anonim pada proyek
Anda **belum diverifikasi**, karena akun/Project ID belum diberikan. Uji pada proyek
Anda sebelum production. Rujukan mekanisme resmi:
[instalasi Studio](https://www.sanity.io/docs/studio/installation),
[perspectives](https://www.sanity.io/docs/content-lake/perspectives),
[drafts](https://www.sanity.io/docs/content-lake/drafts-and-versions),
[mutations](https://www.sanity.io/docs/apis-and-sdks/js-client-mutations).

## File utama

- `index.html`, `works.html`, `project.html`: host render dan urutan script.
- `js/works-core.js`, `js/works-store.js`, `js/pages.js`: data, state, render.
- `js/script.js`: filter/modal beranda untuk kartu dinamis; fitur lain dipertahankan.
- `css/works-ui.css`: kontrol sort/pagination, status, proporsi media detail.
- `scripts/build.mjs`, `scripts/lib/*`, `scripts/serve.mjs`: pipeline data dan preview.
- `studio/`: Studio resmi, skema, konfigurasi dan migrasi draft.
- `tests/`: fixture, unit, integrasi dan DOM. `README.md` adalah panduan utama.
