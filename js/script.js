/* ==========================================================================
   INTERAKSI LANDING PAGE (index.html)
   --------------------------------------------------------------------------
   Isi file ini:
   1. Navigasi & menu mobile (termasuk overlay dan penutupan via Escape)
   2. Scroll progress, navbar mengambang, dan penanda menu aktif
   3. Filter kategori pada bagian "My Works"
   4. Form kontak (Formspree)
   5. Modal "My Store"
   6. Efek 3D tilt pada kartu skill
   7. Modal "preview.exe" untuk kartu karya + tautan ke halaman detail
   8. Jendela portfolio yang bisa digeser (drag) + tombol reset

   Catatan: logika easter egg (mini game) ada di js/dino.js.
   Data karya publik dimuat dari data/works.json hasil build.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {

    /* ----------------------------------------------------------------------
       1. Navigasi & menu mobile
       ---------------------------------------------------------------------- */
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navMenu = document.getElementById('mobile-menu');
    const storeBtnNav = document.getElementById('store-btn-nav');
    const navbar = document.querySelector('.navbar');
    const body = document.body;

    // Overlay gelap di belakang menu mobile; dibuat sekali saja.
    let overlay = document.querySelector('.menu-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'menu-overlay';
        body.appendChild(overlay);
    }

    // Sinkronkan status aria-expanded pada tombol hamburger
    function setMenuExpanded(isOpen) {
        if (hamburgerBtn) hamburgerBtn.setAttribute('aria-expanded', String(isOpen));
        if (hamburgerBtn) hamburgerBtn.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
    }

    function openMenu() {
        if (!hamburgerBtn || !navMenu) return;

        hamburgerBtn.classList.add('active');
        navMenu.classList.add('active');
        storeBtnNav?.classList.add('active');
        overlay.classList.add('active');
        body.classList.add('menu-open');
        setMenuExpanded(true);
    }

    /**
     * Menutup menu mobile.
     * @param {boolean} immediate true = lepas kunci scroll saat itu juga
     *        (dipakai saat pengunjung memilih menu, agar halaman bisa langsung
     *        di-scroll ke section tujuan).
     */
    function closeMenu(immediate = false) {
        if (!hamburgerBtn || !navMenu) return;

        hamburgerBtn.classList.remove('active');
        navMenu.classList.remove('active');
        storeBtnNav?.classList.remove('active');
        overlay.classList.remove('active');
        setMenuExpanded(false);

        if (immediate) {
            body.classList.remove('menu-open');
            return;
        }

        // Delay agar animasi slide-out selesai lebih dulu sebelum scroll dibuka
        setTimeout(() => {
            if (navMenu && !navMenu.classList.contains('active')) {
                body.classList.remove('menu-open');
            }
        }, 500);
    }

    function toggleMenu() {
        if (navMenu?.classList.contains('active')) {
            closeMenu();
        } else {
            openMenu();
        }
    }

    function smoothScrollTo(targetId) {
        const targetSection = document.querySelector(targetId);
        if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // Semua tautan anchor internal (#section)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            const isMobileMenuLink = this.closest('.navbar-2') || this.id === 'store-btn-nav';

            if (isMobileMenuLink && navMenu?.classList.contains('active')) {
                if (this.id !== 'store-btn-nav') {
                    // Tutup menu tanpa delay agar scroll ke section tidak terblokir
                    closeMenu(true);
                }
            }

            if (targetId && targetId.startsWith('#') && targetId !== '#') {
                e.preventDefault();
                smoothScrollTo(targetId);
            }
        });
    });

    hamburgerBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu();
    });

    overlay?.addEventListener('click', () => {
        closeMenu();
    });

    // Logo mengarah ke bagian paling atas halaman.
    // Di halaman works.html / project.html tidak ada #hero, jadi logo dibiarkan
    // berjalan normal sebagai tautan ke index.html.
    const logo = document.querySelector('.logo');
    logo?.addEventListener('click', (e) => {
        if (!document.querySelector('#hero')) return;
        e.preventDefault();

        if (navMenu?.classList.contains('active')) {
            closeMenu(true);
        }

        smoothScrollTo('#hero');
    });

    // Escape menutup menu mobile
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu?.classList.contains('active')) {
            closeMenu();
        }
    });

    /* ----------------------------------------------------------------------
       2. Scroll progress, navbar mengambang, dan menu aktif
       ---------------------------------------------------------------------- */
    const sections = document.querySelectorAll('.final section[id]');
    const navLinks = document.querySelectorAll('.navbar-2 a[href^="#"]');
    const navbarHeight = 70;
    const threshold = navbarHeight + 100;

    const scrollProgress = document.getElementById('scroll-progress');
    let docHeight = 0;
    let winHeight = 0;
    let scrollable = 0;

    function getScrollY() {
        const se = document.scrollingElement || document.documentElement;
        return Math.max(
            window.scrollY || 0,
            window.pageYOffset || 0,
            se.scrollTop || 0,
            document.documentElement.scrollTop || 0,
            document.body.scrollTop || 0
        );
    }

    function updateActiveLink(scrollPos) {
        // Halaman tanpa section (works.html / project.html) menandai menu aktif
        // langsung di HTML, jadi jangan ditimpa di sini.
        if (sections.length === 0) return;
        let currentSection = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;

            if (scrollPos >= sectionTop - threshold &&
                scrollPos < sectionTop + sectionHeight - threshold) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            const href = link.getAttribute('href').replace('#', '');
            link.classList.toggle('active', href === currentSection);
        });
    }

    function updateDimensions() {
        docHeight = Math.max(
            document.body.scrollHeight, document.documentElement.scrollHeight,
            document.body.offsetHeight, document.documentElement.offsetHeight
        );
        winHeight = window.innerHeight;
        scrollable = Math.max(0, docHeight - winHeight);
    }

    function handleScrollUpdate() {
        const scrollY = getScrollY();

        updateActiveLink(scrollY);

        // Navbar berubah menjadi kapsul mengambang setelah halaman di-scroll
        navbar?.classList.toggle('floating', scrollY > 10);

        // Indikator progress scroll di bagian paling atas
        if (scrollProgress && scrollable > 0) {
            const scrolled = Math.min((scrollY / scrollable) * 100, 100);
            scrollProgress.style.width = scrolled + '%';
        }
    }

    window.addEventListener('scroll', handleScrollUpdate, { passive: true });
    document.addEventListener('scroll', handleScrollUpdate, { passive: true });

    window.addEventListener('resize', () => {
        updateDimensions();
        handleScrollUpdate();
    }, { passive: true });

    updateDimensions();
    handleScrollUpdate();

    /* ----------------------------------------------------------------------
       3. Filter kategori "My Works"
       ---------------------------------------------------------------------- */
    // Dibatasi ke section #works di landing page; halaman works.html punya
    // logika filter sendiri di js/pages.js meski memakai class tombol yang sama.
    const filterBtns = document.querySelectorAll('#works .filter-btn');
    let activeWorkFilter = 'all-view';
    let filterTimeout = null;

    function applyFilter(filterValue) {
        activeWorkFilter = filterValue;
        const filterItems = document.querySelectorAll('#works .filter-item');
        // Batalkan transisi yang masih berjalan agar klik cepat tidak bentrok
        if (filterTimeout) {
            clearTimeout(filterTimeout);
            filterTimeout = null;
        }

        filterBtns.forEach(btn => {
            const isActive = btn.getAttribute('data-filter') === filterValue;
            btn.setAttribute('aria-pressed', String(isActive));
            btn.classList.toggle('active', isActive);
        });

        // Tampilkan/sembunyikan kelompok kartu sesuai kategori
        const showItems = () => {
            filterItems.forEach(item => {
                const isAllView = filterValue === 'all-view';
                const matches = isAllView
                    ? item.classList.contains('all-view')
                    : item.classList.contains(filterValue);

                if (matches) {
                    item.style.display = 'flex';
                    // Paksa reflow sebelum menambah .show agar transisi berjalan
                    void item.offsetWidth;
                    item.classList.add('show');
                } else {
                    item.style.display = 'none';
                    item.classList.remove('show');
                }
            });
        };

        const visibleItems = Array.from(filterItems).filter(item => item.classList.contains('show'));

        if (visibleItems.length > 0) {
            // Fade out dulu, baru tukar isi (250ms sesuai durasi transisi CSS)
            visibleItems.forEach(item => item.classList.remove('show'));
            filterTimeout = setTimeout(() => {
                showItems();
                filterTimeout = null;
            }, 250);
        } else {
            showItems();
        }
    }

    document.addEventListener('portfolio:featured-rendered', () => applyFilter(activeWorkFilter));
    if (filterBtns.length > 0) applyFilter('all-view');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            applyFilter(btn.getAttribute('data-filter'));
        });
    });

    /* ----------------------------------------------------------------------
       4. Form kontak (Formspree)
       ---------------------------------------------------------------------- */
    const contactForm = document.getElementById('contact-form');

    contactForm?.addEventListener('submit', function (event) {
        event.preventDefault();

        const submitBtn = this.querySelector('button[type="submit"]');
        const btnText = submitBtn?.querySelector('.text-wrapper-3');
        if (!submitBtn || !btnText) return;

        const originalText = btnText.textContent || 'SEND MESSAGE ➔';

        submitBtn.disabled = true;
        btnText.textContent = 'SENDING...';

        const formspreeEndpoint = 'https://formspree.io/f/xdarwgvg';

        fetch(formspreeEndpoint, {
            method: 'POST',
            body: new FormData(this),
            headers: { 'Accept': 'application/json' }
        })
            .then(response => {
                // Lempar error di sini supaya ditangani oleh .catch di bawah
                if (!response.ok) {
                    return response.json().then(data => {
                        throw new Error((data && data.error) || 'Gagal mengirim pesan');
                    });
                }

                btnText.textContent = 'MESSAGE SENT! ✓';
                submitBtn.style.backgroundColor = '#0b6b4f';
                this.reset();
                setTimeout(() => {
                    btnText.textContent = originalText;
                    submitBtn.disabled = false;
                    submitBtn.style.backgroundColor = '';
                }, 3000);
            })
            .catch((error) => {
                console.error('Gagal mengirim pesan:', error);
                btnText.textContent = 'FAILED - TRY AGAIN';
                submitBtn.style.backgroundColor = '#b23a2e';
                setTimeout(() => {
                    btnText.textContent = originalText;
                    submitBtn.disabled = false;
                    submitBtn.style.backgroundColor = '';
                }, 3000);
            });
    });

    /* ----------------------------------------------------------------------
       5. Modal "My Store"
       ---------------------------------------------------------------------- */
    const storeModal = document.getElementById('store-modal');
    const closeStoreModalBtn = storeModal?.querySelector('.close-modal');

    if (storeBtnNav && storeModal) {
        storeBtnNav.addEventListener('click', function (e) {
            e.preventDefault();
            storeModal.classList.add('active');

            if (navMenu?.classList.contains('active')) {
                closeMenu();
            }
        });
    }

    closeStoreModalBtn?.addEventListener('click', function () {
        storeModal?.classList.remove('active');
    });

    if (storeModal) {
        storeModal.addEventListener('click', function (e) {
            if (e.target === storeModal) {
                storeModal.classList.remove('active');
            }
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && storeModal?.classList.contains('active')) {
            storeModal.classList.remove('active');
        }
    });

    /* ----------------------------------------------------------------------
       6. Efek 3D tilt pada kartu skill
       Kartu kini HTML/CSS (bukan satu gambar), jadi yang dimiringkan adalah
       elemen kartu itu sendiri agar animasi tetap sama.
       ---------------------------------------------------------------------- */
    const skillCards = document.querySelectorAll('.frame-33 .skill-card');

    skillCards.forEach(card => {
        const baseTilt = getComputedStyle(card).getPropertyValue('--tilt').trim() || '0deg';

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // Angka 12 menentukan intensitas kemiringan
            const rotateX = ((y - centerY) / centerY) * -12;
            const rotateY = ((x - centerX) / centerX) * 12;

            card.style.transform = `rotate(${baseTilt}) translateY(-8px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
        });

        card.addEventListener('mouseenter', () => {
            card.style.transition = 'transform 0.1s ease-out';
        });
    });

    /* ----------------------------------------------------------------------
       7. Modal "preview.exe" (pratinjau cepat kartu karya)
       ----------------------------------------------------------------------
       Kartu karya di landing page membuka pratinjau singkat. Dari pratinjau ini
       pengunjung bisa membuka halaman detail internal (project.html?id=...)
       yang URL-nya bisa dibagikan dan dibuka langsung.
       ---------------------------------------------------------------------- */
    const workModal = document.getElementById('work-modal');

    if (workModal) {
        const workModalTitle = document.getElementById('work-modal-title');
        const workModalDesc = document.getElementById('work-modal-desc');
        const workModalImg = document.getElementById('work-modal-img');
        const workModalIframe = document.getElementById('work-modal-iframe');
        const workModalVideo = document.getElementById('work-modal-video');
        const workModalLink = document.getElementById('work-modal-link');
        const workModalDetail = document.getElementById('work-modal-detail');

        // Hentikan semua media & kosongkan src agar tidak terus memutar/memuat
        function cleanupWorkModal() {
            workModal.classList.remove('active');
            if (workModalVideo) {
                workModalVideo.pause();
                workModalVideo.removeAttribute('src');
                workModalVideo.load();
            }
            if (workModalIframe) workModalIframe.src = '';
        }

        document.querySelector('[data-featured-root]')?.addEventListener('click', (e) => {
                const item = e.target.closest('a[data-slug]');
                if (!item || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
                e.preventDefault();

                const title = item.querySelector('.text-wrapper-12')?.textContent || 'My Work';
                const desc = item.querySelector('.text-wrapper-14, .p')?.textContent || '';
                const imgSrc = item.querySelector('img')?.src || '';
                const link = item.getAttribute('data-link') || '#';
                const slug = item.getAttribute('data-slug');

                if (workModalTitle) workModalTitle.textContent = title;
                if (workModalDesc) workModalDesc.textContent = desc;

                // Tombol "halaman detail" hanya tampil jika kartu punya data-slug
                if (workModalDetail) {
                    if (slug) {
                        workModalDetail.href = 'project.html?id=' + encodeURIComponent(slug);
                        workModalDetail.hidden = false;
                    } else {
                        workModalDetail.hidden = true;
                    }
                }

                // Tautan file asli (Instagram / Drive / GitHub)
                if (workModalLink) {
                    if (link && link !== '#') {
                        workModalLink.href = link;
                        workModalLink.hidden = false;
                    } else {
                        workModalLink.hidden = true;
                    }
                }

                // Reset media yang mungkin masih aktif dari kartu sebelumnya
                if (workModalImg) workModalImg.style.display = 'none';
                if (workModalIframe) {
                    workModalIframe.style.display = 'none';
                    workModalIframe.src = '';
                }
                if (workModalVideo) {
                    workModalVideo.style.display = 'none';
                    workModalVideo.pause();
                    workModalVideo.removeAttribute('src');
                }

                // Jenis media CMS menjadi acuan; tautan tambahan tetap tersedia.
                const youtubeId = item.getAttribute('data-youtube');
                const videoSrc = item.getAttribute('data-video');
                if (youtubeId && workModalIframe) {
                    workModalIframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(youtubeId);
                    workModalIframe.style.display = 'block';
                } else if (videoSrc && workModalVideo) {
                    workModalVideo.src = videoSrc;
                    workModalVideo.preload = 'metadata';
                    workModalVideo.controls = true;
                    workModalVideo.autoplay = false;
                    workModalVideo.style.display = 'block';
                } else if (/^https:\/\/(?:www\.)?instagram\.com\/(?:p|reel)\//.test(link) && workModalIframe) {
                    workModalIframe.src = link.split('?')[0].replace(/\/$/, '') + '/embed/';
                    workModalIframe.style.display = 'block';
                } else if (workModalImg) {
                    if (imgSrc) workModalImg.src = imgSrc;
                    else workModalImg.removeAttribute('src');
                    workModalImg.alt = imgSrc ? title : 'Media not available. Open project details.';
                    workModalImg.style.display = 'block';
                }

                workModal.classList.add('active');

                if (navMenu?.classList.contains('active')) {
                    closeMenu();
                }
        });

        workModal.addEventListener('click', (e) => {
            if (e.target === workModal) {
                cleanupWorkModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && workModal.classList.contains('active')) {
                cleanupWorkModal();
            }
        });
    }

    /* ----------------------------------------------------------------------
       8. Jendela portfolio yang bisa digeser (drag)
       ---------------------------------------------------------------------- */
    const dragElement = document.querySelector('.frame-28');
    const dragHandle = document.querySelector('.frame-30');
    const easterEgg = document.querySelector('.easter-egg-container');
    const offsetXEl = document.getElementById('offset-x');
    const offsetYEl = document.getElementById('offset-y');
    const resetBtn = document.getElementById('reset-position-btn');

    if (dragElement && dragHandle) {
        let active = false;
        let currentX = 0;
        let currentY = 0;
        let initialX = 0;
        let initialY = 0;
        let xOffset = 0;
        let yOffset = 0;

        dragHandle.addEventListener('mousedown', dragStart);
        document.addEventListener('mouseup', dragEnd);
        document.addEventListener('mousemove', drag);

        dragHandle.addEventListener('touchstart', dragStart, { passive: false });
        document.addEventListener('touchend', dragEnd);
        document.addEventListener('touchmove', drag, { passive: false });

        function dragStart(e) {
            if (e.type === 'touchstart') {
                initialX = e.touches[0].clientX - xOffset;
                initialY = e.touches[0].clientY - yOffset;
            } else {
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
            }

            // Hanya mulai drag bila target adalah header atau isinya
            if (e.target === dragHandle || dragHandle.contains(e.target)) {
                active = true;
                dragElement.classList.add('dragging');
                if (e.cancelable) {
                    e.preventDefault();
                }
            }
        }

        function dragEnd() {
            initialX = currentX;
            initialY = currentY;
            active = false;
            dragElement.classList.remove('dragging');
        }

        function drag(e) {
            if (!active) return;

            if (e.cancelable) {
                e.preventDefault();
            }

            if (e.type === 'touchmove') {
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
            } else {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
            }

            xOffset = currentX;
            yOffset = currentY;

            // Geser sedikit => munculkan tombol reset dan aktifkan easter egg
            if (Math.abs(currentX) > 5 || Math.abs(currentY) > 5) {
                resetBtn?.classList.add('visible');
                dragElement.querySelector('.frame-30')?.classList.add('reset-active');
                easterEgg?.classList.add('active');
                // Panel easter egg kini terlihat, jadi boleh difokus keyboard
                easterEgg?.removeAttribute('inert');

                document.querySelector('.drag-hint-text')?.classList.add('hidden');
            }

            // Perbarui koordinat di terminal easter egg
            if (offsetXEl) offsetXEl.textContent = Math.round(currentX);
            if (offsetYEl) offsetYEl.textContent = Math.round(currentY);

            dragElement.style.transform = `translate(${currentX}px, ${currentY}px)`;
        }

        if (resetBtn) {
            // Cegah drag ikut aktif saat tombol reset ditekan
            resetBtn.addEventListener('mousedown', (e) => e.stopPropagation());
            resetBtn.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });

            resetBtn.addEventListener('click', (e) => {
                e.stopPropagation();

                // Kembali ke posisi awal dengan animasi pegas
                dragElement.style.transition = 'transform 0.45s cubic-bezier(0.5, 0, 0, 1)';
                dragElement.style.transform = 'translate(0px, 0px)';

                currentX = 0;
                currentY = 0;
                xOffset = 0;
                yOffset = 0;
                initialX = 0;
                initialY = 0;

                resetBtn.classList.remove('visible');
                dragElement.querySelector('.frame-30')?.classList.remove('reset-active');
                easterEgg?.classList.remove('active');
                // Sembunyikan lagi panel easter egg dari keyboard
                easterEgg?.setAttribute('inert', '');

                // Reset juga status mini game di js/dino.js
                if (typeof window.resetDinoGame === 'function') {
                    window.resetDinoGame();
                }

                setTimeout(() => {
                    dragElement.style.transition = '';
                }, 500);
            });
        }
    }
});
