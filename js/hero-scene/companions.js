/* ==========================================================================
   ELEMEN PENDAMPING (maks. 4): tombol play, bintang, kursor, potongan timeline
   Masing-masing melayang dengan amplitudo, periode, dan fase berbeda agar
   tidak bergerak serempak. Parameter ada di config.companions.
   ========================================================================== */

import * as THREE from '../vendor/three/three.module.js';
import {
  puffyExtrude, roundedSlab, roundedTriangleShape, sparkleShape, cursorShape
} from './geometry-utils.js';

export function createCompanions(config, track) {
  const C = config.colors;
  const q = { curveSegments: config.render.curveSegments, bevelSegments: config.render.bevelSegments };
  const mat = (color, roughness = config.material.satinRoughness) =>
    track(new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 }));
  const geo = (g) => track(g);

  const group = new THREE.Group();
  group.name = 'companions';
  const items = [];

  function add(name, object, spec) {
    const holder = new THREE.Group();
    holder.position.fromArray(spec.position);
    holder.scale.setScalar(spec.scale);
    holder.add(object);
    group.add(holder);
    items.push({ name, holder, object, spec, baseRotation: object.rotation.clone() });
  }

  // 1. Tombol play: koin teal tebal dengan segitiga putih timbul
  {
    const g = new THREE.Group();
    const disc = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.42, 0.42, 0.2, 32, 1)), mat(C.playButton));
    disc.rotation.x = Math.PI / 2;
    const rim = new THREE.Mesh(geo(new THREE.TorusGeometry(0.42, 0.1, 10, 32)), mat(C.playButton));
    const icon = new THREE.Mesh(
      geo(puffyExtrude(roundedTriangleShape(0.36, 0.06), { depth: 0.1, bevel: 0.03, ...q })),
      mat(C.playIcon, 0.5)
    );
    icon.position.set(0.03, 0, 0.12);
    g.add(disc, rim, icon);
    g.rotation.set(0.05, 0.45, -0.12);
    add('playButton', g, config.companions.playButton);
  }

  // 2. Bintang sparkle pink (gaya bintang dekorasi website)
  {
    const star = new THREE.Mesh(
      geo(puffyExtrude(sparkleShape(0.5, 0.2), { depth: 0.16, bevel: 0.06, ...q })),
      mat(C.star)
    );
    star.rotation.set(0.1, -0.3, 0.2);
    add('star', star, config.companions.star);
  }

  // 3. Kursor panah gelap berlapis outline putih (bentuk sama dengan kursor website)
  {
    const g = new THREE.Group();
    const shape = cursorShape(0.8);
    const body = new THREE.Mesh(geo(puffyExtrude(shape, { depth: 0.12, bevel: 0.03, ...q })), mat(C.cursor, 0.6));
    const outline = new THREE.Mesh(
      geo(puffyExtrude(shape, { depth: 0.08, bevel: 0.02, inflate: 0.05, ...q })),
      mat(C.cursorOutline, 0.6)
    );
    outline.position.z = -0.03;
    g.add(outline, body);
    g.rotation.set(-0.1, -0.35, 0.18);
    add('cursor', g, config.companions.cursor);
  }

  // 4. Potongan timeline: pelat gelap, tiga klip warna, dan playhead kuning
  let chipPlayhead = null;
  let chipRange = [0, 0];
  {
    const g = new THREE.Group();
    const w = 1.25, h = 0.62;
    const plate = new THREE.Mesh(geo(roundedSlab(w, h, 0.12, 0.14, 0.05, q)), mat(C.chipBase, 0.7));
    g.add(plate);
    const clips = [[-0.5, 0.42, 0.13], [0.06, 0.48, 0.13], [-0.32, 0.6, -0.13]];
    clips.forEach(([x, cw, y], i) => {
      const clip = new THREE.Mesh(
        geo(roundedSlab(cw, 0.18, 0.08, 0.06, 0.03, q)),
        mat(C.chipClips[i])
      );
      clip.position.set(x + cw / 2, y, 0.07);
      g.add(clip);
    });
    chipPlayhead = new THREE.Mesh(geo(new THREE.CapsuleGeometry(0.025, 0.56, 4, 8)), mat(C.chipPlayhead, 0.45));
    chipPlayhead.position.z = 0.13;
    chipRange = [-w / 2 + 0.12, w / 2 - 0.12];
    g.add(chipPlayhead);
    g.rotation.set(-0.15, 0.4, 0.08);
    add('timeline', g, config.companions.timeline);
  }

  /**
   * @param elapsed  waktu sejak mulai (detik)
   * @param lean     {x, y} kemiringan laptop — dipakai untuk parallax halus
   */
  function update(elapsed, lean) {
    const TAU = Math.PI * 2;
    for (const it of items) {
      const [amp, period, phase] = it.spec.float;
      const [wobAmp, wobPeriod] = it.spec.wobble;
      const t = elapsed + phase;
      it.holder.position.y = it.spec.position[1] + Math.sin((t / period) * TAU) * amp;
      it.object.rotation.z = it.baseRotation.z + Math.sin((t / wobPeriod) * TAU) * wobAmp;
      it.object.rotation.x = it.baseRotation.x + Math.cos((t / (wobPeriod * 1.3)) * TAU) * wobAmp * 0.4;
      it.object.rotation.y = it.baseRotation.y + (it.spec.spin ? Math.sin(t * it.spec.spin) * 0.6 : 0);
    }
    group.rotation.y = lean.y * config.interaction.companionParallax;
    group.rotation.x = lean.x * config.interaction.companionParallax;
    if (chipPlayhead) {
      const s = (elapsed * config.companions.timeline.playheadSpeed) % 1;
      chipPlayhead.position.x = chipRange[0] + (chipRange[1] - chipRange[0]) * s;
    }
  }

  return { object: group, update };
}
