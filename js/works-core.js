/* ==========================================================================
   LOGIKA INTI DATA KARYA (tanpa DOM)
   --------------------------------------------------------------------------
   Dipakai oleh works.html, project.html, dan index.html, serta diuji langsung
   di Node (tests/unit). Isinya:
   - Daftar kategori & pilihan sort
   - Normalisasi data karya (dari Sanity, data lokal, atau fixture tes)
   - Validasi URL/tanggal agar data CMS dirender dengan aman
   - Filter → sort global → pagination (urutan proses ini wajib)
   - Membaca/menulis state galeri di URL (?category=&sort=&page=)
   ========================================================================== */

(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PortfolioWorksCore = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var ALL = 'all-view';
  var PAGE_SIZE = 15;
  var DEFAULT_SORT = 'curated';

  // Kategori tetap. Jika menambah kategori, ubah juga skema Studio
  // (studio/schemaTypes/work.js) dan tombol filter di HTML/CSS.
  var CATEGORIES = [
    { id: ALL, label: 'All' },
    { id: 'motion', label: 'Motion' },
    { id: 'design', label: 'Design' },
    { id: 'code', label: 'Code' }
  ];

  var SORTS = [
    { id: 'curated', label: 'Curated order' },
    { id: 'date-desc', label: 'Newest first' },
    { id: 'date-asc', label: 'Oldest first' },
    { id: 'name-asc', label: 'Name A–Z' },
    { id: 'name-desc', label: 'Name Z–A' }
  ];

  var MEDIA_TYPES = ['image', 'youtube', 'video'];

  var collator = (typeof Intl !== 'undefined' && Intl.Collator)
    ? new Intl.Collator('en', { numeric: true, sensitivity: 'base' })
    : null;

  /* ------------------------------------------------------------------------
     Validasi kecil
     ------------------------------------------------------------------------ */

  function isValidCategory(id) {
    return CATEGORIES.some(function (cat) { return cat.id === id; });
  }

  function isWorkCategory(id) {
    return id !== ALL && isValidCategory(id);
  }

  function categoryLabel(id) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].id === id) return CATEGORIES[i].label;
    }
    return String(id || '');
  }

  function isValidSort(id) {
    return SORTS.some(function (s) { return s.id === id; });
  }

  // Tanggal kalender murni "YYYY-MM-DD" (tanpa jam → tidak bergeser zona waktu)
  function isValidDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    var parts = value.split('-').map(Number);
    var d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    return d.getUTCFullYear() === parts[0] && d.getUTCMonth() === parts[1] - 1 && d.getUTCDate() === parts[2];
  }

  function isValidSlug(value) {
    return typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
  }

  // Hanya http(s) absolut yang boleh dipakai sebagai tautan keluar
  function safeExternalUrl(value) {
    if (typeof value !== 'string') return null;
    var trimmed = value.trim();
    if (!/^https?:\/\//i.test(trimmed)) return null;
    try {
      var url = new URL(trimmed);
      return (url.protocol === 'https:' || url.protocol === 'http:') ? url.href : null;
    } catch (e) {
      return null;
    }
  }

  // Sumber media: https absolut, atau path relatif di situs sendiri (mode lokal)
  function safeMediaUrl(value) {
    if (typeof value !== 'string') return null;
    var trimmed = value.trim();
    if (!trimmed || /[\x00-\x20\x7f]/.test(trimmed)) return null;
    if (/^https?:\/\//i.test(trimmed)) return safeExternalUrl(trimmed);
    // path relatif: tanpa skema (javascript:, data:, dll.) dan bukan "//host"
    if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) || trimmed.indexOf('//') === 0 || trimmed.indexOf('\\') !== -1) return null;
    return trimmed;
  }

  function isGoogleDriveUrl(value) {
    return typeof value === 'string' && /^https?:\/\/(drive|docs)\.google\.com\//i.test(value.trim());
  }

  // Menerima ID 11 karakter atau URL YouTube umum (watch, youtu.be, shorts, embed)
  function parseYouTubeId(input) {
    if (typeof input !== 'string') return null;
    var value = input.trim();
    if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;
    var url;
    try { url = new URL(value); } catch (e) { return null; }
    var host = url.hostname.replace(/^www\.|^m\./, '');
    var id = null;
    if (host === 'youtu.be') {
      id = url.pathname.split('/')[1];
    } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (url.pathname === '/watch') id = url.searchParams.get('v');
      else {
        var match = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/);
        if (match) id = match[1];
      }
    }
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  }

  /* ------------------------------------------------------------------------
     Normalisasi karya
     Bentuk akhir yang dipakai halaman:
     { id, slug, title, category, description, tools[], thumbnail{src,cardSrc,alt,position},
       detailImage{src,alt}|null, media{type, youtubeId, src}, links[{label,url}],
       workDate|null, order, featured, previousSlugs[] }
     ------------------------------------------------------------------------ */

  function cleanString(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function hotspotPosition(hotspot) {
    if (!hotspot || typeof hotspot.x !== 'number' || typeof hotspot.y !== 'number') return null;
    var x = Math.min(Math.max(hotspot.x, 0), 1) * 100;
    var y = Math.min(Math.max(hotspot.y, 0), 1) * 100;
    return x.toFixed(1) + '% ' + y.toFixed(1) + '%';
  }

  // URL gambar Sanity CDN bisa diberi parameter ukuran/format
  function sanityImageUrl(src, width) {
    if (!src || !/^https:\/\/cdn\.sanity\.io\/images\//.test(src)) return src;
    return src + (src.indexOf('?') === -1 ? '?' : '&') + 'w=' + width + '&fit=max&auto=format';
  }

  function normalizeImage(raw, fallbackAlt) {
    if (!raw) return null;
    var src = safeMediaUrl(typeof raw === 'string' ? raw : raw.url || raw.src);
    if (!src) return null;
    return {
      src: sanityImageUrl(src, 1600),
      cardSrc: sanityImageUrl(src, 800),
      alt: cleanString(raw.alt) || fallbackAlt || '',
      position: hotspotPosition(raw.hotspot)
    };
  }

  function normalizeWork(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var slug = cleanString(raw.slug);
    var title = cleanString(raw.title);
    if (!isValidSlug(slug) || !title) return null;

    var mediaType = MEDIA_TYPES.indexOf(raw.mediaType) !== -1 ? raw.mediaType : 'image';
    var media = { type: mediaType, youtubeId: null, src: null, invalidReason: null };
    if (mediaType === 'youtube') {
      media.youtubeId = parseYouTubeId(raw.youtubeUrl || raw.youtubeId || '');
      if (!media.youtubeId) media.invalidReason = 'The video link is not a valid YouTube URL.';
    } else if (mediaType === 'video') {
      var rawSrc = cleanString(raw.videoUrl);
      if (isGoogleDriveUrl(rawSrc)) {
        media.invalidReason = 'This video is stored on Google Drive and cannot be played here. Use the original file link below.';
      } else {
        media.src = safeMediaUrl(rawSrc);
        if (!media.src) media.invalidReason = 'No playable video file has been added yet.';
      }
    }

    var links = Array.isArray(raw.links) ? raw.links.map(function (link) {
      if (!link) return null;
      var url = safeExternalUrl(link.url);
      var label = cleanString(link.label);
      return url && label ? { label: label, url: url } : null;
    }).filter(Boolean) : [];

    var tools = Array.isArray(raw.tools)
      ? raw.tools.map(cleanString).filter(Boolean)
      : [];

    var order = raw.order;
    if (typeof order === 'number' && isFinite(order)) order = ('000000000' + Math.floor(order)).slice(-9);
    else if (typeof order !== 'string' || !order) order = null;

    return {
      id: cleanString(raw.id) || slug,
      slug: slug,
      title: title,
      category: cleanString(raw.category),
      description: cleanString(raw.description),
      tools: tools,
      thumbnail: normalizeImage(raw.thumbnail, title),
      detailImage: normalizeImage(raw.detailImage, title),
      media: media,
      links: links,
      workDate: isValidDate(raw.workDate) ? raw.workDate : null,
      order: order,
      featured: raw.featured === true,
      previousSlugs: Array.isArray(raw.previousSlugs) ? raw.previousSlugs.filter(isValidSlug) : []
    };
  }

  // Normalisasi + buang data rusak + buang slug ganda (yang pertama menang)
  function normalizeWorks(list) {
    var seen = {};
    var result = [];
    (Array.isArray(list) ? list : []).forEach(function (raw) {
      var work = normalizeWork(raw);
      if (!work || seen[work.slug]) return;
      seen[work.slug] = true;
      result.push(work);
    });
    return result;
  }

  /* ------------------------------------------------------------------------
     Sort
     ------------------------------------------------------------------------ */

  function compareText(a, b) {
    if (collator) return collator.compare(a, b);
    a = a.toLowerCase(); b = b.toLowerCase();
    return a < b ? -1 : a > b ? 1 : 0;
  }

  // Bandingkan string apa adanya (orderRank Sanity dirancang untuk ini)
  function compareRaw(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
  }

  function compareSlug(a, b) { return compareRaw(a.slug, b.slug); }

  function compareCurated(a, b) {
    if (a.order !== b.order) {
      if (a.order === null) return 1;
      if (b.order === null) return -1;
      var diff = compareRaw(a.order, b.order);
      if (diff) return diff;
    }
    return compareSlug(a, b);
  }

  function compareByDate(direction) {
    return function (a, b) {
      // Karya tanpa tanggal selalu di belakang, di kedua arah
      if (a.workDate !== b.workDate) {
        if (a.workDate === null) return 1;
        if (b.workDate === null) return -1;
        return direction * compareRaw(a.workDate, b.workDate);
      }
      return compareSlug(a, b);
    };
  }

  function compareByName(direction) {
    return function (a, b) {
      return direction * compareText(a.title, b.title) || compareSlug(a, b);
    };
  }

  var COMPARATORS = {
    'curated': compareCurated,
    'date-desc': compareByDate(-1),
    'date-asc': compareByDate(1),
    'name-asc': compareByName(1),
    'name-desc': compareByName(-1)
  };

  function sortWorks(works, sort) {
    var comparator = COMPARATORS[isValidSort(sort) ? sort : DEFAULT_SORT];
    return works.slice().sort(comparator);
  }

  function filterWorks(works, category) {
    if (!category || category === ALL) return works.slice();
    return works.filter(function (work) { return work.category === category; });
  }

  function countByCategory(works) {
    var counts = {};
    CATEGORIES.forEach(function (cat) { counts[cat.id] = 0; });
    works.forEach(function (work) {
      counts[ALL] += 1;
      if (counts[work.category] !== undefined) counts[work.category] += 1;
    });
    return counts;
  }

  /* ------------------------------------------------------------------------
     Pagination
     ------------------------------------------------------------------------ */

  // Hanya bilangan bulat positif murni ("2"). Selain itu → null (tidak valid).
  function parsePageParam(value) {
    if (typeof value !== 'string' || !/^[0-9]+$/.test(value)) return null;
    var n = parseInt(value, 10);
    return n >= 1 && n <= 1000000 ? n : null;
  }

  function paginate(items, requestedPage, pageSize) {
    pageSize = pageSize || PAGE_SIZE;
    var total = items.length;
    var totalPages = Math.max(1, Math.ceil(total / pageSize));
    var page = Math.min(Math.max(1, requestedPage || 1), totalPages);
    var start = (page - 1) * pageSize;
    var pageItems = items.slice(start, start + pageSize);
    return {
      page: page,
      totalPages: totalPages,
      total: total,
      from: total ? start + 1 : 0,
      to: start + pageItems.length,
      items: pageItems
    };
  }

  // Nomor halaman + "ellipsis": selalu tampil halaman pertama, terakhir,
  // dan tetangga halaman aktif. Celah 1 halaman diisi nomornya langsung.
  function pageList(current, total) {
    if (total <= 7) {
      var all = [];
      for (var p = 1; p <= total; p++) all.push(p);
      return all;
    }
    var wanted = [1, total, current - 1, current, current + 1];
    if (current <= 3) wanted.push(2, 3, 4);
    if (current >= total - 2) wanted.push(total - 1, total - 2, total - 3);
    var pages = wanted
      .filter(function (n, i, arr) { return n >= 1 && n <= total && arr.indexOf(n) === i; })
      .sort(function (a, b) { return a - b; });

    var result = [];
    pages.forEach(function (n, i) {
      if (i > 0) {
        var gap = n - pages[i - 1];
        if (gap === 2) result.push(n - 1);
        else if (gap > 2) result.push('ellipsis');
      }
      result.push(n);
    });
    return result;
  }

  /* ------------------------------------------------------------------------
     State galeri ↔ URL
     ------------------------------------------------------------------------ */

  function readListState(search) {
    var params = new URLSearchParams(search || '');
    var category = params.get('category');
    var sort = params.get('sort');
    var page = parsePageParam(params.get('page'));
    return {
      category: isValidCategory(category) ? category : ALL,
      sort: isValidSort(sort) ? sort : DEFAULT_SORT,
      page: page || 1
    };
  }

  // Nilai default tidak ditulis supaya URL tetap pendek
  function listStateToParams(state, baseParams) {
    var params = new URLSearchParams(baseParams || '');
    params.delete('category');
    params.delete('sort');
    params.delete('page');
    if (state.category && state.category !== ALL) params.set('category', state.category);
    if (state.sort && state.sort !== DEFAULT_SORT) params.set('sort', state.sort);
    if (state.page && state.page > 1) params.set('page', String(state.page));
    return params;
  }

  function listStateToSearch(state, baseParams) {
    var query = listStateToParams(state, baseParams).toString();
    return query ? '?' + query : '';
  }

  // Proses lengkap: filter kategori → sort seluruh hasil → potong halaman
  function computeListing(works, state) {
    var filtered = filterWorks(works, state.category);
    var sorted = sortWorks(filtered, state.sort);
    var pageInfo = paginate(sorted, state.page, PAGE_SIZE);
    return {
      state: { category: state.category, sort: state.sort, page: pageInfo.page },
      page: pageInfo
    };
  }

  /* ------------------------------------------------------------------------
     Pilihan karya untuk bagian lain
     ------------------------------------------------------------------------ */

  // "More works": kategori sama dulu, lalu kategori lain, semua urut curated
  function pickMoreWorks(works, current, limit) {
    var sorted = sortWorks(works, DEFAULT_SORT).filter(function (w) { return w.slug !== current.slug; });
    var same = sorted.filter(function (w) { return w.category === current.category; });
    var others = sorted.filter(function (w) { return w.category !== current.category; });
    return same.concat(others).slice(0, limit || 3);
  }

  // Karya featured di landing page, urut curated, dibatasi kapasitas desain
  function pickFeatured(works, category, limit) {
    var featured = works.filter(function (w) { return w.featured; });
    return sortWorks(filterWorks(featured, category), DEFAULT_SORT).slice(0, limit);
  }

  function findBySlug(works, slug) {
    if (!slug) return null;
    for (var i = 0; i < works.length; i++) if (works[i].slug === slug) return works[i];
    return null;
  }

  // Slug lama (setelah slug diganti di CMS) → karya tujuan
  function findByPreviousSlug(works, slug) {
    if (!slug) return null;
    for (var i = 0; i < works.length; i++) {
      if (works[i].previousSlugs.indexOf(slug) !== -1) return works[i];
    }
    return null;
  }

  return {
    ALL: ALL,
    PAGE_SIZE: PAGE_SIZE,
    DEFAULT_SORT: DEFAULT_SORT,
    CATEGORIES: CATEGORIES,
    SORTS: SORTS,
    isValidCategory: isValidCategory,
    isWorkCategory: isWorkCategory,
    categoryLabel: categoryLabel,
    isValidSort: isValidSort,
    isValidDate: isValidDate,
    isValidSlug: isValidSlug,
    safeExternalUrl: safeExternalUrl,
    safeMediaUrl: safeMediaUrl,
    isGoogleDriveUrl: isGoogleDriveUrl,
    parseYouTubeId: parseYouTubeId,
    normalizeWork: normalizeWork,
    normalizeWorks: normalizeWorks,
    sortWorks: sortWorks,
    filterWorks: filterWorks,
    countByCategory: countByCategory,
    parsePageParam: parsePageParam,
    paginate: paginate,
    pageList: pageList,
    readListState: readListState,
    listStateToParams: listStateToParams,
    listStateToSearch: listStateToSearch,
    computeListing: computeListing,
    pickMoreWorks: pickMoreWorks,
    pickFeatured: pickFeatured,
    findBySlug: findBySlug,
    findByPreviousSlug: findByPreviousSlug
  };
});
