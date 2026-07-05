
document.addEventListener('DOMContentLoaded', function () {

    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navMenu = document.getElementById('mobile-menu');
    const contactBtnNav = document.getElementById('store-btn-nav');
    const navbar = document.querySelector('.navbar');
    const body = document.body;

    let overlay = document.querySelector('.menu-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'menu-overlay';
        body.appendChild(overlay);
    }

    // menu state
    function openMenu() {
        if (!hamburgerBtn || !navMenu) return;

        hamburgerBtn.classList.add('active');
        navMenu.classList.add('active');
        contactBtnNav?.classList.add('active');
        overlay.classList.add('active');
        body.classList.add('menu-open');
    }

    function closeMenu() {
        if (!hamburgerBtn || !navMenu) return;

        hamburgerBtn.classList.remove('active');
        navMenu.classList.remove('active');
        contactBtnNav?.classList.remove('active');
        overlay.classList.remove('active');

        // Delay removing menu-open from body to allow slide-out transition to finish smoothly
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

    // Scroll handler
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {

            const targetId = this.getAttribute('href');
            const isMobileMenuLink = this.closest('.navbar-2') || this.id === 'store-btn-nav';

            if (isMobileMenuLink && navMenu.classList.contains('active')) {
                if (this.id !== 'store-btn-nav') {
                    closeMenu();
                }
            }
            if (targetId && targetId.startsWith('#') && targetId !== '#') {
                e.preventDefault();
                smoothScrollTo(targetId);
            }
        });
    });

    // Hamburger click
    hamburgerBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu();
    });

    // Overlay click
    overlay?.addEventListener('click', () => {
        closeMenu();
    });

    // Logo click
    const logo = document.querySelector('.logo');
    logo?.addEventListener('click', (e) => {
        e.preventDefault();

        if (navMenu.classList.contains('active')) {
            closeMenu();
        }

        smoothScrollTo('#hero');
    });

    // Highlight active nav link on scroll
    const sections = document.querySelectorAll('.final section[id]');
    const navLinks = document.querySelectorAll('.navbar-2 a[href^="#"]');
    const navbarHeight = 70;
    const threshold = navbarHeight + 100;

    function updateActiveLink(scrollPos) {
        if (scrollPos === undefined) scrollPos = getScrollY();
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

            if (href === currentSection) {
                if (!link.classList.contains('active')) link.classList.add('active');
            } else {
                if (link.classList.contains('active')) link.classList.remove('active');
            }
        });
    }

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

        // Floating navbar
        if (scrollY > 10) {
            navbar?.classList.add('floating');
        } else {
            navbar?.classList.remove('floating');
        }

        // Scroll Progress
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

    // Initial setup
    updateDimensions();
    handleScrollUpdate();

    // Filter btn
    const filterBtns = document.querySelectorAll('.filter-btn');
    const filterItems = document.querySelectorAll('.filter-item');

    let filterTimeout = null;

    function applyFilter(filterValue) {
        // Clear any pending transition timeout to handle rapid clicking safely
        if (filterTimeout) {
            clearTimeout(filterTimeout);
            filterTimeout = null;
        }

        filterBtns.forEach(btn => {
            const isActive = btn.getAttribute('data-filter') === filterValue;
            btn.setAttribute('aria-pressed', isActive);
            btn.classList.toggle('active', isActive);
        });

        const visibleItems = Array.from(filterItems).filter(item => item.classList.contains('show'));

        if (visibleItems.length > 0) {
            // First, trigger fade out animation on all visible items
            visibleItems.forEach(item => {
                item.classList.remove('show');
            });

            // Wait for fade out transition (250ms matches the CSS transition duration)
            filterTimeout = setTimeout(() => {
                filterItems.forEach(item => {
                    const hasCategory = item.classList.contains(filterValue);
                    const isAllView = filterValue === 'all-view';

                    if ((isAllView && item.classList.contains('all-view')) ||
                        (!isAllView && hasCategory)) {
                        item.style.display = 'flex';
                        // Force layout reflow before adding .show class to trigger the transition
                        void item.offsetWidth;
                        item.classList.add('show');
                    } else {
                        item.style.display = 'none';
                    }
                });
                filterTimeout = null;
            }, 250);
        } else {
            // Initial call (e.g. page load) has no visible elements animating out
            filterItems.forEach(item => {
                const hasCategory = item.classList.contains(filterValue);
                const isAllView = filterValue === 'all-view';

                if ((isAllView && item.classList.contains('all-view')) ||
                    (!isAllView && hasCategory)) {
                    item.style.display = 'flex';
                    void item.offsetWidth;
                    item.classList.add('show');
                } else {
                    item.style.display = 'none';
                }
            });
        }
    }

    if (filterBtns.length > 0) applyFilter('all-view');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filterValue = btn.getAttribute('data-filter');
            applyFilter(filterValue);
        });
    });

    // Form handler
    const contactForm = document.getElementById('contact-form');

    contactForm?.addEventListener('submit', function (event) {
        event.preventDefault();

        const submitBtn = this.querySelector('button[type="submit"]');
        const btnText = submitBtn?.querySelector('.text-wrapper-3');
        const originalText = btnText?.textContent || 'SEND MESSAGE ➔';

        if (!submitBtn || !btnText) return;

        submitBtn.disabled = true;
        btnText.textContent = 'SENDING...';

        // Masukkan URL endpoint lengkap dari Formspree di sini
        const formspreeEndpoint = 'https://formspree.io/f/xdarwgvg';

        fetch(formspreeEndpoint, {
            method: 'POST',
            body: new FormData(this),
            headers: {
                'Accept': 'application/json'
            }
        })
            .then(response => {
                if (response.ok) {
                    btnText.textContent = 'MESSAGE SENT! ✓';
                    submitBtn.style.backgroundColor = '#3ABEAB';
                    this.reset();
                    setTimeout(() => {
                        btnText.textContent = originalText;
                        submitBtn.disabled = false;
                        submitBtn.style.backgroundColor = '';
                    }, 3000);
                } else {
                    response.json().then(data => {
                        console.error('Formspree error:', data);
                        throw new Error('Gagal mengirim pesan');
                    });
                }
            })
            .catch((error) => {
                console.error('Fetch error:', error);
                btnText.textContent = 'FAILED - TRY AGAIN';
                submitBtn.style.backgroundColor = '#ff6b6b';
                setTimeout(() => {
                    btnText.textContent = originalText;
                    submitBtn.disabled = false;
                    submitBtn.style.backgroundColor = '';
                }, 3000);
            });
    });

    // Store
    const storeBtn = document.getElementById('store-btn-nav');
    const storeModal = document.getElementById('store-modal');
    const closeModalBtn = document.querySelector('.close-modal');

    if (storeBtn && storeModal) {
        storeBtn.addEventListener('click', function (e) {
            e.preventDefault();
            storeModal.classList.add('active');

            if (navMenu && navMenu.classList.contains('active')) {
                closeMenu();
            }
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function () {
            storeModal.classList.remove('active');
        });
    }

    if (storeModal) {
        storeModal.addEventListener('click', function (e) {
            if (e.target === storeModal) {
                storeModal.classList.remove('active');
            }
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && storeModal.classList.contains('active')) {
            storeModal.classList.remove('active');
        }
    });

    // 3D Tilt Effect for Skill Cards
    const skillCards = document.querySelectorAll('.frame-33 article');

    skillCards.forEach(card => {
        const img = card.querySelector('img');
        if (!img) return;

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // Adjust rotation multipliers (e.g., 10 and -10) to control tilt intensity
            const rotateX = ((y - centerY) / centerY) * -15;
            const rotateY = ((x - centerX) / centerX) * 15;

            img.style.transform = `scale(1.03) translateY(-8px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            // keep the 0.1s transition from mouseenter for smooth interpolation
        });

        card.addEventListener('mouseleave', () => {
            img.style.transform = '';
            img.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
        });

        card.addEventListener('mouseenter', () => {
            img.style.transition = 'transform 0.1s ease-out';
        });
    });

    // Work Modal Logic
    const workItems = document.querySelectorAll('.filter-item a');
    const workModal = document.getElementById('work-modal');


    if (workModal) {
        const workModalTitle = document.getElementById('work-modal-title');
        const workModalDesc = document.getElementById('work-modal-desc');
        const workModalImg = document.getElementById('work-modal-img');
        const workModalIframe = document.getElementById('work-modal-iframe');
        const workModalVideo = document.getElementById('work-modal-video');
        const workModalLink = document.getElementById('work-modal-link');

        workItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault(); // Stop from redirecting

                // Get details from clicked card
                const title = item.querySelector('.text-wrapper-12')?.textContent || 'My Work';
                const desc = item.querySelector('.text-wrapper-14, p')?.textContent || '';
                const imgSrc = item.querySelector('img')?.src || '';
                const link = item.getAttribute('data-link') || item.getAttribute('href') || '#';
                const videoSrc = item.getAttribute('data-video');

                // Populate modal
                if (workModalTitle) workModalTitle.textContent = title;
                if (workModalDesc) workModalDesc.textContent = desc;
                if (workModalLink) workModalLink.href = link;

                // Handle Media (Video vs Iframe vs Image)
                if (workModalImg) workModalImg.style.display = 'none';
                if (workModalIframe) workModalIframe.style.display = 'none';
                if (workModalVideo) {
                    workModalVideo.style.display = 'none';
                    workModalVideo.pause();
                    workModalVideo.src = '';
                }
                if (workModalIframe) workModalIframe.src = '';

                if (videoSrc && workModalVideo) {
                    workModalVideo.src = videoSrc;
                    workModalVideo.style.display = 'block';
                } else if (link.includes('instagram.com/p/') || link.includes('instagram.com/reel/') || link.includes('/reel/')) {
                    const embedLink = link.split('?')[0].replace(/\/$/, '') + '/embed/';
                    if (workModalIframe) {
                        workModalIframe.src = embedLink;
                        workModalIframe.style.display = 'block';
                    }
                } else if (link.includes('youtube.com/watch') || link.includes('youtu.be/')) {
                    let ytId = '';
                    if (link.includes('youtu.be/')) ytId = link.split('youtu.be/')[1].split('?')[0];
                    else ytId = new URL(link).searchParams.get('v');

                    if (ytId && workModalIframe) {
                        workModalIframe.src = `https://www.youtube.com/embed/${ytId}`;
                        workModalIframe.style.display = 'block';
                    }
                } else {
                    if (workModalImg) {
                        workModalImg.src = imgSrc;
                        workModalImg.style.display = 'block';
                    }
                }

                // Show modal
                workModal.classList.add('active');
                if (navMenu && navMenu.classList.contains('active')) {
                    closeMenu();
                }
            });
        });

        // Cleanup helper
        function cleanupWorkModal() {
            workModal.classList.remove('active');
            if (workModalVideo) { workModalVideo.pause(); workModalVideo.src = ''; }
            if (workModalIframe) { workModalIframe.src = ''; }
        }



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

    // --- DRAGGABLE PORTFOLIO FRAME INTERACTION ---
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

            // Verify target is the handle or its children
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
            if (active) {
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

                 // Show reset button & activate Easter Egg when dragged away
                 if (Math.abs(currentX) > 5 || Math.abs(currentY) > 5) {
                     resetBtn?.classList.add('visible');
                     dragElement.querySelector('.frame-30')?.classList.add('reset-active');
                     easterEgg?.classList.add('active');
 
                     // Hide the drag hint text
                     const dragHint = document.querySelector('.drag-hint-text');
                     if (dragHint) {
                         dragHint.classList.add('hidden');
                     }
                 }

                // Update real-time terminal diagnostics
                if (offsetXEl) offsetXEl.textContent = Math.round(currentX);
                if (offsetYEl) offsetYEl.textContent = Math.round(currentY);

                // Apply translation using transform
                dragElement.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        }

        // Handle reset button interactions
        if (resetBtn) {
            // Prevent dragging from starting when clicking/touching the reset button
            resetBtn.addEventListener('mousedown', (e) => e.stopPropagation());
            resetBtn.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });

            resetBtn.addEventListener('click', (e) => {
                e.stopPropagation();

                // Smoothly spring back to origin position (agak cepat-cepat-lambat)
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

                // Reset Dino Game state
                if (typeof window.resetDinoGame === 'function') {
                    window.resetDinoGame();
                }

                // Clear the transition property once the animation completes
                setTimeout(() => {
                    dragElement.style.transition = '';
                }, 500);
            });
        }
    }

    console.log('✓ All systems operational (Instant Scroll & Modal & Works)');
});