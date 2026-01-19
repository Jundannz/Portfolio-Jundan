// ========================================
// INITIALIZE EMAILJS
// ========================================
(function() {
    // Public Key dari screenshot kamu
    emailjs.init("dPNSrAiSXY6Z3mNbo"); 
})();

document.addEventListener('DOMContentLoaded', function() {
    // ========================================
    // 1. NAVBAR ACTIVE STATE & LOGO HOME
    // ========================================
    
    // Logo klik untuk kembali ke hero
    const logo = document.querySelector('.final .logo');
    if (logo) {
        logo.addEventListener('click', (e) => {
            e.preventDefault();
            const heroSection = document.querySelector('.hero-section');
            if (heroSection) {
                heroSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
        logo.style.cursor = 'pointer';
    }

    // Navbar active state berdasarkan scroll position
    const navLinks = document.querySelectorAll('.final .navbar-2 a');
    const sections = {
        '#about': document.querySelector('#about'),
        '#skills': document.querySelector('#skills'),
        '#portfolio': document.querySelector('#portfolio'),
        '#works': document.querySelector('#works'),
        '#contact': document.querySelector('#contact'),
    };

    window.addEventListener('scroll', () => {
        let current = '';
        for (const [hash, section] of Object.entries(sections)) {
            if (section) {
                const sectionTop = section.offsetTop;
                // Adjusted offset agar active state lebih akurat
                if (window.pageYOffset >= sectionTop - 300) {
                    current = hash;
                }
            }
        }
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (current && link.getAttribute('href') === current) {
                link.classList.add('active');
            }
        });
    });

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetHash = link.getAttribute('href');
            const targetSection = document.querySelector(targetHash);
            if (targetSection) {
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // ========================================
    // 2. FILTER BUTTONS
    // ========================================
    
    const filterButtons = document.querySelectorAll('.filter-btn');
    const filterItems = document.querySelectorAll('.filter-item');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.setAttribute('aria-pressed', 'false'));
            button.setAttribute('aria-pressed', 'true');
            const filterValue = button.getAttribute('data-filter');

            filterItems.forEach(item => {
                // Menggunakan 'all-view' sesuai HTML kamu
                if (filterValue === 'all-view' || item.classList.contains(filterValue)) { 
                    item.style.display = 'flex'; // Kembalikan ke flex
                    item.classList.remove('hide');
                } else {
                    item.style.display = 'none';
                    item.classList.add('hide');
                }
            });
        });
    });

    // ========================================
    // 3. CONTACT FORM SUBMISSION (EMAILJS)
    // ========================================
    const contactForm = document.getElementById('contact-form');
    // Jika belum ada ID di HTML, kita coba ambil via class frame-4 di dalam contact section
    const formTarget = contactForm || document.querySelector('.contact-section .frame-4');

    if (formTarget) {
        formTarget.addEventListener('submit', function(event) {
            event.preventDefault(); // Mencegah reload halaman

            const submitBtn = formTarget.querySelector('button[type="submit"]');
            const btnText = submitBtn ? submitBtn.querySelector('.text-wrapper-3') : null;
            const originalText = btnText ? btnText.textContent : 'SEND MESSAGE ➔';

            // Ubah tombol jadi loading
            if(btnText) btnText.textContent = 'SENDING...';
            if(submitBtn) submitBtn.disabled = true;

            // Service ID dan Template ID dari screenshot kamu
            const serviceID = 'service_siu5edc';
            const templateID = 'template_k86p4if';

            emailjs.sendForm(serviceID, templateID, this)
                .then(() => {
                    // Berhasil
                    if(btnText) btnText.textContent = 'MESSAGE SENT! ✓';
                    if(submitBtn) submitBtn.style.backgroundColor = '#3ABEAB'; // Warna hijau palette-3
                    formTarget.reset(); // Kosongkan form

                    // Kembalikan tombol setelah 3 detik
                    setTimeout(() => {
                        if(btnText) btnText.textContent = originalText;
                        if(submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.style.backgroundColor = ''; // Reset warna
                        }
                    }, 3000);
                }, (err) => {
                    // Gagal
                    console.log('FAILED...', err);
                    if(btnText) btnText.textContent = 'FAILED TO SEND';
                    if(submitBtn) submitBtn.style.backgroundColor = 'red';
                    alert('Gagal mengirim pesan. Cek konsol browser untuk detail.');
                    
                    setTimeout(() => {
                        if(btnText) btnText.textContent = originalText;
                        if(submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.style.backgroundColor = '';
                        }
                    }, 3000);
                });
        });
    }
});

// ========================================
// 4. VIDEO PORTFOLIO TOGGLE
// ========================================

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

const vidElement = document.getElementById('portfolioVideo');
if (vidElement) {
    vidElement.addEventListener('ended', () => {
        const btn = document.getElementById('playBtn');
        if(btn) btn.classList.remove('hide-btn');
    });
}