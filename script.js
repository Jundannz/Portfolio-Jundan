(function() {
    // emailjs
    emailjs.init("rqp74mxmpwl7hXkhu");
})();

document.addEventListener('DOMContentLoaded', function() {
    
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navMenu = document.getElementById('mobile-menu');
    const contactBtnNav = document.getElementById('store-btn-nav');
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
        body.classList.remove('menu-open');
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
            if (targetId !== '#') {
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

    // Filter btn
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

    // Form handler
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

    // Store
    const storeBtn = document.getElementById('store-btn-nav');
    const storeModal = document.getElementById('store-modal');
    const closeModalBtn = document.querySelector('.close-modal');

    if (storeBtn && storeModal) {
        storeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            storeModal.classList.add('active');
            
            if (navMenu && navMenu.classList.contains('active')) {
                closeMenu();
            }
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            storeModal.classList.remove('active');
        });
    }

    if (storeModal) {
        storeModal.addEventListener('click', function(e) {
            if (e.target === storeModal) {
                storeModal.classList.remove('active');
            }
        });
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && storeModal.classList.contains('active')) {
            storeModal.classList.remove('active');
        }
    });

    console.log('✓ All systems operational (Instant Scroll & Modal)');
});

// Global video toggle function
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