/* ==========================================================================
   PEMUAT DATA KARYA (browser)
   --------------------------------------------------------------------------
   Membaca data/works.json — file hasil build dari CMS (Sanity) yang hanya
   berisi karya published dan field publik. Tidak ada token/secret di sini.

   Jika file gagal dimuat, Promise ditolak (reject) dan halaman menampilkan
   pesan error. TIDAK ada fallback ke data lama agar karya yang sudah dihapus
   atau di-unpublish tidak muncul kembali.
   ========================================================================== */

(function () {
  'use strict';

  var core = window.PortfolioWorksCore;
  var DATA_URL = 'data/works.json';
  var cached = null;

  function load() {
    if (cached) return cached;
    cached = fetch(DATA_URL, { headers: { Accept: 'application/json' }, cache: 'no-cache' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (payload) {
        if (!payload || !Array.isArray(payload.works)) throw new Error('Invalid works data');
        var works = core.normalizeWorks(payload.works).filter(function (w) {
          return core.isWorkCategory(w.category);
        });
        return { works: works, source: payload.source || 'unknown', generatedAt: payload.generatedAt || null };
      });
    // Izinkan percobaan ulang setelah gagal
    cached.catch(function () { cached = null; });
    return cached;
  }

  // Penanda kecil di pojok layar saat memakai data lokal/fixture (hanya dev)
  function markDevSource(data) {
    if (!data || data.source === 'sanity' || !document.body) return;
    if (document.getElementById('dev-data-badge')) return;
    var badge = document.createElement('div');
    badge.id = 'dev-data-badge';
    badge.className = 'dev-data-badge';
    badge.textContent = 'DEV DATA: ' + data.source;
    badge.setAttribute('aria-hidden', 'true');
    document.body.appendChild(badge);
  }

  window.PortfolioWorksStore = {
    load: function () {
      var p = load();
      p.then(markDevSource, function () {});
      return p;
    }
  };
})();
