/* ==========================================================================
   ISI LAYAR LAPTOP — ilustrasi antarmuka editing sederhana
   Digambar sekali ke <canvas> 2D lalu dipakai sebagai tekstur.
   Playhead TIDAK digambar di sini; ia mesh terpisah agar animasinya tidak
   perlu menggambar ulang tekstur setiap frame.
   ========================================================================== */

import * as THREE from '../vendor/three/three.module.js';

// Area timeline dalam koordinat tekstur (0–1, origin kiri-atas).
// Dipakai juga oleh laptop.js untuk menempatkan playhead.
export const TIMELINE_AREA = { x0: 0.115, x1: 0.965, y0: 0.625, y1: 0.95 };

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export function createScreenTexture(config, maxAnisotropy = 1) {
  const { width: W, height: H } = config.laptop.screenTexture;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const s = W / 1024; // skala bila ukuran tekstur diubah

  // Latar aplikasi (charcoal, tanpa tint ungu)
  ctx.fillStyle = '#1b211f';
  ctx.fillRect(0, 0, W, H);

  // Bar judul dengan tiga titik (seperti jendela di website)
  ctx.fillStyle = '#242b29';
  ctx.fillRect(0, 0, W, 44 * s);
  ['#f5a38b', '#f5d77a', '#58bfa7'].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc((30 + i * 26) * s, 22 * s, 8 * s, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = '#39423f';
  roundRect(ctx, 400 * s, 14 * s, 224 * s, 16 * s, 8 * s);
  ctx.fill();

  // Panel preview (kiri) — komposisi abstrak teal → coral
  const px = 26 * s, py = 66 * s, pw = 620 * s, ph = 316 * s;
  const grad = ctx.createLinearGradient(px, py, px + pw, py + ph);
  grad.addColorStop(0, '#087f72');
  grad.addColorStop(1, '#f5a38b');
  ctx.save();
  roundRect(ctx, px, py, pw, ph, 18 * s);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.clip();
  // "bukit" berlapis
  ctx.fillStyle = 'rgba(20, 26, 24, 0.35)';
  ctx.beginPath();
  ctx.moveTo(px, py + ph);
  ctx.quadraticCurveTo(px + pw * 0.25, py + ph * 0.45, px + pw * 0.55, py + ph * 0.8);
  ctx.quadraticCurveTo(px + pw * 0.8, py + ph * 0.55, px + pw, py + ph * 0.7);
  ctx.lineTo(px + pw, py + ph);
  ctx.fill();
  // matahari mint
  ctx.fillStyle = '#58bfa7';
  ctx.beginPath();
  ctx.arc(px + pw * 0.72, py + ph * 0.36, 52 * s, 0, Math.PI * 2);
  ctx.fill();
  // kotak kuning mentega miring
  ctx.save();
  ctx.translate(px + pw * 0.24, py + ph * 0.34);
  ctx.rotate(-0.28);
  ctx.fillStyle = '#f5d77a';
  roundRect(ctx, -38 * s, -38 * s, 76 * s, 76 * s, 12 * s);
  ctx.fill();
  ctx.restore();
  ctx.restore();
  // tombol play di tengah preview
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.beginPath();
  ctx.arc(px + pw / 2, py + ph / 2, 34 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#087f72';
  ctx.beginPath();
  ctx.moveTo(px + pw / 2 - 10 * s, py + ph / 2 - 16 * s);
  ctx.lineTo(px + pw / 2 + 17 * s, py + ph / 2);
  ctx.lineTo(px + pw / 2 - 10 * s, py + ph / 2 + 16 * s);
  ctx.closePath();
  ctx.fill();

  // Panel properti (kanan) — slider & keyframe
  const rx = 668 * s, rw = 330 * s;
  ctx.fillStyle = '#242b29';
  roundRect(ctx, rx, py, rw, ph, 18 * s);
  ctx.fill();
  const sliders = [0.72, 0.4, 0.86, 0.55];
  sliders.forEach((v, i) => {
    const y = py + (46 + i * 66) * s;
    ctx.fillStyle = '#39423f';
    roundRect(ctx, rx + 22 * s, y - 14 * s, 120 * s, 12 * s, 6 * s);
    ctx.fill();
    ctx.fillStyle = '#39423f';
    roundRect(ctx, rx + 22 * s, y + 10 * s, rw - 44 * s, 10 * s, 5 * s);
    ctx.fill();
    ctx.fillStyle = ['#f5a38b', '#58bfa7', '#dcebe3', '#f5d77a'][i];
    roundRect(ctx, rx + 22 * s, y + 10 * s, (rw - 44 * s) * v, 10 * s, 5 * s);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(rx + 22 * s + (rw - 44 * s) * v, y + 15 * s, 11 * s, 0, Math.PI * 2);
    ctx.fill();
  });

  // Timeline
  const T = TIMELINE_AREA;
  const tx0 = T.x0 * W, tx1 = T.x1 * W, ty0 = T.y0 * H, ty1 = T.y1 * H;
  ctx.fillStyle = '#151a18';
  roundRect(ctx, 26 * s, ty0 - 34 * s, W - 52 * s, ty1 - ty0 + 50 * s, 16 * s);
  ctx.fill();
  // penggaris waktu
  ctx.fillStyle = '#5d6a65';
  for (let i = 0; i <= 34; i++) {
    const x = tx0 + (tx1 - tx0) * (i / 34);
    const tall = i % 5 === 0;
    ctx.fillRect(x - 1.5 * s, ty0 - (tall ? 24 : 16) * s, 3 * s, (tall ? 14 : 7) * s);
  }
  // label track (ikon bulat kecil)
  const trackColors = ['#087f72', '#f5a38b', '#58bfa7'];
  const trackH = (ty1 - ty0) / 3;
  trackColors.forEach((c, i) => {
    ctx.fillStyle = '#242b29';
    roundRect(ctx, 40 * s, ty0 + i * trackH + 8 * s, 64 * s, trackH - 16 * s, 10 * s);
    ctx.fill();
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(60 * s, ty0 + i * trackH + trackH / 2, 8 * s, 0, Math.PI * 2);
    ctx.fill();
  });
  // klip per track: [mulai, akhir] dalam fraksi lebar timeline
  const clips = [
    [[0.0, 0.3], [0.33, 0.62], [0.66, 1.0]],
    [[0.08, 0.44], [0.5, 0.78]],
    [[0.0, 0.92]]
  ];
  clips.forEach((list, i) => {
    const y = ty0 + i * trackH + 8 * s;
    const h = trackH - 16 * s;
    list.forEach(([a, b], j) => {
      const x = tx0 + (tx1 - tx0) * a;
      const w = (tx1 - tx0) * (b - a) - 6 * s;
      ctx.fillStyle = trackColors[i];
      roundRect(ctx, x, y, w, h, 10 * s);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      roundRect(ctx, x + 8 * s, y + 8 * s, Math.min(w * 0.4, 90 * s), 9 * s, 4.5 * s);
      ctx.fill();
      if (i === 0 && j === 1) {
        // keyframe berlian
        ctx.fillStyle = '#f5d77a';
        [0.3, 0.7].forEach((k) => {
          ctx.save();
          ctx.translate(x + w * k, y + h * 0.62);
          ctx.rotate(Math.PI / 4);
          ctx.fillRect(-6 * s, -6 * s, 12 * s, 12 * s);
          ctx.restore();
        });
      }
    });
  });
  // gelombang audio di track ketiga
  ctx.strokeStyle = 'rgba(20,26,24,0.55)';
  ctx.lineWidth = 3 * s;
  ctx.lineCap = 'round';
  const wy = ty0 + 2.5 * trackH;
  for (let x = tx0 + 14 * s; x < tx0 + (tx1 - tx0) * 0.9; x += 9 * s) {
    const amp = (Math.abs(Math.sin(x * 0.031) * Math.cos(x * 0.0071)) * 0.8 + 0.15) * (trackH * 0.3);
    ctx.beginPath();
    ctx.moveTo(x, wy - amp);
    ctx.lineTo(x, wy + amp);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(4, maxAnisotropy);
  return texture;
}
