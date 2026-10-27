/* ==========================================================================
   MODEL LAPTOP KARTUN (prosedural)
   --------------------------------------------------------------------------
   Origin model = tengah bawah base. Depan laptop menghadap +Z, atas = +Y.
   Struktur:
     laptop
     ├─ base (cangkang, deck, keyboard, trackpad, kaki, port)
     ├─ hinge
     └─ lidPivot (berputar di engsel) → cangkang lid, bezel, layar, playhead
   ========================================================================== */

import * as THREE from '../vendor/three/three.module.js';
import { roundedPlate, roundedSlab, puffyExtrude, sparkleShape } from './geometry-utils.js';
import { createScreenTexture, TIMELINE_AREA } from './screen-texture.js';

export function createLaptop(config, track, maxAnisotropy) {
  const L = config.laptop;
  const C = config.colors;
  const q = { curveSegments: config.render.curveSegments, bevelSegments: config.render.bevelSegments };
  const mat = (color, roughness = config.material.roughness) =>
    track(new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 }));
  const geo = (g) => track(g);

  const laptop = new THREE.Group();
  laptop.name = 'laptop';

  const bodyMat = mat(C.body, config.material.satinRoughness);
  const darkMat = mat(C.hinge, 0.7);

  // ---------- BASE ----------
  const base = new THREE.Mesh(
    geo(roundedPlate(L.width, L.depth, L.baseThickness, L.cornerRadius, L.baseThickness * 0.45, q)),
    bodyMat
  );
  base.position.y = L.baseThickness / 2;
  laptop.add(base);

  // Deck lavender sedikit menonjol di atas cangkang → kesan dua-tone kartun
  const deckH = 0.05;
  const deckTop = L.baseThickness + deckH * 0.5;
  const deck = new THREE.Mesh(
    geo(roundedPlate(L.width - 0.14, L.depth - 0.14, deckH, L.cornerRadius - 0.07, 0.022, q)),
    mat(C.deck)
  );
  deck.position.y = L.baseThickness + 0.002;
  laptop.add(deck);

  // Cekungan keyboard (gelap)
  const keysW = L.keyCols * L.keySize + (L.keyCols - 1) * L.keyGap;
  const keysD = (L.keyRows + 1) * L.keySize + L.keyRows * L.keyGap; // +1 baris spasi
  const wellPad = 0.09;
  const kbCenterZ = -L.depth / 2 + 0.2 + (keysD + wellPad * 2) / 2;
  const well = new THREE.Mesh(
    geo(roundedPlate(keysW + wellPad * 2, keysD + wellPad * 2, 0.03, 0.1, 0.012, q)),
    mat(C.keyboardWell, 0.8)
  );
  well.position.set(0, deckTop + 0.008, kbCenterZ);
  laptop.add(well);

  // Tombol keyboard: satu InstancedMesh supaya ringan (1 draw call)
  const keyH = 0.07;
  const keyGeo = geo(roundedPlate(L.keySize, L.keySize, keyH, 0.05, 0.025, { curveSegments: 3, bevelSegments: 2 }));
  const keyMat = mat('#ffffff', 0.55);
  const keyCount = L.keyRows * L.keyCols;
  const keys = new THREE.InstancedMesh(keyGeo, keyMat, keyCount);
  const m4 = new THREE.Matrix4();
  const keyColor = new THREE.Color();
  const accentAt = { '0,0': 0, [`2,${L.keyCols - 1}`]: 1, [`${L.keyRows - 1},${L.keyCols - 2}`]: 2 };
  const x0 = -keysW / 2 + L.keySize / 2;
  const z0 = kbCenterZ - keysD / 2 + L.keySize / 2;
  const keyY = deckTop + 0.02 + keyH / 2;
  let k = 0;
  for (let r = 0; r < L.keyRows; r++) {
    for (let c = 0; c < L.keyCols; c++) {
      m4.makeTranslation(x0 + c * (L.keySize + L.keyGap), keyY, z0 + r * (L.keySize + L.keyGap));
      keys.setMatrixAt(k, m4);
      const accent = accentAt[`${r},${c}`];
      keyColor.set(accent === undefined ? C.key : C.keyAccents[accent]);
      keys.setColorAt(k, keyColor);
      k++;
    }
  }
  laptop.add(keys);

  // Spasi
  const spaceW = L.keySize * 5 + L.keyGap * 4;
  const space = new THREE.Mesh(
    geo(roundedPlate(spaceW, L.keySize, keyH, 0.05, 0.025, { curveSegments: 3, bevelSegments: 2 })),
    mat(C.key, 0.55)
  );
  space.position.set(0, keyY, z0 + L.keyRows * (L.keySize + L.keyGap));
  laptop.add(space);

  // Trackpad
  const padD = L.depth / 2 - (kbCenterZ + keysD / 2 + wellPad) - 0.16;
  const trackpad = new THREE.Mesh(
    geo(roundedPlate(L.width * 0.36, padD, 0.03, 0.1, 0.012, q)),
    mat(C.trackpad, 0.5)
  );
  trackpad.position.set(0, deckTop + 0.008, L.depth / 2 - 0.1 - padD / 2);
  laptop.add(trackpad);

  // Kaki karet (bulat pipih) + port di sisi kiri
  const footGeo = geo(new THREE.SphereGeometry(0.1, 12, 8));
  const footMat = mat(C.feet, 0.8);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    const foot = new THREE.Mesh(footGeo, footMat);
    foot.scale.set(1.3, 0.45, 1);
    foot.position.set(sx * (L.width / 2 - 0.35), 0.01, sz * (L.depth / 2 - 0.3));
    laptop.add(foot);
  });
  const portGeo = geo(roundedSlab(0.24, 0.07, 0.04, 0.035, 0.012, { curveSegments: 3, bevelSegments: 1 }));
  const portMat = mat(C.port, 0.7);
  [0.15, -0.25].forEach((z) => {
    const port = new THREE.Mesh(portGeo, portMat);
    port.rotation.y = Math.PI / 2;
    port.position.set(-L.width / 2 + 0.005, L.baseThickness * 0.5, z);
    laptop.add(port);
  });

  // ---------- ENGSEL ----------
  const hingeR = 0.11;
  const hingeZ = -L.depth / 2 + 0.12;
  const hingeY = L.baseThickness + 0.03;
  const hinge = new THREE.Mesh(geo(new THREE.CapsuleGeometry(hingeR, L.width * 0.62, 6, 14)), darkMat);
  hinge.rotation.z = Math.PI / 2;
  hinge.position.set(0, hingeY, hingeZ);
  laptop.add(hinge);

  // ---------- LID ----------
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, hingeY, hingeZ);
  lidPivot.rotation.x = -L.lidOpenAngle; // condong ke belakang
  laptop.add(lidPivot);

  const lidShell = new THREE.Mesh(
    geo(roundedSlab(L.width, L.lidHeight, L.lidThickness, L.cornerRadius, L.lidThickness * 0.45, q)),
    bodyMat
  );
  lidShell.position.y = L.lidHeight / 2 + 0.02;
  lidPivot.add(lidShell);

  const front = L.lidThickness / 2;
  const bezel = new THREE.Mesh(
    geo(roundedSlab(L.width - 0.16, L.lidHeight - 0.16, 0.04, L.cornerRadius - 0.08, 0.015, q)),
    mat(C.bezel, 0.75)
  );
  bezel.position.set(0, lidShell.position.y, front + 0.005);
  lidPivot.add(bezel);

  // Layar (MeshBasic agar warna ilustrasi tetap cerah dan tidak tertimpa cahaya)
  const tex = track(createScreenTexture(config, maxAnisotropy));
  const aspect = L.screenTexture.width / L.screenTexture.height;
  const screenW = L.width - 0.44;
  const screenH = screenW / aspect;
  const screenMat = track(new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  const screen = new THREE.Mesh(geo(roundedScreenGeometry(screenW, screenH, 0.08)), screenMat);
  const screenY = lidShell.position.y + 0.04;
  screen.position.set(0, screenY, front + 0.03);
  lidPivot.add(screen);

  // Kamera kecil di bezel atas
  const cam = new THREE.Mesh(geo(new THREE.SphereGeometry(0.032, 10, 8)), mat('#4a3d60', 0.4));
  cam.position.set(0, screenY + screenH / 2 + (L.lidHeight - 0.16 - screenH) / 4, front + 0.03);
  lidPivot.add(cam);

  // Playhead timeline (mesh terpisah agar animasi tidak menggambar ulang tekstur)
  const T = TIMELINE_AREA;
  const toLocal = (u, v) => new THREE.Vector2((u - 0.5) * screenW, (0.5 - v) * screenH);
  const top = toLocal(0, T.y0 - 0.055);
  const bottom = toLocal(0, T.y1 + 0.01);
  const lineH = top.y - bottom.y;
  const playheadMat = track(new THREE.MeshBasicMaterial({ color: C.chipPlayhead, toneMapped: false }));
  const playhead = new THREE.Group();
  const line = new THREE.Mesh(geo(new THREE.PlaneGeometry(0.022, lineH)), playheadMat);
  line.position.y = bottom.y + lineH / 2;
  const headShape = new THREE.Shape();
  headShape.moveTo(-0.055, 0.05);
  headShape.lineTo(0.055, 0.05);
  headShape.lineTo(0.055, -0.01);
  headShape.lineTo(0, -0.06);
  headShape.lineTo(-0.055, -0.01);
  headShape.closePath();
  const head = new THREE.Mesh(geo(new THREE.ShapeGeometry(headShape)), playheadMat);
  head.position.y = top.y;
  playhead.add(line, head);
  playhead.position.set(0, screenY, front + 0.035);
  lidPivot.add(playhead);
  const playheadRange = [toLocal(T.x0, 0).x, toLocal(T.x1, 0).x];

  // Emblem bintang di punggung lid — hadiah kecil saat laptop diputar
  const emblem = new THREE.Mesh(
    geo(puffyExtrude(sparkleShape(0.42, 0.2), { depth: 0.06, bevel: 0.025, ...q })),
    mat(C.emblem, 0.5)
  );
  emblem.position.set(0, lidShell.position.y, -front - 0.01);
  emblem.rotation.y = Math.PI;
  lidPivot.add(emblem);

  /** Update per frame: hanya playhead di layar. */
  function update(elapsed) {
    const t = (elapsed * config.render.playheadSpeed) % 1;
    playhead.position.x = playheadRange[0] + (playheadRange[1] - playheadRange[0]) * t;
  }

  return { object: laptop, update };
}

/** Bidang layar bersudut membulat dengan UV 0–1 penuh. */
function roundedScreenGeometry(w, h, r) {
  const shape = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ShapeGeometry(shape, 6);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + w / 2) / w, (pos.getY(i) + h / 2) / h);
  return g;
}
