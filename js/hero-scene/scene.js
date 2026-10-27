/* ==========================================================================
   SCENE 3D HERO — renderer, kamera, cahaya, loop animasi, dan interaksi
   --------------------------------------------------------------------------
   createHeroScene(container, config) → { dispose }
   - Canvas transparan, ukuran mengikuti container (ResizeObserver).
   - Animasi berbasis waktu (delta detik), tidak bergantung frame rate.
   - Loop berhenti saat hero tidak terlihat atau tab tidak aktif.
   - dispose() melepas listener, loop, dan seluruh resource GPU.
   ========================================================================== */

import * as THREE from '../vendor/three/three.module.js';
import { createLaptop } from './laptop.js';
import { createCompanions } from './companions.js';

const TAU = Math.PI * 2;
// Faktor redaman eksponensial yang stabil di frame rate berapa pun
const damp = (current, target, speed, dt) => current + (target - current) * (1 - Math.exp(-speed * dt));
// Normalisasi sudut ke (-π, π] agar kembali ke pose lewat jalur terpendek
const wrapAngle = (a) => a - TAU * Math.floor((a + Math.PI) / TAU);

export function createHeroScene(container, config, { onFirstFrame, onContextLost, staticMode = false } = {}) {
  // ---------- Pelacakan resource untuk dispose() ----------
  const disposables = new Set();
  const track = (resource) => { disposables.add(resource); return resource; };
  const cleanups = [];
  const listen = (target, type, fn, opts) => {
    target.addEventListener(type, fn, opts);
    cleanups.push(() => target.removeEventListener(type, fn, opts));
  };

  // ---------- Renderer (bisa melempar error → ditangani di index.js) ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, config.render.maxPixelRatio));
  const canvas = renderer.domElement;
  canvas.className = 'hero-visual__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.setAttribute('role', 'presentation');
  container.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(config.camera.fov, 1, 0.1, 100);
  const cameraTarget = new THREE.Vector3(config.camera.target.x, config.camera.target.y, config.camera.target.z);

  // ---------- Cahaya lembut (tanpa shadow map demi performa) ----------
  const C = config.colors;
  scene.add(new THREE.HemisphereLight(C.hemiSky, C.hemiGround, 1.9));
  const key = new THREE.DirectionalLight(C.keyLight, 1.9);
  key.position.set(-3, 6, 5);
  const fill = new THREE.DirectionalLight(C.fillLight, 0.7);
  fill.position.set(5, 1.5, 3);
  const rim = new THREE.DirectionalLight(C.rimLight, 1.1);
  rim.position.set(2, 3, -6);
  scene.add(key, fill, rim);

  // ---------- Objek ----------
  const P = config.pose;
  const laptop = createLaptop(config, track, renderer.capabilities.getMaxAnisotropy());
  // rig = titik putar; model digeser negatif pivot agar berputar di tengah badan
  const rig = new THREE.Group();
  const rigBase = new THREE.Vector3(P.offset.x, P.offset.y + P.pivot.y, P.offset.z + P.pivot.z);
  rig.position.copy(rigBase);
  laptop.object.position.set(0, -P.pivot.y, -P.pivot.z);
  rig.add(laptop.object);
  scene.add(rig);

  const companions = createCompanions(config, track);
  scene.add(companions.object);

  // Bayangan: tekstur gradasi radial pada bidang datar (murah, tanpa shadow map)
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = shadowCanvas.height = 128;
  const sctx = shadowCanvas.getContext('2d');
  const sg = sctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  sg.addColorStop(0, 'rgba(255,255,255,1)');
  sg.addColorStop(1, 'rgba(255,255,255,0)');
  sctx.fillStyle = sg;
  sctx.fillRect(0, 0, 128, 128);
  const shadowTex = track(new THREE.CanvasTexture(shadowCanvas));
  const shadowMat = track(new THREE.MeshBasicMaterial({
    map: shadowTex, color: C.shadow, transparent: true, opacity: config.shadow.opacity, depthWrite: false
  }));
  const shadow = new THREE.Mesh(track(new THREE.PlaneGeometry(1, 1)), shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(config.shadow.width, config.shadow.depth, 1);
  shadow.position.set(P.offset.x, config.shadow.y, P.offset.z + 0.2);
  shadow.renderOrder = -1;
  scene.add(shadow);

  // ---------- State interaksi ----------
  const I = config.interaction;
  const state = {
    elapsed: 0,
    idleWeight: 1,            // 1 = gerak idle penuh, 0 = dimatikan (saat drag)
    hover: { x: 0, y: 0 },    // target kemiringan dari pointer (-1..1)
    hoverNow: { x: 0, y: 0 },
    drag: { yaw: 0, pitch: 0 },  // rotasi tambahan dari drag
    velocity: 0,              // kecepatan yaw setelah dilepas (rad/detik)
    dragging: false,
    pointerId: null,
    startX: 0, startY: 0, lastX: 0, lastY: 0, lastT: 0,
    lastInteraction: -Infinity
  };

  function pointerToHover(e) {
    const r = container.getBoundingClientRect();
    state.hover.x = THREE.MathUtils.clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
    state.hover.y = THREE.MathUtils.clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
  }

  // Mode statis (reduced motion): tidak ada listener pointer sama sekali
  if (!staticMode) bindPointer();
  function bindPointer() {
  // Kemiringan ringan hanya untuk pointer presisi (mouse/pen) di area visual
  listen(container, 'pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    if (!state.dragging) pointerToHover(e);
  });
  listen(container, 'pointerleave', () => { if (!state.dragging) state.hover.x = state.hover.y = 0; });

  listen(container, 'pointerdown', (e) => {
    if (e.button !== 0 || state.pointerId !== null) return;
    state.pointerId = e.pointerId;
    state.startX = state.lastX = e.clientX;
    state.startY = state.lastY = e.clientY;
    state.lastT = performance.now();
    state.velocity = 0;
  });

  listen(window, 'pointermove', (e) => {
    if (e.pointerId !== state.pointerId) return;
    const dx = e.clientX - state.lastX;
    const dy = e.clientY - state.lastY;
    if (!state.dragging) {
      const totalX = e.clientX - state.startX;
      const totalY = e.clientY - state.startY;
      if (Math.hypot(totalX, totalY) < I.dragStartThreshold) return;
      // Sentuhan yang dominan vertikal = scroll halaman, bukan drag
      if (e.pointerType === 'touch' && Math.abs(totalY) > Math.abs(totalX)) { endPointer(); return; }
      state.dragging = true;
      container.classList.add('is-dragging');
      try { container.setPointerCapture(e.pointerId); } catch { /* abaikan */ }
    }
    const now = performance.now();
    const dt = Math.max((now - state.lastT) / 1000, 1 / 240);
    const dYaw = dx * I.dragYawPerPixel;
    state.drag.yaw += dYaw;
    state.drag.pitch = THREE.MathUtils.clamp(state.drag.pitch + dy * I.dragPitchPerPixel, -I.dragPitchLimit, I.dragPitchLimit);
    state.velocity = THREE.MathUtils.clamp(damp(state.velocity, dYaw / dt, 18, dt), -I.maxSpin, I.maxSpin);
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    state.lastT = now;
    state.lastInteraction = state.elapsed;
    wake();
  });

  listen(window, 'pointerup', endPointer);
  listen(window, 'pointercancel', endPointer);
  listen(window, 'blur', () => endPointer());
  }

  function endPointer(e) {
    if (e && e.pointerId !== state.pointerId) return;
    if (state.dragging && performance.now() - state.lastT > 80) state.velocity = 0; // ditahan diam sebelum dilepas
    if (state.dragging) state.lastInteraction = state.elapsed;
    if (state.pointerId !== null && container.hasPointerCapture && container.hasPointerCapture(state.pointerId)) {
      container.releasePointerCapture(state.pointerId);
    }
    state.dragging = false;
    state.pointerId = null;
    container.classList.remove('is-dragging');
  }

  // ---------- Kamera & ukuran ----------
  function layout() {
    const w = Math.max(1, container.clientWidth);
    const h = Math.max(1, container.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Jarak minimal agar kotak komposisi muat secara vertikal & horizontal
    const cam = config.camera;
    const tanV = Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2);
    const dist = Math.max(cam.halfHeight / tanV, cam.halfWidth / (tanV * camera.aspect)) * cam.padding + cam.depthAllowance;
    camera.position.set(
      cameraTarget.x,
      cameraTarget.y + Math.sin(cam.elevation) * dist,
      cameraTarget.z + Math.cos(cam.elevation) * dist
    );
    camera.lookAt(cameraTarget);
    camera.updateProjectionMatrix();
    if (!running) renderFrame(0); // tetap tampil benar walau loop sedang berhenti
  }

  // ---------- Update per frame ----------
  const D = config.idle;
  const lean = { x: 0, y: 0 };
  function update(dt) {
    state.elapsed += dt;
    const t = state.elapsed;
    const sinceInteraction = t - state.lastInteraction;

    // Idle dimatikan saat drag/inersia dan hidup lagi bertahap
    const idleTarget = state.dragging || Math.abs(state.velocity) > 0.05 ? 0 : 1;
    state.idleWeight = damp(state.idleWeight, idleTarget, D.blendSpeed, dt);

    // Inersia setelah drag dilepas
    if (!state.dragging && state.velocity !== 0) {
      state.drag.yaw += state.velocity * dt;
      state.velocity = damp(state.velocity, 0, I.inertiaDamping, dt);
      if (Math.abs(state.velocity) < 0.01) state.velocity = 0;
      state.lastInteraction = t;
    }

    // Kembali ke pose utama setelah pengguna diam beberapa saat
    if (!state.dragging && state.velocity === 0 && sinceInteraction > I.returnDelay) {
      state.drag.yaw = damp(wrapAngle(state.drag.yaw), 0, I.returnSpeed, dt);
      state.drag.pitch = damp(state.drag.pitch, 0, I.returnSpeed, dt);
    }

    // Kemiringan pointer (dinonaktifkan saat drag)
    const hx = state.dragging ? 0 : state.hover.x;
    const hy = state.dragging ? 0 : state.hover.y;
    state.hoverNow.x = damp(state.hoverNow.x, hx, I.hoverSmoothing, dt);
    state.hoverNow.y = damp(state.hoverNow.y, hy, I.hoverSmoothing, dt);

    const w = state.idleWeight;
    const float = Math.sin((t / D.floatPeriod) * TAU) * D.floatAmplitude * w;
    const swayYaw = Math.sin((t / D.swayPeriod) * TAU) * D.swayYaw * w;
    const swayPitch = Math.sin((t / D.swayPitchPeriod) * TAU + 1.1) * D.swayPitch * w;

    rig.position.y = rigBase.y + float;
    rig.rotation.set(
      P.pitch + swayPitch + state.hoverNow.y * I.hoverTiltPitch + state.drag.pitch,
      P.yaw + swayYaw + state.hoverNow.x * I.hoverTiltYaw + state.drag.yaw,
      P.roll,
      'YXZ'
    );

    // Bayangan mengecil sedikit saat laptop naik
    const s = 1 - float * 0.6;
    shadow.scale.set(config.shadow.width * s, config.shadow.depth * s, 1);
    shadowMat.opacity = config.shadow.opacity * s;

    lean.x = state.hoverNow.y * I.hoverTiltPitch;
    lean.y = state.hoverNow.x * I.hoverTiltYaw;
    laptop.update(t);
    companions.update(t, lean);
  }

  let firstFrameSent = false;
  function renderFrame(dt) {
    update(dt);
    renderer.render(scene, camera);
    if (!firstFrameSent) {
      firstFrameSent = true;
      if (onFirstFrame) onFirstFrame();
    }
  }

  // ---------- Loop: berhenti saat hero tak terlihat / tab disembunyikan ----------
  let running = false;
  let rafId = 0;
  let lastTime = 0;
  let inView = true;
  let disposed = false;

  function tick(now) {
    if (!running) return;
    // Batasi delta agar kembali dari tab lain tidak membuat lompatan besar
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    renderFrame(dt);
    rafId = requestAnimationFrame(tick);
  }
  function start() {
    if (staticMode || running || disposed || !inView || document.hidden) return;
    running = true;
    lastTime = performance.now();
    rafId = requestAnimationFrame(tick);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
  }
  function wake() { start(); }

  const io = new IntersectionObserver((entries) => {
    inView = entries[entries.length - 1].isIntersecting;
    if (inView) start(); else stop();
  }, { threshold: 0 });
  io.observe(container);
  cleanups.push(() => io.disconnect());

  listen(document, 'visibilitychange', () => { if (document.hidden) stop(); else start(); });

  const ro = new ResizeObserver(() => layout());
  ro.observe(container);
  cleanups.push(() => ro.disconnect());

  listen(canvas, 'webglcontextlost', (e) => {
    e.preventDefault();
    stop();
    if (onContextLost) onContextLost();
  });

  layout();
  renderFrame(0);
  start();

  function dispose() {
    if (disposed) return;
    disposed = true;
    stop();
    endPointer();
    cleanups.forEach((fn) => fn());
    cleanups.length = 0;
    scene.traverse((obj) => {
      if (obj.geometry) disposables.add(obj.geometry);
      if (obj.material) (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((m) => disposables.add(m));
    });
    disposables.forEach((r) => r.dispose && r.dispose());
    disposables.clear();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
    container.classList.remove('is-dragging');
  }

  return { dispose };
}
