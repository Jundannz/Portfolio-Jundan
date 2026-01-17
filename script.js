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

    // Update active state saat scroll
    window.addEventListener('scroll', () => {
        let current = '';
        
        for (const [hash, section] of Object.entries(sections)) {
            if (section) {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                
                // Adjusted offset untuk deteksi yang lebih akurat
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

    // Smooth scroll dengan active state pada klik
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetHash = link.getAttribute('href');
            const targetSection = document.querySelector(targetHash);
            
            if (targetSection) {
                // Remove active dari semua
                navLinks.forEach(l => l.classList.remove('active'));
                // Tambahkan active ke link yang diklik
                link.classList.add('active');
                // Smooth scroll
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // ========================================
    // 2. FILTER BUTTONS & WORK CARDS
    // ========================================
    
    const filterButtons = document.querySelectorAll('.filter-btn');
    const filterItems = document.querySelectorAll('.filter-item');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Hapus status aktif dari semua tombol
            filterButtons.forEach(btn => {
                btn.setAttribute('aria-pressed', 'false');
            });

            // Set status aktif ke tombol yang diklik
            button.setAttribute('aria-pressed', 'true');

            // Ambil kategori data dari tombol yang diklik
            const filterValue = button.getAttribute('data-filter');

            // Logika Filtering
            filterItems.forEach(item => {
                if (filterValue === 'all' || item.classList.contains(filterValue)) {
                    item.style.display = ''; 
                    item.classList.remove('hide');
                } else {
                    item.style.display = 'none';
                    item.classList.add('hide');
                }
            });
        });
    });

    // ========================================
    // 3. WORK CARDS CLICKABLE
    // ========================================
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

// Memastikan tombol muncul lagi jika video selesai
const vidElement = document.getElementById('portfolioVideo');
if (vidElement) {
    vidElement.addEventListener('ended', () => {
        document.getElementById('playBtn').classList.remove('hide-btn');
    });
}