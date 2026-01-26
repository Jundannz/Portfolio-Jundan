(function() {
    emailjs.init("dPNSrAiSXY6Z3mNbo"); 
})();

document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const contactBtnNav = document.getElementById('contact-btn-nav');
    const navSpyLinks = document.querySelectorAll('.final .navbar-2 a'); 
    const sections = document.querySelectorAll('section'); 

    // 1. Unified Menu Closer
    function closeMenu() {
        hamburger?.classList.remove('active');
        mobileMenu?.classList.remove('active');
        contactBtnNav?.classList.remove('active');
        document.body.classList.remove('no-scroll');
    }

    // 2. Optimized Scroll Spy
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            if (window.scrollY >= (section.offsetTop - 350)) {
                current = section.getAttribute('id');
            }
        });
        navSpyLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href').includes(current));
        });
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

    // 5. Improved Filter Logic (Remove Inline Styles redundancy)
    const filterButtons = document.querySelectorAll('.filter-btn');
    const filterItems = document.querySelectorAll('.filter-item');

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.setAttribute('aria-pressed', 'false'));
            this.setAttribute('aria-pressed', 'true');
            
            const filterValue = this.getAttribute('data-filter');

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
        });
    });

    // 6. Contact Form (Cleaned up)
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
                btnText.textContent = 'FAILED';
                btn.style.backgroundColor = 'red';
                setTimeout(() => {
                    btnText.textContent = originalText;
                    btn.disabled = false;
                    btn.style.backgroundColor = '';
                }, 3000);
            });
    });
});

// Video Global Function
function toggleVideo() {
    const video = document.getElementById('portfolioVideo');
    const btn = document.getElementById('playBtn');
    if (video.paused) {
        video.play();
        video.muted = false;
        btn.classList.add('hide-btn');
    } else {
        video.pause();
        btn.classList.remove('hide-btn');
    }
}