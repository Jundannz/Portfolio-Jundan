document.addEventListener('DOMContentLoaded', function () {
    // Handle Easter Egg interactive click me card and Dino Game
    const floppyCard = document.getElementById('floppy-card');
    const clickCountEl = document.getElementById('click-count');
    const quoteLine = document.getElementById('quote-line');
    const dinoGameWrapper = document.getElementById('dino-game-wrapper');
    const dinoCanvas = document.getElementById('dino-canvas');
    const dinoCheatInput = document.getElementById('dino-cheat-input');

    let clickCount = 0;
    let dinoGameInstance = null;

    // Secret codes: "reload" unlocks shooting right away.
    // "voidwalker" (immortality) only works AFTER it's been hinted in-game (score threshold).
    const SHOOT_CODE = 'reload';
    const IMMORTAL_CODE = 'voidwalker';
    const IMMORTAL_HINT_SCORE = 250;
    const MAX_BULLETS = 9;

    class DinoGame {
        constructor(canvas, cheatInput, statusLine) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.cheatInput = cheatInput;
            this.statusLine = statusLine;

            this.isImmortal = false;
            this.immortalUnlockable = false;
            this.shootUnlocked = false;
            this.bullets = 0;

            this.score = 0;
            this.highScore = 0;
            this.isPlaying = false;
            this.gameOver = false;
            this.animationId = null;
            this.frameCount = 0;

            this.groundY = 130;

            this.dino = {
                x: 50,
                standWidth: 24,
                standHeight: 32,
                duckWidth: 36,
                duckHeight: 18,
                y: 0,
                vy: 0,
                gravity: 0.22,
                jumpForce: -5.7,
                isJumping: false,
                isDucking: false,
                legPhase: 0
            };
            this.dino.y = this.groundY - this.dino.standHeight;

            this.obstacles = [];
            this.projectiles = [];
            this.gameSpeed = 2.5;
            this.spawnTimer = 0;

            this.jump = this.jump.bind(this);
            this.duck = this.duck.bind(this);
            this.standUp = this.standUp.bind(this);
            this.shoot = this.shoot.bind(this);
            this.handleKeyDown = this.handleKeyDown.bind(this);
            this.handleKeyUp = this.handleKeyUp.bind(this);
            this.handleCanvasClick = this.handleCanvasClick.bind(this);
            this.handleCheatEnter = this.handleCheatEnter.bind(this);

            this.init();
        }

        init() {
            window.addEventListener('keydown', this.handleKeyDown);
            window.addEventListener('keyup', this.handleKeyUp);
            this.canvas.addEventListener('click', this.handleCanvasClick);
            this.canvas.addEventListener('touchstart', this.handleCanvasClick, { passive: true });
            this.cheatInput.addEventListener('keydown', this.handleCheatEnter);

            this.isPlaying = true;
            this.gameOver = false;
            this.score = 0;
            this.bullets = 0;
            this.obstacles = [];
            this.projectiles = [];
            this.gameSpeed = 2.5;
            this.spawnTimer = 0;
            this.frameCount = 0;

            this.dino.isJumping = false;
            this.dino.isDucking = false;
            this.dino.vy = 0;
            this.dino.y = this.groundY - this.dino.standHeight;

            this.loop();
        }

        destroy() {
            this.isPlaying = false;
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
            window.removeEventListener('keydown', this.handleKeyDown);
            window.removeEventListener('keyup', this.handleKeyUp);
            this.canvas.removeEventListener('click', this.handleCanvasClick);
            this.canvas.removeEventListener('touchstart', this.handleCanvasClick);
            this.cheatInput.removeEventListener('keydown', this.handleCheatEnter);
        }

        setStatus(text) {
            if (this.statusLine) this.statusLine.textContent = text;
        }

        handleKeyDown(e) {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                this.jump();
            } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                e.preventDefault();
                this.duck();
            } else if (e.code === 'KeyF') {
                e.preventDefault();
                this.shoot();
            }
        }

        handleKeyUp(e) {
            if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                this.standUp();
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

                if (code === SHOOT_CODE) {
                    if (!this.shootUnlocked) {
                        this.shootUnlocked = true;
                        this.setStatus('> CHEAT ENABLED: SHOOT MODE ONLINE 🔫 (Press F to fire, pick up ammo on the road)');
                        playCheatSuccessSound();
                    } else {
                        this.setStatus('> SHOOT MODE ALREADY ACTIVE.');
                        playKeyPressSound();
                    }
                    return;
                }

                if (code === IMMORTAL_CODE) {
                    if (!this.immortalUnlockable) {
                        this.setStatus('> UNKNOWN CODE. KEEP PLAYING TO FIND CLUES...');
                        playFailSound();
                        return;
                    }
                    this.isImmortal = true;
                    this.setStatus('> CHEAT ENABLED: DINO IMMORTALITY ACTIVE 🦖');
                    playCheatSuccessSound();
                    return;
                }

                this.setStatus('> INVALID CHEAT CODE. ACCESS DENIED.');
                playFailSound();
            }
        }

        jump() {
            if (this.gameOver) {
                this.init();
                return;
            }
            if (this.dino.isDucking) return;
            if (!this.dino.isJumping) {
                this.dino.vy = this.dino.jumpForce;
                this.dino.isJumping = true;
                playJumpSound();
            }
        }

        duck() {
            if (this.gameOver || this.dino.isJumping) return;
            this.dino.isDucking = true;
        }

        standUp() {
            this.dino.isDucking = false;
        }

        shoot() {
            if (this.gameOver || !this.shootUnlocked || this.bullets <= 0) return;
            const box = this.getDinoBox();
            this.bullets--;
            this.projectiles.push({
                x: box.x + box.width,
                y: box.y + box.height / 2 - 2,
                width: 9,
                height: 3,
                vx: 7.5
            });
            playShootSound();
        }

        getDinoBox() {
            const d = this.dino;
            if (d.isDucking) {
                return {
                    x: d.x,
                    y: this.groundY - d.duckHeight,
                    width: d.duckWidth,
                    height: d.duckHeight
                };
            }
            return {
                x: d.x,
                y: d.y,
                width: d.standWidth,
                height: d.standHeight
            };
        }

        aabbHit(a, b) {
            return a.x < b.x + b.width &&
                a.x + a.width > b.x &&
                a.y < b.y + b.height &&
                a.y + a.height > b.y;
        }

        update() {
            this.frameCount++;
            const d = this.dino;

            // Dynamically calculate speed based on score (starts at 2.5, caps at 8.0)
            this.gameSpeed = Math.min(8.0, 2.5 + this.score * 0.003);

            // Gravity / vertical motion
            d.vy += d.gravity;
            d.y += d.vy;
            if (d.y >= this.groundY - d.standHeight) {
                d.y = this.groundY - d.standHeight;
                d.vy = 0;
                d.isJumping = false;
            }

            // Leg run-cycle animation (only when grounded & not ducking)
            if (!d.isJumping) {
                d.legPhase += d.isDucking ? 0.15 : 0.25;
            }

            // Immortal hint unlock check
            if (!this.immortalUnlockable && this.score >= IMMORTAL_HINT_SCORE) {
                this.immortalUnlockable = true;
                this.setStatus(`> SIGNAL DETECTED... TYPE "${IMMORTAL_CODE.toUpperCase()}" TO ENABLE IMMORTALITY.`);
                playCheatSuccessSound();
            }

            // Spawn obstacles / pickups
            this.spawnTimer++;
            if (this.spawnTimer > 95 + Math.random() * 75) {
                this.spawnEntity();
                this.spawnTimer = 0;
            }

            const dinoBox = this.getDinoBox();

            // Move & evaluate obstacles
            for (let i = this.obstacles.length - 1; i >= 0; i--) {
                const obs = this.obstacles[i];
                obs.x -= this.gameSpeed;
                if (obs.type === 'bird') {
                    obs.wingPhase = (obs.wingPhase || 0) + 0.2;
                }
                if (obs.type === 'ammo') {
                    obs.pulsePhase = (obs.pulsePhase || 0) + 0.15;
                }

                const obsBox = { x: obs.x, y: obs.y, width: obs.width, height: obs.height };

                if (obs.type === 'ammo') {
                    if (this.aabbHit(dinoBox, obsBox)) {
                        this.bullets = Math.min(MAX_BULLETS, this.bullets + 3);
                        this.obstacles.splice(i, 1);
                        playKeyPressSound();
                        continue;
                    }
                } else {
                    if (this.aabbHit(dinoBox, obsBox) && !this.isImmortal) {
                        this.gameOver = true;
                        this.isPlaying = false;
                        playFailSound();
                    }
                }

                if (obs.x + obs.width < 0) {
                    this.obstacles.splice(i, 1);
                    if (obs.type !== 'ammo') {
                        this.score += 10;
                        if (this.score > this.highScore) this.highScore = this.score;
                    }
                }
            }

            // Move & evaluate projectiles
            for (let p = this.projectiles.length - 1; p >= 0; p--) {
                const proj = this.projectiles[p];
                proj.x += proj.vx;

                let hit = false;
                for (let i = this.obstacles.length - 1; i >= 0; i--) {
                    const obs = this.obstacles[i];
                    if (obs.type === 'ammo') continue;
                    if (this.aabbHit(proj, obs)) {
                        this.obstacles.splice(i, 1);
                        this.score += 15;
                        if (this.score > this.highScore) this.highScore = this.score;
                        hit = true;
                        break;
                    }
                }

                if (hit || proj.x > 600) {
                    this.projectiles.splice(p, 1);
                }
            }
        }

        spawnEntity() {
            const roll = Math.random();
            if (roll < 0.14) {
                // Ammo pickup — sits low so it's collectible while standing OR ducking
                this.obstacles.push({
                    type: 'ammo',
                    x: 600,
                    y: this.groundY - 12,
                    width: 10,
                    height: 12,
                    pulsePhase: 0
                });
            } else if (roll < 0.14 + 0.32 && this.score >= 40) {
                // Flying bird — sits at head height, must duck under it
                this.obstacles.push({
                    type: 'bird',
                    x: 600,
                    y: this.groundY - 34,
                    width: 24,
                    height: 15,
                    wingPhase: 0
                });
            } else {
                // Cactus — ground obstacle, must jump
                const h = 20 + Math.random() * 18;
                this.obstacles.push({
                    type: 'cactus',
                    x: 600,
                    y: this.groundY - h,
                    width: 13 + Math.random() * 6,
                    height: h
                });
            }
        }

        drawDino() {
            const ctx = this.ctx;
            const box = this.getDinoBox();
            const body = '#70ffb5';
            const dark = '#0d0813';

            if (this.dino.isDucking) {
                // Low crouched silhouette
                ctx.fillStyle = body;
                ctx.fillRect(box.x, box.y + 6, box.width, box.height - 6);
                ctx.fillRect(box.x + box.width - 12, box.y, 14, 10); // lowered head
                ctx.fillStyle = dark;
                ctx.fillRect(box.x + box.width - 5, box.y + 3, 2, 2); // eye
                // scurrying legs
                const legOffset = Math.floor(this.dino.legPhase) % 2 === 0 ? 0 : 3;
                ctx.fillStyle = dark;
                ctx.fillRect(box.x + 4, box.y + box.height - 2, 4, 2 + legOffset * 0);
                ctx.fillRect(box.x + box.width - 10, box.y + box.height - 2, 4, 2);
            } else {
                // Standing / running silhouette
                ctx.fillStyle = body;
                ctx.fillRect(box.x + 4, box.y, box.width - 4, box.height - 8); // torso
                ctx.fillRect(box.x + box.width - 10, box.y - 6, 12, 12); // head
                ctx.fillRect(box.x, box.y + 6, 8, 8); // tail nub

                ctx.fillStyle = dark;
                ctx.fillRect(box.x + box.width - 4, box.y - 3, 2, 2); // eye

                // alternating legs while grounded, single pose mid-air
                ctx.fillStyle = body;
                if (this.dino.isJumping) {
                    ctx.fillRect(box.x + 5, box.y + box.height - 8, 5, 8);
                    ctx.fillRect(box.x + box.width - 12, box.y + box.height - 8, 5, 8);
                } else if (Math.floor(this.dino.legPhase) % 2 === 0) {
                    ctx.fillRect(box.x + 5, box.y + box.height - 8, 5, 10);
                    ctx.fillRect(box.x + box.width - 12, box.y + box.height - 8, 5, 6);
                } else {
                    ctx.fillRect(box.x + 5, box.y + box.height - 8, 5, 6);
                    ctx.fillRect(box.x + box.width - 12, box.y + box.height - 8, 5, 10);
                }
            }
        }

        drawObstacle(obs) {
            const ctx = this.ctx;
            if (obs.type === 'cactus') {
                ctx.fillStyle = '#4c9a6a';
                ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                ctx.fillRect(obs.x - 4, obs.y + obs.height * 0.35, 4, obs.height * 0.3);
                ctx.fillRect(obs.x + obs.width, obs.y + obs.height * 0.15, 4, obs.height * 0.3);
            } else if (obs.type === 'bird') {
                const flap = Math.sin(obs.wingPhase) * 6;
                ctx.fillStyle = '#ff8f6b';
                ctx.fillRect(obs.x + 6, obs.y + 4, obs.width - 12, obs.height - 6); // body
                ctx.beginPath();
                ctx.moveTo(obs.x + obs.width / 2, obs.y + 6);
                ctx.lineTo(obs.x + obs.width / 2 - 10, obs.y + 6 - flap);
                ctx.lineTo(obs.x + obs.width / 2 - 2, obs.y + 8);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(obs.x + obs.width / 2, obs.y + 6);
                ctx.lineTo(obs.x + obs.width / 2 + 10, obs.y + 6 - flap);
                ctx.lineTo(obs.x + obs.width / 2 + 2, obs.y + 8);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#ffd672';
                ctx.fillRect(obs.x + obs.width - 4, obs.y + 5, 4, 3); // beak
            } else if (obs.type === 'ammo') {
                const pulse = 1 + Math.sin(obs.pulsePhase) * 0.15;
                const cx = obs.x + obs.width / 2;
                const cy = obs.y + obs.height / 2;
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(Math.PI / 4);
                ctx.scale(pulse, pulse);
                ctx.fillStyle = '#70ffb5';
                ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
                ctx.restore();
            }
        }

        drawProjectiles() {
            const ctx = this.ctx;
            ctx.fillStyle = '#ffd672';
            this.projectiles.forEach(p => {
                ctx.fillRect(p.x, p.y, p.width, p.height);
            });
        }

        draw() {
            const ctx = this.ctx;
            ctx.fillStyle = '#0d0813';
            ctx.fillRect(0, 0, 600, 150);

            ctx.strokeStyle = '#1f1926';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, this.groundY);
            ctx.lineTo(600, this.groundY);
            ctx.stroke();

            this.drawDino();
            this.obstacles.forEach(obs => this.drawObstacle(obs));
            this.drawProjectiles();

            // HUD
            ctx.font = '12px "Courier New", Courier, monospace';
            ctx.fillStyle = '#70ffb5';
            ctx.fillText(`SCORE: ${this.score}  HI: ${this.highScore}`, 10, 20);

            if (this.shootUnlocked) {
                ctx.fillStyle = '#ffd672';
                ctx.fillText(`AMMO: ${this.bullets}/${MAX_BULLETS}`, 10, 36);
            }

            if (this.isImmortal) {
                ctx.fillStyle = '#70ffb5';
                ctx.fillText('IMMORTAL MODE', 470, 20);
            }

            if (this.gameOver) {
                ctx.fillStyle = 'rgba(13, 8, 19, 0.8)';
                ctx.fillRect(0, 0, 600, 150);

                ctx.font = 'bold 20px "Courier New", Courier, monospace';
                ctx.fillStyle = '#ffd672';
                ctx.textAlign = 'center';
                ctx.fillText('GAME OVER', 300, 70);

                ctx.font = '12px "Courier New", Courier, monospace';
                ctx.fillStyle = '#70ffb5';
                ctx.fillText('PRESS SPACEBAR / CLICK SCREEN TO RESTART', 300, 100);
                ctx.textAlign = 'left';
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
                    quoteLine.textContent = `> SPACE=JUMP | ↓/S=DUCK (birds!) | F=SHOOT (needs cheat + ammo)`;
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

    // Audio synthesizer helper functions
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
        } catch (err) { }
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
        } catch (err) { }
    }

    function playShootSound() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(900, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);
            osc.connect(gain);
            gain.connect(ctx.destination);

            gain.gain.setValueAtTime(0.07, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

            osc.start();
            osc.stop(ctx.currentTime + 0.08);
        } catch (err) { }
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
        } catch (err) { }
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
        } catch (err) { }
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
        } catch (err) { }
    }

    // Expose reset functionality globally so script.js can invoke it
    window.resetDinoGame = function () {
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
    };
});
