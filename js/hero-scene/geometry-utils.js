/* ==========================================================================
   UTILITAS GEOMETRI PROSEDURAL
   Bentuk dasar bergaya kartun (sudut membulat + bevel tebal) yang dipakai
   laptop dan elemen pendamping. Tidak ada model eksternal.
   ========================================================================== */

import * as THREE from '../vendor/three/three.module.js';

/** Persegi panjang bersudut membulat, berpusat di (0,0). */
export function roundedRectShape(width, height, radius) {
  const r = Math.max(0.001, Math.min(radius, width / 2, height / 2));
  const x = -width / 2;
  const y = -height / 2;
  const s = new THREE.Shape();
  s.moveTo(x + r, y);
  s.lineTo(x + width - r, y);
  s.quadraticCurveTo(x + width, y, x + width, y + r);
  s.lineTo(x + width, y + height - r);
  s.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  s.lineTo(x + r, y + height);
  s.quadraticCurveTo(x, y + height, x, y + height - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/**
 * Normal halus dengan "sudut lipatan": sisi yang bertemu dengan sudut kecil
 * (bevel, lengkungan) dihaluskan, sedangkan sudut tajam tetap tegas.
 * Hasilnya terlihat lembut seperti ilustrasi 3D, bukan faset kaku.
 */
export function smoothNormals(geometry, creaseAngle = Math.PI / 3) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  const pos = g.attributes.position;
  const count = pos.count;
  const faceNormals = new Float32Array(count * 3);
  const buckets = new Map();
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const key = (i) => `${Math.round(pos.getX(i) * 1e4)},${Math.round(pos.getY(i) * 1e4)},${Math.round(pos.getZ(i) * 1e4)}`;

  for (let i = 0; i < count; i += 3) {
    a.fromBufferAttribute(pos, i);
    b.fromBufferAttribute(pos, i + 1);
    c.fromBufferAttribute(pos, i + 2);
    c.sub(b);
    a.sub(b);
    c.cross(a).normalize();
    for (let j = 0; j < 3; j++) {
      faceNormals.set([c.x, c.y, c.z], (i + j) * 3);
      const k = key(i + j);
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k).push(i + j);
    }
  }

  const cosLimit = Math.cos(creaseAngle);
  const normals = new Float32Array(count * 3);
  for (const list of buckets.values()) {
    for (const i of list) {
      let nx = 0, ny = 0, nz = 0;
      const fx = faceNormals[i * 3], fy = faceNormals[i * 3 + 1], fz = faceNormals[i * 3 + 2];
      for (const j of list) {
        const gx = faceNormals[j * 3], gy = faceNormals[j * 3 + 1], gz = faceNormals[j * 3 + 2];
        if (fx * gx + fy * gy + fz * gz >= cosLimit) { nx += gx; ny += gy; nz += gz; }
      }
      const len = Math.hypot(nx, ny, nz) || 1;
      normals[i * 3] = nx / len;
      normals[i * 3 + 1] = ny / len;
      normals[i * 3 + 2] = nz / len;
    }
  }
  g.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  return g;
}

/**
 * Ekstrusi bentuk 2D dengan bevel membulat, dipusatkan di origin.
 * Ketebalan berada di sumbu Z. `inflate` memperbesar bentuk ke luar
 * (dipakai untuk outline putih pada kursor).
 */
export function puffyExtrude(shape, { depth, bevel, curveSegments = 6, bevelSegments = 4, inflate = 0 }) {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(depth - bevel * 2, 0.002),
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel + inflate,
    bevelSegments,
    curveSegments
  });
  geometry.center();
  return smoothNormals(geometry);
}

/**
 * Lempengan membulat (dimensi akhir = width × height × thickness termasuk bevel).
 * Group material 0 = permukaan depan/belakang, 1 = sisi + bevel.
 */
export function roundedSlab(width, height, thickness, radius, bevel, quality = {}) {
  const b = Math.min(bevel, thickness / 2 - 0.001, width / 2 - 0.001, height / 2 - 0.001);
  const shape = roundedRectShape(width - b * 2, height - b * 2, Math.max(radius - b, 0.001));
  return puffyExtrude(shape, { depth: thickness, bevel: b, ...quality });
}

/** Sama seperti roundedSlab, tetapi ketebalan di sumbu Y (untuk permukaan datar). */
export function roundedPlate(width, depth, thickness, radius, bevel, quality = {}) {
  const geometry = roundedSlab(width, depth, thickness, radius, bevel, quality);
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

/** Bintang 4 sudut bergaya "sparkle" dengan sisi melengkung ke dalam. */
export function sparkleShape(radius, pinch = 0.14) {
  const c = radius * pinch;
  const s = new THREE.Shape();
  s.moveTo(0, radius);
  s.quadraticCurveTo(c, c, radius, 0);
  s.quadraticCurveTo(c, -c, 0, -radius);
  s.quadraticCurveTo(-c, -c, -radius, 0);
  s.quadraticCurveTo(-c, c, 0, radius);
  return s;
}

/** Segitiga "play" bersudut membulat, menghadap ke kanan. */
export function roundedTriangleShape(size, radius) {
  const pts = [
    new THREE.Vector2(-size * 0.42, size * 0.5),
    new THREE.Vector2(size * 0.58, 0),
    new THREE.Vector2(-size * 0.42, -size * 0.5)
  ];
  const s = new THREE.Shape();
  for (let i = 0; i < 3; i++) {
    const prev = pts[(i + 2) % 3];
    const cur = pts[i];
    const next = pts[(i + 1) % 3];
    const p1 = cur.clone().add(prev.clone().sub(cur).setLength(radius));
    const p2 = cur.clone().add(next.clone().sub(cur).setLength(radius));
    if (i === 0) s.moveTo(p1.x, p1.y); else s.lineTo(p1.x, p1.y);
    s.quadraticCurveTo(cur.x, cur.y, p2.x, p2.y);
  }
  s.closePath();
  return s;
}

/** Kursor panah — titik polygon sama dengan kursor kustom website (globals.css). */
export function cursorShape(size) {
  const svg = [[4.82, 1.93], [4.81, 30.07], [13.44, 19.38], [27.19, 19.01]];
  const scale = size / 28;
  const pts = svg.map(([x, y]) => new THREE.Vector2((x - 4.82) * scale, -(y - 1.93) * scale));
  return new THREE.Shape(pts);
}
