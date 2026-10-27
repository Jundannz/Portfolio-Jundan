/* ==========================================================================
   LOGIKA HALAMAN KARYA (works.html, project.html, dan "my works" di index.html)
   --------------------------------------------------------------------------
   Sumber data: data/works.json (hasil build dari CMS Sanity) yang dimuat lewat
   js/works-store.js. Logika filter/sort/pagination ada di js/works-core.js.

   Navbar, progress bar, menu mobile, dan modal ditangani js/script.js.
   File ini mengurus:
   - Galeri: filter kategori → sort → pagination (15 per halaman), state di URL
   - Detail satu karya (project.html?id=...) + "more works"
   - Karya featured di landing page
   - Loading, kosong, gagal memuat, tidak ditemukan, media gagal

   Semua teks yang tampil ke pengunjung ditulis dalam bahasa Inggris.
   Semua data CMS dirender dengan textContent / atribut, bukan innerHTML.
   ========================================================================== */

(function () {
  'use strict';

  var core = window.PortfolioWorksCore;
  var store = window.PortfolioWorksStore;
  if (!core || !store) return;

  // Jumlah warna kartu yang tersedia di css/pages.css (data-tone 0–5)
  var CARD_TONES = 6;
  // Durasi fade filter — harus sama dengan transisi .archive-grid di CSS
  var FILTER_FADE_MS = 250;
  // Kapasitas desain "my works" di landing page (2 baris × 3 kartu)
  var FEATURED_LIMIT = 6;

  /* ------------------------------------------------------------------------
     Utilitas
     ------------------------------------------------------------------------ */

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function setText(id, text) {
    var node = document.getElementById(id);
    if (node) node.textContent = text;
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // URL detail karya; konteks galeri (kategori/sort/halaman) ikut dibawa
  // supaya tombol "Back" di halaman detail kembali ke posisi yang sama.
  function projectHref(work, listState) {
    var params = listState ? core.listStateToParams(listState) : new URLSearchParams();
    if (listState) params.set('category', listState.category);
    var rest = params.toString();
    return 'project.html?id=' + encodeURIComponent(work.slug) + (rest ? '&' + rest : '');
  }

  /* ------------------------------------------------------------------------
     Media
     ------------------------------------------------------------------------ */

  // Placeholder bertanda jelas agar tidak terlihat seperti karya sungguhan
  function createMediaFallback(message) {
    var box = el('div', 'media-fallback');
    box.appendChild(el('strong', null, 'Media not available'));
    box.appendChild(el('span', null, message));
    return box;
  }

  // Gambar dengan penanganan gagal muat → diganti placeholder
  function createImage(image, fallbackAlt, fallbackMessage, options) {
    options = options || {};
    var src = image && (options.card ? image.cardSrc : image.src);
    if (!src) return createMediaFallback(fallbackMessage || 'No thumbnail has been added yet.');

    var img = document.createElement('img');
    img.src = src;
    img.alt = (image && image.alt) || fallbackAlt || '';
    img.loading = options.eager ? 'eager' : 'lazy';
    img.decoding = 'async';
    if (options.card && image.position) img.style.objectPosition = image.position;

    img.addEventListener('error', function () {
      var fallback = createMediaFallback(fallbackMessage || 'The image failed to load.');
      fallback.className += ' ' + img.className;
      if (img.parentNode) img.parentNode.replaceChild(fallback, img);
      if (options.onError) options.onError();
    });
    if (options.onLoad) img.addEventListener('load', options.onLoad);

    return img;
  }

  /**
   * Area media halaman detail sesuai jenis media.
   * - Gambar & video memakai proporsi aslinya (tidak dipotong/didistorsi).
   * - YouTube/video tidak diputar otomatis; video hanya memuat metadata.
   */
  function renderProjectMedia(work) {
    var stage = el('div', 'project-media__stage');
    var media = work.media;
    var thumb = work.thumbnail;

    function showFallback(message) {
      stage.className = 'project-media__stage';
      stage.innerHTML = '';
      stage.appendChild(createMediaFallback(message));
    }

    if (media.invalidReason) {
      showFallback(media.invalidReason);
      return stage;
    }

    if (media.type === 'youtube') {
      stage.appendChild(createImage(thumb, work.title, 'No video thumbnail has been added yet.', { eager: true }));

      var playBtn = el('button', 'media-play');
      playBtn.type = 'button';
      playBtn.setAttribute('aria-label', 'Play video: ' + work.title);
      playBtn.appendChild(el('span', 'media-play__icon', '▶'));
      playBtn.appendChild(el('span', null, 'Play video'));
      stage.appendChild(playBtn);

      playBtn.addEventListener('click', function () {
        // rel=0 & playsinline: tanpa video rekomendasi, tetap di dalam halaman di HP
        var iframe = document.createElement('iframe');
        iframe.src = 'https://www.youtube-nocookie.com/embed/' +
          encodeURIComponent(media.youtubeId) + '?autoplay=1&rel=0&playsinline=1';
        iframe.title = work.title;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        stage.innerHTML = '';
        stage.appendChild(iframe);
        iframe.focus();
      });

      return stage;
    }

    if (media.type === 'video') {
      var video = document.createElement('video');
      video.src = media.src;
      video.controls = true;
      video.preload = 'metadata';
      video.playsInline = true;
      video.setAttribute('aria-label', work.title);
      if (thumb && thumb.src) video.poster = thumb.src;

      // Setelah metadata terbaca, bingkai mengikuti rasio video asli
      video.addEventListener('loadedmetadata', function () {
        if (video.videoWidth && video.videoHeight) {
          stage.style.aspectRatio = video.videoWidth + ' / ' + video.videoHeight;
        }
      });
      video.addEventListener('error', function () {
        showFallback('The video failed to load. Use the original file link below.');
      });

      stage.appendChild(video);
      return stage;
    }

    // Gambar: pakai gambar detail bila ada, jika tidak pakai thumbnail
    stage.classList.add('project-media__stage--natural');
    stage.appendChild(createImage(work.detailImage || thumb, work.title, 'No image has been added yet.', {
      eager: true,
      onError: function () { stage.classList.remove('project-media__stage--natural'); }
    }));
    return stage;
  }

  /* ------------------------------------------------------------------------
     Kartu karya (galeri & "more works")
     ------------------------------------------------------------------------ */

  /**
   * @param {object} work      data karya (sudah dinormalisasi)
   * @param {number} index     posisi kartu, dipakai untuk warna bergilir
   * @param {object} listState konteks galeri yang dibawa ke halaman detail
   */
  function createWorkCard(work, index, listState) {
    var card = el('a', 'work-card');
    card.href = projectHref(work, listState);
    card.setAttribute('data-category', work.category);
    card.setAttribute('data-tone', String(index % CARD_TONES));

    var mediaBox = el('div', 'work-card__media');
    mediaBox.appendChild(createImage(work.thumbnail, work.title, 'No thumbnail has been added yet.', { card: true }));

    var body = el('div', 'work-card__body');
    body.appendChild(el('span', 'category-badge', core.categoryLabel(work.category)));
    body.appendChild(el('h2', 'work-card__title', work.title));
    body.appendChild(el('p', 'work-card__desc', work.description || ''));

    if (work.tools.length) {
      var tools = el('div', 'tool-list');
      work.tools.forEach(function (tool) { tools.appendChild(el('span', 'tool-tag', tool)); });
      body.appendChild(tools);
    }

    body.appendChild(el('span', 'work-card__cta', 'View project →'));

    card.appendChild(mediaBox);
    card.appendChild(body);
    return card;
  }

  // Kotak status (loading / gagal) di area grid
  function createStatusBox(title, text, retry) {
    var box = el('div', 'empty-state archive-status-box');
    box.setAttribute('role', retry ? 'alert' : 'status');
    box.appendChild(el('p', 'empty-state__title', title));
    if (text) box.appendChild(el('p', 'empty-state__text', text));
    if (retry) {
      var btn = el('button', 'back-btn', 'Try again');
      btn.type = 'button';
      btn.addEventListener('click', retry);
      box.appendChild(btn);
    }
    return box;
  }

  /* ------------------------------------------------------------------------
     Halaman galeri (works.html) — filter, sort, pagination
     ------------------------------------------------------------------------ */

  function initGalleryPage() {
    var grid = document.getElementById('archive-grid');
    if (!grid) return;

    var filterBtns = document.querySelectorAll('#archive-filter .filter-btn');
    var sortSelect = document.getElementById('archive-sort');
    var titleLead = document.getElementById('archive-title-lead');
    var countLabel = document.getElementById('archive-count');
    var emptyState = document.getElementById('archive-empty');
    var emptyTitle = document.getElementById('archive-empty-title');
    var emptyText = document.getElementById('archive-empty-text');
    var resetBtn = document.querySelector('[data-filter-reset]');
    var statusHost = document.getElementById('archive-load-status');
    var rangeLabel = document.getElementById('archive-range');
    var pagination = document.getElementById('archive-pagination');
    var toolbar = document.getElementById('archive-toolbar');

    var works = null;          // null = belum termuat
    var state = core.readListState(window.location.search);
    var switchTimer = null;
    var renderSeq = 0;         // mencegah render lama menimpa pilihan terbaru

    /* ---------- URL ---------- */

    function writeUrl(nextState, mode) {
      var search = core.listStateToSearch(nextState, window.location.search);
      var url = window.location.pathname + search + window.location.hash;
      var current = window.location.pathname + window.location.search + window.location.hash;
      if (url === current) return;
      if (mode === 'push') window.history.pushState(null, '', url);
      else window.history.replaceState(null, '', url);
    }

    /* ---------- Kontrol ---------- */

    function syncControls() {
      filterBtns.forEach(function (btn) {
        var isActive = btn.getAttribute('data-filter') === state.category;
        btn.setAttribute('aria-pressed', String(isActive));
        btn.classList.toggle('active', isActive);
      });
      if (sortSelect) sortSelect.value = state.sort;
    }

    function updateHeading(total) {
      var isAll = state.category === core.ALL;
      var label = isAll ? 'all' : core.categoryLabel(state.category).toLowerCase();
      if (titleLead) titleLead.textContent = label;
      if (countLabel) {
        countLabel.textContent = works === null ? '' :
          total + (total === 1 ? ' project' : ' projects') +
          (isAll ? '.' : ' in ' + core.categoryLabel(state.category) + '.');
      }
      var pageSuffix = state.page > 1 ? ' (page ' + state.page + ')' : '';
      document.title = (isAll ? 'All Works' : core.categoryLabel(state.category) + ' Works') +
        pageSuffix + ' — Jundannz Portfolio';
    }

    function updateFilterCounts() {
      if (!works) return;
      var counts = core.countByCategory(works);
      filterBtns.forEach(function (btn) {
        var id = btn.getAttribute('data-filter');
        btn.setAttribute('aria-label', btn.textContent.trim() + ' (' + (counts[id] || 0) + ' projects)');
      });
    }

    /* ---------- Pagination ---------- */

    function pageButton(label, page, options) {
      options = options || {};
      var btn = el('button', 'pagination__btn' + (options.extraClass ? ' ' + options.extraClass : ''), label);
      btn.type = 'button';
      if (options.ariaLabel) btn.setAttribute('aria-label', options.ariaLabel);
      if (options.current) {
        btn.setAttribute('aria-current', 'page');
        btn.classList.add('is-current');
      }
      if (options.disabled) {
        btn.disabled = true;
      } else {
        btn.addEventListener('click', function () { goToPage(page, true); });
      }
      return btn;
    }

    function renderPagination(info) {
      if (!pagination) return;
      pagination.innerHTML = '';
      // Kontrol disembunyikan bila hasil kosong atau hanya 1 halaman
      pagination.hidden = info.totalPages <= 1;
      if (pagination.hidden) return;

      var list = el('ul', 'pagination__list');

      function addItem(node) {
        var li = el('li', 'pagination__item');
        li.appendChild(node);
        list.appendChild(li);
      }

      addItem(pageButton('← Previous', info.page - 1, {
        extraClass: 'pagination__btn--step',
        ariaLabel: 'Previous page',
        disabled: info.page === 1
      }));

      core.pageList(info.page, info.totalPages).forEach(function (p) {
        if (p === 'ellipsis') {
          var gap = el('span', 'pagination__ellipsis', '…');
          gap.setAttribute('aria-hidden', 'true');
          addItem(gap);
          return;
        }
        addItem(pageButton(String(p), p, {
          ariaLabel: 'Page ' + p,
          current: p === info.page
        }));
      });

      addItem(pageButton('Next →', info.page + 1, {
        extraClass: 'pagination__btn--step',
        ariaLabel: 'Next page',
        disabled: info.page === info.totalPages
      }));

      pagination.appendChild(list);
    }

    /* ---------- Render ---------- */

    function renderLoading() {
      grid.hidden = true;
      if (emptyState) emptyState.hidden = true;
      if (pagination) pagination.hidden = true;
      if (rangeLabel) rangeLabel.textContent = '';
      if (statusHost) {
        statusHost.hidden = false;
        statusHost.innerHTML = '';
        statusHost.appendChild(createStatusBox('Loading works…', null));
      }
      grid.setAttribute('aria-busy', 'true');
    }

    function renderLoadError() {
      grid.hidden = true;
      grid.innerHTML = '';
      grid.removeAttribute('aria-busy');
      if (emptyState) emptyState.hidden = true;
      if (pagination) pagination.hidden = true;
      if (rangeLabel) rangeLabel.textContent = '';
      if (countLabel) countLabel.textContent = '';
      if (statusHost) {
        statusHost.hidden = false;
        statusHost.innerHTML = '';
        statusHost.appendChild(createStatusBox(
          'Works could not be loaded',
          'Something went wrong while loading the project list. Please check your connection and try again.',
          function () { loadData(); }
        ));
      }
    }

    // Isi grid sesuai state. Mengembalikan state yang sudah dikoreksi.
    function renderCards() {
      var listing = core.computeListing(works, state);
      var info = listing.page;
      state = listing.state;

      grid.innerHTML = '';
      grid.removeAttribute('aria-busy');
      info.items.forEach(function (work, i) {
        grid.appendChild(createWorkCard(work, info.from - 1 + i, state));
      });

      var isEmpty = info.total === 0;
      grid.hidden = isEmpty;
      if (statusHost) statusHost.hidden = true;
      if (emptyState) {
        emptyState.hidden = !isEmpty;
        var noWorksAtAll = works.length === 0;
        if (emptyTitle) emptyTitle.textContent = noWorksAtAll ? 'No works published yet' : 'No works in this category yet';
        if (emptyText) emptyText.textContent = noWorksAtAll
          ? 'New projects will appear here soon.'
          : 'Check back soon, or browse every project instead.';
        if (resetBtn) resetBtn.hidden = noWorksAtAll;
      }

      if (rangeLabel) {
        rangeLabel.textContent = isEmpty ? '' :
          'Showing ' + info.from + '–' + info.to + ' of ' + info.total +
          (info.total === 1 ? ' project' : ' projects');
      }

      renderPagination(info);
      updateHeading(info.total);
      return info;
    }

    /**
     * Terapkan state baru.
     * @param {object} next      {category, sort, page}
     * @param {object} options   { push: bool, animate: bool, scroll: bool }
     */
    function apply(next, options) {
      options = options || {};
      state = {
        category: core.isValidCategory(next.category) ? next.category : core.ALL,
        sort: core.isValidSort(next.sort) ? next.sort : core.DEFAULT_SORT,
        page: next.page >= 1 ? Math.floor(next.page) : 1
      };
      syncControls();
      var seq = ++renderSeq;

      if (switchTimer) {
        clearTimeout(switchTimer);
        switchTimer = null;
        grid.classList.remove('is-switching');
        if (titleLead) titleLead.classList.remove('is-changing');
      }

      if (works === null) {
        updateHeading(0);
        writeUrl(state, options.push ? 'push' : 'replace');
        return;
      }

      function commit() {
        if (seq !== renderSeq) return; // ada pilihan yang lebih baru
        // renderCards mengoreksi halaman di luar jangkauan; URL ikut disesuaikan
        renderCards();
        writeUrl(state, options.push ? 'push' : 'replace');
        if (options.scroll) scrollToGallery();
      }

      if (!options.animate || prefersReducedMotion()) {
        commit();
        return;
      }

      grid.classList.add('is-switching');
      if (titleLead) titleLead.classList.add('is-changing');
      switchTimer = setTimeout(function () {
        switchTimer = null;
        commit();
        // reflow agar transisi fade-in berjalan
        void grid.offsetWidth;
        grid.classList.remove('is-switching');
        if (titleLead) titleLead.classList.remove('is-changing');
      }, FILTER_FADE_MS);
    }

    function scrollToGallery() {
      var target = toolbar || grid;
      var top = target.getBoundingClientRect().top + window.pageYOffset - 110; // ruang navbar
      window.scrollTo({ top: Math.max(0, top), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }

    function goToPage(page, fromControl) {
      apply({ category: state.category, sort: state.sort, page: page },
        { push: true, animate: false, scroll: fromControl });
      // Fokus pindah ke awal hasil agar pengguna keyboard tidak tertinggal
      if (fromControl && rangeLabel) rangeLabel.focus({ preventScroll: true });
    }

    /* ---------- Event ---------- */

    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-filter');
        if (id === state.category && state.page === 1) return;
        // Ganti kategori → halaman 1, sort dipertahankan
        apply({ category: id, sort: state.sort, page: 1 }, { push: true, animate: true });
      });
    });

    if (sortSelect) {
      sortSelect.addEventListener('change', function () {
        // Ganti sort → halaman 1, kategori dipertahankan
        apply({ category: state.category, sort: sortSelect.value, page: 1 }, { push: true, animate: true });
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        apply({ category: core.ALL, sort: state.sort, page: 1 }, { push: true, animate: true });
      });
    }

    // Back / Forward browser
    window.addEventListener('popstate', function () {
      apply(core.readListState(window.location.search), { push: false, animate: false });
    });

    /* ---------- Muat data ---------- */

    function loadData() {
      renderLoading();
      store.load().then(function (data) {
        works = data.works;
        updateFilterCounts();
        // Ambil state terbaru dari URL (pengguna mungkin sudah klik saat loading)
        apply(state, { push: false, animate: false });
      }, function (err) {
        console.error('Gagal memuat data karya:', err);
        renderLoadError();
      });
    }

    syncControls();
    // Normalisasi URL tidak valid (mis. ?page=abc, ?sort=x) sejak awal
    writeUrl(state, 'replace');
    loadData();
  }

  /* ------------------------------------------------------------------------
     Halaman detail (project.html)
     ------------------------------------------------------------------------ */

  function initProjectPage() {
    var root = document.getElementById('project-root');
    if (!root) return;

    var slug = getParam('id');
    root.setAttribute('aria-busy', 'true');
    // Konteks galeri asal (sudah divalidasi; nilai asing diabaikan)
    var hasContext = ['category', 'sort', 'page'].some(function (k) { return getParam(k) !== null; });
    var listState = hasContext ? core.readListState(window.location.search) : null;

    store.load().then(function (data) {
      var works = data.works;
      var work = core.findBySlug(works, slug);

      if (!work) {
        // Slug lama yang sudah diganti di CMS → arahkan ke slug baru
        var moved = core.findByPreviousSlug(works, slug);
        if (moved) {
          window.location.replace(projectHref(moved, listState));
          return;
        }
        renderNotFound(root, slug);
        return;
      }
      root.removeAttribute('aria-busy');
      renderProject(work, works, listState);
    }, function (err) {
      console.error('Gagal memuat data karya:', err);
      renderLoadFailed(root);
    });
  }

  function renderProject(work, works, listState) {
    document.title = work.title + ' — Jundannz Portfolio';

    setText('project-title', work.title);
    setText('project-desc', work.description || 'No description has been added yet.');
    setText('project-eyebrow', core.categoryLabel(work.category).toLowerCase() + ' project');
    setText('project-window-name', 'viewing: ' + work.slug);

    var categoryEl = document.getElementById('project-category');
    if (categoryEl) categoryEl.textContent = core.categoryLabel(work.category);

    // Tombol kembali: ke posisi galeri asal bila ada, jika tidak ke kategori karya ini
    var backBtn = document.getElementById('project-back');
    if (backBtn) {
      if (listState) {
        backBtn.href = 'works.html' + core.listStateToSearch(listState);
        backBtn.textContent = '← Back to works';
      } else {
        backBtn.href = 'works.html' + core.listStateToSearch({ category: work.category, sort: core.DEFAULT_SORT, page: 1 });
        backBtn.textContent = '← Back to ' + core.categoryLabel(work.category) + ' works';
      }
    }

    var mediaHost = document.getElementById('project-media');
    if (mediaHost) {
      mediaHost.innerHTML = '';
      mediaHost.appendChild(renderProjectMedia(work));
    }

    var toolsEl = document.getElementById('project-tools');
    if (toolsEl) {
      toolsEl.innerHTML = '';
      if (work.tools.length) {
        work.tools.forEach(function (tool) { toolsEl.appendChild(el('span', 'tool-tag', tool)); });
      } else {
        toolsEl.appendChild(el('span', 'project-note', 'Not specified.'));
      }
    }

    // Tautan asli (Drive / Instagram / GitHub) sebagai tombol bergaya modal preview.exe
    var linksEl = document.getElementById('project-links');
    if (linksEl) {
      linksEl.innerHTML = '';
      if (work.links.length) {
        work.links.forEach(function (link) {
          var a = el('a', 'project-link');
          a.href = link.url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.appendChild(el('span', 'project-link__title', 'Open on ' + link.label + '\u00a0↗'));
          a.appendChild(el('span', 'project-link__sub', 'View the original'));
          linksEl.appendChild(a);
        });
      } else {
        linksEl.appendChild(el('p', 'project-note', 'No external link for this project yet.'));
      }

      var dm = el('a', 'project-link');
      dm.href = 'https://instagram.com/jundnn._';
      dm.target = '_blank';
      dm.rel = 'noopener noreferrer';
      dm.appendChild(el('span', 'project-link__title', 'Need something similar?'));
      dm.appendChild(el('span', 'project-link__sub', 'DM me on Instagram'));
      linksEl.appendChild(dm);
    }

    // "More works": utamakan kategori yang sama, maksimal 3 kartu
    var moreGrid = document.getElementById('more-works-grid');
    if (moreGrid) {
      moreGrid.innerHTML = '';
      var picks = core.pickMoreWorks(works, work, 3);
      var moreSection = document.getElementById('more-works');
      if (!picks.length) {
        if (moreSection) moreSection.hidden = true;
      } else {
        picks.forEach(function (item, i) { moreGrid.appendChild(createWorkCard(item, i, listState)); });
      }
    }
  }

  function renderMessage(root, title, text, eyebrow) {
    setText('project-eyebrow', eyebrow);
    root.removeAttribute('aria-busy');
    root.innerHTML = '';
    var box = el('div', 'empty-state');
    box.setAttribute('role', 'alert');
    box.appendChild(el('h1', 'empty-state__title', title));
    box.appendChild(el('p', 'empty-state__text', text));
    return box;
  }

  // Tampilan saat ID karya tidak ada / tidak dikenal / sudah di-unpublish
  function renderNotFound(root, slug) {
    document.title = 'Project not found — Jundannz Portfolio';
    var box = renderMessage(root, 'Project not found', slug
      ? 'There is no project called "' + slug + '". The link may be wrong or the project was removed.'
      : 'This link does not include a project ID. Please pick a project from the archive.', 'error 404');
    var back = el('a', 'back-btn', 'Browse all works');
    back.href = 'works.html';
    box.appendChild(back);
    root.appendChild(box);
  }

  function renderLoadFailed(root) {
    document.title = 'Project unavailable — Jundannz Portfolio';
    var box = renderMessage(root, 'Project could not be loaded',
      'Something went wrong while loading this project. Please check your connection and try again.', 'error');
    var retry = el('button', 'back-btn', 'Try again');
    retry.type = 'button';
    retry.addEventListener('click', function () { window.location.reload(); });
    box.appendChild(retry);
    root.appendChild(box);
  }

  /* ------------------------------------------------------------------------
     Landing page (index.html) — karya featured di bagian "my works"
     Markup & class mengikuti kartu lama agar tampilan tidak berubah.
     Filter & modal preview.exe tetap ditangani js/script.js.
     ------------------------------------------------------------------------ */

  var LANDING_CARD_CLASSES = ['frame-16', 'frame-19', 'frame-21', 'frame-22', 'frame-24', 'frame-26'];
  var LANDING_TOOL_CLASSES = ['frame-18', 'frame-23', 'frame-20'];

  function createLandingCard(work, index) {
    var a = el('a', LANDING_CARD_CLASSES[index % LANDING_CARD_CLASSES.length]);
    a.href = projectHref(work, null);
    a.setAttribute('data-slug', work.slug);
    a.setAttribute('data-media-type', work.media.type);
    if (work.media.src) a.setAttribute('data-video', work.media.src);
    if (work.links.length) a.setAttribute('data-link', work.links[0].url);
    if (work.media.type === 'youtube' && work.media.youtubeId) a.setAttribute('data-youtube', work.media.youtubeId);

    var img = createImage(work.thumbnail, work.title, 'No thumbnail has been added yet.', { card: true });
    if (img.tagName === 'IMG') img.className = 'rectangle-3';
    else img.classList.add('rectangle-3');
    a.appendChild(img);

    var text = el('div', 'frame-17');
    text.appendChild(el('h3', 'text-wrapper-12', work.title));
    text.appendChild(el('p', 'text-wrapper-14', work.description || ''));
    a.appendChild(text);

    if (work.tools.length) {
      var tools = el('div', 'frame-25');
      tools.style.marginTop = 'auto';
      work.tools.forEach(function (tool, i) {
        var pill = el('div', LANDING_TOOL_CLASSES[i % LANDING_TOOL_CLASSES.length]);
        pill.appendChild(el('span', 'text-wrapper-13', tool));
        tools.appendChild(pill);
      });
      a.appendChild(tools);
    }
    return a;
  }

  function initFeaturedWorks() {
    var host = document.querySelector('[data-featured-root]');
    if (!host) return;

    store.load().then(function (data) {
      host.innerHTML = '';
      var groups = core.CATEGORIES.map(function (cat) {
        return { id: cat.id, items: core.pickFeatured(data.works, cat.id, FEATURED_LIMIT) };
      });

      var any = false;
      groups.forEach(function (group) {
        if (!group.items.length) {
          // Kategori tanpa karya featured tetap punya pesan kosong
          var empty = el('div', 'frame-15 filter-item featured-empty ' + group.id);
          empty.style.display = 'none';
          empty.appendChild(el('p', 'featured-note', 'No featured works here yet.'));
          host.appendChild(empty);
          return;
        }
        any = true;
        // Baris berisi 3 kartu, sama seperti layout lama
        for (var i = 0; i < group.items.length; i += 3) {
          var row = el('div', 'frame-15 filter-item ' + group.id);
          row.style.display = 'none';
          group.items.slice(i, i + 3).forEach(function (work, j) {
            row.appendChild(createLandingCard(work, i + j));
          });
          host.appendChild(row);
        }
      });

      if (!any) host.setAttribute('data-empty', 'true');
      document.dispatchEvent(new CustomEvent('portfolio:featured-rendered'));
    }, function (err) {
      console.error('Gagal memuat karya featured:', err);
      host.innerHTML = '';
      var box = el('div', 'featured-status');
      box.setAttribute('role', 'alert');
      box.appendChild(el('p', 'featured-note', 'Works could not be loaded right now.'));
      var link = el('a', 'featured-link', 'Open the full archive →');
      link.href = 'works.html';
      box.appendChild(link);
      host.appendChild(box);
    });
  }

  /* ------------------------------------------------------------------------
     Inisialisasi
     ------------------------------------------------------------------------ */

  function init() {
    initGalleryPage();
    initProjectPage();
    initFeaturedWorks();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
