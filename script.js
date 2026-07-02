
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

                // Smoothly spring back to origin position
                dragElement.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
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
                clickCount = 0;
                if (clickCountEl) clickCountEl.textContent = '0';
                const cardGrid = document.querySelector('.interactive-grid');
                if (cardGrid) cardGrid.style.display = 'flex';
                if (dinoGameWrapper) dinoGameWrapper.style.display = 'none';
                if (quoteLine) {
                    quoteLine.textContent = `> CLICK BUTTON 10x FOR SECRETS...`;
                }
                if (dinoGameInstance) {
                    dinoGameInstance.destroy();
                    dinoGameInstance = null;
                }
                if (dinoCheatInput) dinoCheatInput.value = '';

                // Clear the transition property once the animation completes
                setTimeout(() => {
                    dragElement.style.transition = '';
                }, 500);
            });
        }

        // Handle Easter Egg interactive click me card and Dino Game
        const floppyCard = document.getElementById('floppy-card');
        const clickCountEl = document.getElementById('click-count');
        const quoteLine = document.getElementById('quote-line');
        const dinoGameWrapper = document.getElementById('dino-game-wrapper');
        const dinoCanvas = document.getElementById('dino-canvas');
        const dinoCheatInput = document.getElementById('dino-cheat-input');

        let clickCount = 0;
        let dinoGameInstance = null;

        class DinoGame {
            constructor(canvas, cheatInput, statusLine) {
                this.canvas = canvas;
                this.ctx = canvas.getContext('2d');
                this.cheatInput = cheatInput;
                this.statusLine = statusLine;
                
                this.isImmortal = false;
                this.score = 0;
                this.highScore = 0;
                this.isPlaying = false;
                this.gameOver = false;
                this.animationId = null;
                
                this.groundY = 130;
                this.dino = {
                    x: 50,
                    y: 130 - 30,
                    width: 20,
                    height: 30,
                    vy: 0,
                    gravity: 0.5,
                    jumpForce: -8.5,
                    isJumping: false
                };
                
                this.obstacles = [];
                this.gameSpeed = 4.5;
                this.spawnTimer = 0;
                
                this.jump = this.jump.bind(this);
                this.handleKeyDown = this.handleKeyDown.bind(this);
                this.handleCanvasClick = this.handleCanvasClick.bind(this);
                this.handleCheatEnter = this.handleCheatEnter.bind(this);
                
                this.init();
            }

            init() {
                window.addEventListener('keydown', this.handleKeyDown);
                this.canvas.addEventListener('click', this.handleCanvasClick);
                this.canvas.addEventListener('touchstart', this.handleCanvasClick, { passive: true });
                this.cheatInput.addEventListener('keydown', this.handleCheatEnter);
                
                this.isPlaying = true;
                this.gameOver = false;
                this.score = 0;
                this.obstacles = [];
                this.gameSpeed = 4.5;
                this.spawnTimer = 0;
                this.dino.y = this.groundY - this.dino.height;
                this.dino.vy = 0;
                this.dino.isJumping = false;
                
                this.loop();
            }

            destroy() {
                this.isPlaying = false;
                if (this.animationId) {
                    cancelAnimationFrame(this.animationId);
                }
                window.removeEventListener('keydown', this.handleKeyDown);
                this.canvas.removeEventListener('click', this.handleCanvasClick);
                this.canvas.removeEventListener('touchstart', this.handleCanvasClick);
                this.cheatInput.removeEventListener('keydown', this.handleCheatEnter);
            }

            handleKeyDown(e) {
                if (e.code === 'Space') {
                    e.preventDefault();
                    this.jump();
                }
            }

            handleCanvasClick(e) {
                e.stopPropagation();
                this.jump();
            }

            handleCheatEnter(e) {
                if (e.key === 'Enter') {
                    e.stopPropagation();
                    const code = this.cheatInput.value.trim().toLowerCase();
                    this.cheatInput.value = '';
                    
                    if (code === 'immortal' || code === 'godmode' || code === 'invincible' || code === 'jundannz') {
                        this.isImmortal = true;
                        if (this.statusLine) {
                            this.statusLine.textContent = '> CHEAT ENABLED: DINO IMMORTALITY ACTIVE 🦖';
                        }
                        playCheatSuccessSound();
                    } else {
                        if (this.statusLine) {
                            this.statusLine.textContent = '> INVALID CHEAT CODE. ACCESS DENIED.';
                        }
                        playFailSound();
                    }
                }
            }

            jump() {
                if (this.gameOver) {
                    this.init();
                    return;
                }
                if (!this.dino.isJumping) {
                    this.dino.vy = this.dino.jumpForce;
                    this.dino.isJumping = true;
                    playJumpSound();
                }
            }

            update() {
                this.dino.vy += this.dino.gravity;
                this.dino.y += this.dino.vy;
                
                if (this.dino.y >= this.groundY - this.dino.height) {
                    this.dino.y = this.groundY - this.dino.height;
                    this.dino.vy = 0;
                    this.dino.isJumping = false;
                }

                this.spawnTimer++;
                if (this.spawnTimer > 100 + Math.random() * 80) {
                    this.obstacles.push({
                        x: 600,
                        y: this.groundY - (15 + Math.random() * 20),
                        width: 12,
                        height: 20 + Math.random() * 15
                    });
                    this.spawnTimer = 0;
                }

                for (let i = this.obstacles.length - 1; i >= 0; i--) {
                    const obs = this.obstacles[i];
                    obs.x -= this.gameSpeed;

                    if (
                        this.dino.x < obs.x + obs.width &&
                        this.dino.x + this.dino.width > obs.x &&
                        this.dino.y < obs.y + obs.height &&
                        this.dino.y + this.dino.height > obs.y
                    ) {
                        if (!this.isImmortal) {
                            this.gameOver = true;
                            this.isPlaying = false;
                            playFailSound();
                        }
                    }

                    if (obs.x + obs.width < 0) {
                        this.obstacles.splice(i, 1);
                        this.score += 10;
                        if (this.score > this.highScore) {
                            this.highScore = this.score;
                        }
                        if (this.score % 100 === 0) {
                            this.gameSpeed += 0.5;
                        }
                    }
                }
            }

            draw() {
                this.ctx.fillStyle = '#0d0813';
                this.ctx.fillRect(0, 0, 600, 150);

                this.ctx.strokeStyle = '#1f1926';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(0, this.groundY);
                this.ctx.lineTo(600, this.groundY);
                this.ctx.stroke();

                this.ctx.fillStyle = '#70ffb5';
                this.ctx.fillRect(this.dino.x, this.dino.y, this.dino.width, this.dino.height);
                
                this.ctx.fillStyle = '#0d0813';
                this.ctx.fillRect(this.dino.x + 12, this.dino.y + 4, 3, 3);

                this.ctx.fillStyle = '#ffd672';
                this.obstacles.forEach(obs => {
                    this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                });

                this.ctx.font = '12px "Courier New", Courier, monospace';
                this.ctx.fillStyle = '#70ffb5';
                this.ctx.fillText(`SCORE: ${this.score}  HI: ${this.highScore}`, 10, 20);

                if (this.isImmortal) {
                    this.ctx.fillStyle = '#70ffb5';
                    this.ctx.fillText('IMMORTAL MODE', 480, 20);
                }

                if (this.gameOver) {
                    this.ctx.fillStyle = 'rgba(13, 8, 19, 0.8)';
                    this.ctx.fillRect(0, 0, 600, 150);

                    this.ctx.font = 'bold 20px "Courier New", Courier, monospace';
                    this.ctx.fillStyle = '#ffd672';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('GAME OVER', 300, 70);
                    
                    this.ctx.font = '12px "Courier New", Courier, monospace';
                    this.ctx.fillStyle = '#70ffb5';
                    this.ctx.fillText('PRESS SPACEBAR / CLICK SCREEN TO RESTART', 300, 100);
                    this.ctx.textAlign = 'left';
                }
            }

            loop() {
                if (!this.isPlaying) return;
                this.update();
                this.draw();
                this.animationId = requestAnimationFrame(() => this.loop());
            }
        }

        if (floppyCard) {
            floppyCard.addEventListener('mousedown', (e) => e.stopPropagation());
            floppyCard.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
            floppyCard.addEventListener('click', (e) => {
                e.stopPropagation();
                
                clickCount++;
                if (clickCountEl) clickCountEl.textContent = clickCount;

                if (clickCount < 10) {
                    playKeyPressSound();
                    if (quoteLine) {
                        quoteLine.textContent = `> CLICKS DETECTED: ${clickCount}/10. KEEP GOING...`;
                    }
                } else {
                    const cardGrid = document.querySelector('.interactive-grid');
                    if (cardGrid) cardGrid.style.display = 'none';
                    if (dinoGameWrapper) dinoGameWrapper.style.display = 'block';
                    
                    if (quoteLine) {
                        quoteLine.textContent = `> KEY: SPACEBAR / CLICK CANVAS TO JUMP`;
                    }
                    
                    playArpeggioSound();
                    
                    if (!dinoGameInstance) {
                        dinoGameInstance = new DinoGame(dinoCanvas, dinoCheatInput, quoteLine);
                    }
                }
            });
        }

        if (dinoCheatInput) {
            dinoCheatInput.addEventListener('mousedown', (e) => e.stopPropagation());
            dinoCheatInput.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
        }

        function playKeyPressSound() {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (!AudioContext) return;
                const ctx = new AudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, ctx.currentTime);
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                gain.gain.setValueAtTime(0.05, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
                
                osc.start();
                osc.stop(ctx.currentTime + 0.05);
            } catch (err) {}
        }

        function playJumpSound() {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (!AudioContext) return;
                const ctx = new AudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(150, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.12);
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                gain.gain.setValueAtTime(0.08, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
                
                osc.start();
                osc.stop(ctx.currentTime + 0.12);
            } catch (err) {}
        }

        function playCheatSuccessSound() {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (!AudioContext) return;
                const ctx = new AudioContext();
                
                const notes = [523.25, 659.25, 783.99];
                notes.forEach((freq, idx) => {
                    setTimeout(() => {
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.type = 'square';
                        osc.frequency.setValueAtTime(freq, ctx.currentTime);
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        
                        gain.gain.setValueAtTime(0.05, ctx.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                        
                        osc.start();
                        osc.stop(ctx.currentTime + 0.15);
                    }, idx * 70);
                });
            } catch (err) {}
        }

        function playFailSound() {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (!AudioContext) return;
                const ctx = new AudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(120, ctx.currentTime);
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                gain.gain.setValueAtTime(0.12, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
                
                osc.start();
                osc.stop(ctx.currentTime + 0.25);
            } catch (err) {}
        }

        function playArpeggioSound() {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (!AudioContext) return;
                const ctx = new AudioContext();
                
                const notes = [523.25, 659.25, 783.99, 1046.50];
                notes.forEach((freq, idx) => {
                    setTimeout(() => {
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.type = 'square';
                        osc.frequency.setValueAtTime(freq, ctx.currentTime);
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        
                        gain.gain.setValueAtTime(idx === 3 ? 0.08 : 0.06, ctx.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
                        
                        osc.start();
                        osc.stop(ctx.currentTime + 0.25);
                    }, idx * 80);
                });
            } catch (err) {}
        }
    }

    console.log('✓ All systems operational (Instant Scroll & Modal & Works)');
});