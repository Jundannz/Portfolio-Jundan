(function() {
    emailjs.init("dPNSrAiSXY6Z3mNbo"); 
})();

document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const contactBtnNav = document.getElementById('contact-btn-nav');
    
    // PERBAIKAN KRITIS: Selector yang lebih spesifik dan robust
    const navSpyLinks = document.querySelectorAll('.final .navbar-2 a[href^="#"]'); 
    const sections = document.querySelectorAll('.final section[id]');
    
    // Debug logging - akan membantu troubleshooting
    console.log('=== SCROLL SPY DEBUG ===');
    console.log('Nav links found:', navSpyLinks.length);
    console.log('Sections found:', sections.length);

    // 1. Unified Menu Closer
    function closeMenu() {
        hamburger?.classList.remove('active');
        mobileMenu?.classList.remove('active');
        contactBtnNav?.classList.remove('active');
        document.body.classList.remove('no-scroll');
    }

    // 2. Scroll Spy Function - Update navbar active link
    function updateActiveNavLink() {
        let current = '';
        const navbarHeight = document.querySelector('.final .navbar')?.offsetHeight || 70;
        const threshold = navbarHeight + 100;
        const scrollPos = window.scrollY;
        
        // Loop dari belakang untuk cari section paling dekat
        for (let i = sections.length - 1; i >= 0; i--) {
            const section = sections[i];
            const sectionTop = section.offsetTop;
            
            if (scrollPos >= sectionTop - threshold) {
                current = section.getAttribute('id');
                break;
            }
        }
        
        // Update active class on nav links
        navSpyLinks.forEach(link => {
            const href = link.getAttribute('href');
            const targetId = href.replace('#', '');
            const isActive = targetId === current;
            
            link.classList.toggle('active', isActive);
        });
    }
    
    // 2a. Scroll event listener dengan throttle menggunakan requestAnimationFrame
    let ticking = false;
    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                updateActiveNavLink();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true }); // passive untuk performa lebih baik
    
    // 2b. Call on page load dengan multiple timing untuk memastikan
    setTimeout(updateActiveNavLink, 100);
    setTimeout(updateActiveNavLink, 500);
    setTimeout(updateActiveNavLink, 1000);
    
    // Call setelah semua resources loaded
    window.addEventListener('load', function() {
        console.log('Page fully loaded, updating nav...');
        updateActiveNavLink();
    });

    // 3. Unified Smooth Scroll (Handle all including logo & back to top)
    document.addEventListener('click', (e) => {
        const anchor = e.target.closest('a[href^="#"]');
        const logo = e.target.closest('.logo');

        if (anchor || logo) {
            const targetId = anchor ? anchor.getAttribute('href') : '#hero';
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                e.preventDefault();
                closeMenu();
                
                if (logo) {
                    logo.classList.add('animate-pop');
                    setTimeout(() => logo.classList.remove('animate-pop'), 300);
                }

                targetSection.scrollIntoView({ behavior: 'smooth' });
                
                console.log('Scrolling to:', targetId);
                
                // Update active nav link when scroll completes
                setTimeout(updateActiveNavLink, 800);
            }
        }
    });

    // 4. Hamburger Toggle
    hamburger?.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        contactBtnNav?.classList.toggle('active');
        document.body.classList.toggle('no-scroll');
    });

    // 5. Improved Filter Logic
    const filterButtons = document.querySelectorAll('.filter-btn');
    const filterItems = document.querySelectorAll('.filter-item');

    function applyFilter(filterValue) {
        filterButtons.forEach(btn => {
            btn.setAttribute('aria-pressed', btn.getAttribute('data-filter') === filterValue);
        });
        
        filterItems.forEach(item => {
            const isAll = filterValue === 'all-view' && item.classList.contains('all-view');
            const isMatch = item.classList.contains(filterValue);
            
            if (isAll || isMatch) {
                item.style.display = 'flex';
                setTimeout(() => item.classList.add('show'), 10);
            } else {
                item.classList.remove('show');
                item.style.display = 'none';
            }
        });
    }

    // Auto-trigger "All" filter on page load
    if (filterButtons.length > 0) {
        applyFilter('all-view');
    }

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filterValue = this.getAttribute('data-filter');
            applyFilter(filterValue);
        });
    });

    // 6. Contact Form
    const contactForm = document.getElementById('contact-form');
    contactForm?.addEventListener('submit', function(event) {
        event.preventDefault();
        const btn = this.querySelector('button[type="submit"]');
        const btnText = btn.querySelector('.text-wrapper-3');
        const originalText = btnText.textContent;

        btnText.textContent = 'SENDING...';
        btn.disabled = true;

        emailjs.sendForm('service_siu5edc', 'template_k86p4if', this)
            .then(() => {
                btnText.textContent = 'MESSAGE SENT! ✓';
                btn.style.backgroundColor = '#3ABEAB';
                this.reset();
                setTimeout(() => {
                    btnText.textContent = originalText;
                    btn.disabled = false;
                    btn.style.backgroundColor = '';
                }, 3000);
            }, (err) => {
                console.error('Email send error:', err);
                btnText.textContent = 'FAILED';
                btn.style.backgroundColor = 'red';
                setTimeout(() => {
                    btnText.textContent = originalText;
                    btn.disabled = false;
                    btn.style.backgroundColor = '';
                }, 3000);
            });
    });
    
    // === FINAL CHECK ===
    console.log('Script initialized successfully');
    console.log('Navbar visible:', !!document.querySelector('.final .navbar'));
    console.log('Window width:', window.innerWidth);
});

// Video Global Function
function toggleVideo() {
    const video = document.getElementById('portfolioVideo');
    const btn = document.getElementById('playBtn');
    if (video && btn) {
        if (video.paused) {
            video.play();
            video.muted = false;
            btn.classList.add('hide-btn');
        } else {
            video.pause();
            btn.classList.remove('hide-btn');
        }
    }
}