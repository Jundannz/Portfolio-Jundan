(function() {
    // Inisialisasi EmailJS
    emailjs.init("rqp74mxmpwl7hXkhu");
})();

document.addEventListener('DOMContentLoaded', function() {
    
    // ===== ELEMENT REFERENCES =====
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navMenu = document.getElementById('mobile-menu');
    // UPDATED: Referensi ke tombol Store
    const contactBtnNav = document.getElementById('store-btn-nav');
    const body = document.body;
    
    // Create overlay element
    let overlay = document.querySelector('.menu-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'menu-overlay';
        body.appendChild(overlay);
    }

    // ===== MENU STATE MANAGEMENT =====
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
        body.classList.remove('menu-open');
    }

    function toggleMenu() {
        if (navMenu?.classList.contains('active')) {
            closeMenu();
        } else {
            openMenu();
        }
    }

    // ===== GENERIC SMOOTH SCROLL FUNCTION (INSTANT) =====
    // UPDATED: Tidak ada setTimeout. Scroll langsung jalan.
    function smoothScrollTo(targetId) {
        const targetSection = document.querySelector(targetId);
        if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // ===== UNIVERSAL SMOOTH SCROLL HANDLER =====
    // Menangkap SEMUA link yang berawalan '#' (Navbar, Hero, Footer, Back to Top)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            
            const targetId = this.getAttribute('href');
            
            // Cek apakah link ini berada di dalam navigasi mobile / tombol contact nav
            // Jika ya, tutup menu (tanpa delay scroll)
            // UPDATED: Cek ID store-btn-nav
            const isMobileMenuLink = this.closest('.navbar-2') || this.id === 'store-btn-nav';
            
            if (isMobileMenuLink && navMenu.classList.contains('active')) {
                // Untuk tombol store, biar logika modal yang handle close menu
                if (this.id !== 'store-btn-nav') {
                    closeMenu();
                }
            }

            // Langsung eksekusi scroll HANYA JIKA bukan tombol store (href="#")
            if (targetId !== '#') {
                e.preventDefault(); 
                smoothScrollTo(targetId);
            }
        });
    });

    // ===== HAMBURGER CLICK HANDLER =====
    hamburgerBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu();
    });

    // ===== OVERLAY CLICK HANDLER =====
    overlay?.addEventListener('click', () => {
        closeMenu();
    });

    // ===== LOGO CLICK HANDLER (INSTANT) =====
    const logo = document.querySelector('.logo');
    logo?.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Tutup menu jika terbuka
        if (navMenu.classList.contains('active')) {
            closeMenu();
        }
        
        // Langsung scroll ke hero
        smoothScrollTo('#hero'); 
    });

    // ===== SCROLL SPY (Active Link Highlighter) =====
    const sections = document.querySelectorAll('.final section[id]');
    const navLinks = document.querySelectorAll('.navbar-2 a[href^="#"]'); 
    const navbarHeight = 70;
    const threshold = navbarHeight + 100;

    function updateActiveLink() {
        const scrollPos = window.scrollY;
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
            link.classList.remove('active');
            const href = link.getAttribute('href').replace('#', '');
            
            if (href === currentSection) {
                link.classList.add('active');
            }
        });
    }

    let scrollTicking = false;
    window.addEventListener('scroll', () => {
        if (!scrollTicking) {
            window.requestAnimationFrame(() => {
                updateActiveLink();
                scrollTicking = false;
            });
            scrollTicking = true;
        }
    }, { passive: true });

    updateActiveLink();

    // ===== FILTER BUTTONS =====
    const filterBtns = document.querySelectorAll('.filter-btn');
    const filterItems = document.querySelectorAll('.filter-item');

    function applyFilter(filterValue) {
        filterBtns.forEach(btn => {
            const isActive = btn.getAttribute('data-filter') === filterValue;
            btn.setAttribute('aria-pressed', isActive);
            btn.classList.toggle('active', isActive);
        });

        filterItems.forEach(item => {
            const hasCategory = item.classList.contains(filterValue);
            const isAllView = filterValue === 'all-view';
            
            if ((isAllView && item.classList.contains('all-view')) || 
                (!isAllView && hasCategory)) {
                item.classList.add('show');
                item.style.display = 'flex';
            } else {
                item.classList.remove('show');
                item.style.display = 'none';
            }
        });
    }

    if (filterBtns.length > 0) applyFilter('all-view');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filterValue = btn.getAttribute('data-filter');
            applyFilter(filterValue);
        });
    });

    // ===== CONTACT FORM HANDLER =====
    const contactForm = document.getElementById('contact-form');
    
    contactForm?.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const submitBtn = this.querySelector('button[type="submit"]');
        const btnText = submitBtn?.querySelector('.text-wrapper-3');
        const originalText = btnText?.textContent || 'Send Message';

        if (!submitBtn || !btnText) return;

        submitBtn.disabled = true;
        btnText.textContent = 'SENDING...';

        emailjs.sendForm('service_siu5edc', 'template_k86p4if', this)
            .then(() => {
                btnText.textContent = 'MESSAGE SENT! ✓';
                submitBtn.style.backgroundColor = '#3ABEAB';
                this.reset();
                setTimeout(() => {
                    btnText.textContent = originalText;
                    submitBtn.disabled = false;
                    submitBtn.style.backgroundColor = '';
                }, 3000);
            })
            .catch((error) => {
                console.error('Email error:', error);
                btnText.textContent = 'FAILED - TRY AGAIN';
                submitBtn.style.backgroundColor = '#ff6b6b';
                setTimeout(() => {
                    btnText.textContent = originalText;
                    submitBtn.disabled = false;
                    submitBtn.style.backgroundColor = '';
                }, 3000);
            });
    });

    // ===== STORE MODAL LOGIC (NEW) =====
    const storeBtn = document.getElementById('store-btn-nav');
    const storeModal = document.getElementById('store-modal');
    const closeModalBtn = document.querySelector('.close-modal');

    // Function to open modal
    if (storeBtn && storeModal) {
        storeBtn.addEventListener('click', function(e) {
            e.preventDefault(); // Mencegah link pindah halaman
            storeModal.classList.add('active');
            
            // Jika di mobile menu sedang terbuka, tutup menu hamburger
            if (navMenu && navMenu.classList.contains('active')) {
                closeMenu();
            }
        });
    }

    // Function to close modal (Click X button)
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            storeModal.classList.remove('active');
        });
    }

    // Close modal when clicking OUTSIDE the content
    if (storeModal) {
        storeModal.addEventListener('click', function(e) {
            if (e.target === storeModal) {
                storeModal.classList.remove('active');
            }
        });
    }

    // Close modal with ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && storeModal.classList.contains('active')) {
            storeModal.classList.remove('active');
        }
    });

    console.log('✓ All systems operational (Instant Scroll & Modal)');
});

// ===== GLOBAL VIDEO TOGGLE =====
window.toggleVideo = function() {
    const video = document.getElementById('portfolioVideo');
    const btn = document.getElementById('playBtn');
    
    if (!video || !btn) return;

    if (video.paused) {
        video.play();
        video.muted = false;
        btn.classList.add('hide-btn');
    } else {
        video.pause();
        btn.classList.remove('hide-btn');
    }
};