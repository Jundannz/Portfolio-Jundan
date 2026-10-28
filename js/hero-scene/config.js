/* ==========================================================================
   KONFIGURASI SCENE 3D HERO
   --------------------------------------------------------------------------
   Semua angka yang biasanya ingin diubah dikumpulkan di sini:
   warna, ukuran laptop, posisi elemen pendamping, kecepatan animasi, dan
   batas interaksi. Satuan panjang = unit dunia Three.js (laptop ±3.4 unit
   lebar). Sudut dalam radian (0.1 rad ≈ 5.7°). Waktu dalam detik.
   ========================================================================== */

export const HERO_SCENE_CONFIG = {
  // Palet mengikuti css/styleguide.css (teal, coral, mint, charcoal, sage,
  // kuning mentega, putih hangat). Tidak ada lagi tint ungu.
  colors: {
    body: '#f3ece0',         // cangkang laptop: krem/putih hangat
    bodyEdge: '#0e6f65',     // tepian teal pada bodi (dipakai di lid/base trim)
    deck: '#f7f5ef',         // permukaan atas base (sekitar keyboard)
    keyboardWell: '#242b29', // cekungan keyboard charcoal
    key: '#fbf9f3',          // tombol keyboard putih hangat
    keyAccents: ['#58bfa7', '#f5a38b', '#f5d77a'], // Esc / Enter / panah: mint, coral, kuning
    trackpad: '#e6e0d4',
    hinge: '#242b29',
    bezel: '#242b29',
    feet: '#242b29',
    port: '#3a423f',
    emblem: '#f5a38b',       // bintang di punggung lid (terlihat saat diputar)
    shadow: '#2b3a35',       // bayangan lembut di bawah laptop
    // Elemen pendamping
    playButton: '#58bfa7',   // tombol play mint/teal
    playIcon: '#ffffff',
    star: '#f5a38b',         // bintang pendamping coral
    cursor: '#242b29',
    cursorOutline: '#ffffff',
    chipBase: '#242b29',
    chipClips: ['#087f72', '#f5a38b', '#58bfa7'],
    chipPlayhead: '#f5d77a', // playhead kuning mentega
    // Cahaya
    hemiSky: '#fbf7ee',
    hemiGround: '#cfe4da',
    keyLight: '#ffffff',
    fillLight: '#ffe3d6',
    rimLight: '#d8f2ea'
  },

  // Material matte/satin (0 = mengkilap, 1 = sangat matte)
  material: { roughness: 0.62, satinRoughness: 0.45 },

  // Dimensi laptop
  laptop: {
    width: 3.4,           // lebar base & lid
    depth: 2.3,           // kedalaman base
    baseThickness: 0.28,
    lidHeight: 2.25,
    lidThickness: 0.15,
    cornerRadius: 0.24,   // pembulatan sudut (kesan kartun)
    lidOpenAngle: 0.3,    // kemiringan lid ke belakang dari posisi tegak
    keyRows: 5,
    keyCols: 12,
    keySize: 0.19,
    keyGap: 0.045,
    screenTexture: { width: 1024, height: 640 }
  },

  // Pose utama (tiga perempat). yaw negatif = layar menghadap ke kiri/teks.
  pose: {
    yaw: -0.52,
    pitch: 0.1,
    roll: 0.02,
    // Titik putar laptop (relatif tengah-bawah base). Diletakkan di tengah
    // badan laptop agar putaran drag terasa "di tempat", tidak mengorbit.
    pivot: { y: 0.95, z: 0.35 },
    // Pergeseran seluruh laptop di dunia (untuk menata komposisi)
    offset: { x: 0, y: 0, z: 0 }
  },

  // Bayangan lembut di bawah laptop
  shadow: { width: 4.6, depth: 3.2, y: -0.12, opacity: 0.22 },

  // Kamera: tidak ada zoom/pan. Jarak dihitung otomatis dari ukuran canvas
  // agar kotak komposisi (halfWidth × halfHeight di sekitar target) selalu muat.
  camera: {
    fov: 30,
    elevation: 0.32,                 // sudut pandang dari atas (rad)
    target: { x: 0, y: 1.15, z: 0 }, // titik pusat komposisi
    halfWidth: 3.15,                 // setengah lebar area yang wajib terlihat
    halfHeight: 2.15,                // setengah tinggi area yang wajib terlihat
    depthAllowance: 1.1,             // cadangan untuk objek yang lebih dekat ke kamera
    padding: 1.03
  },

  // Gerakan otomatis saat diam
  idle: {
    floatAmplitude: 0.12,  // naik-turun (unit)
    floatPeriod: 5.2,      // detik per siklus
    swayYaw: 0.1,          // ayunan kiri-kanan (rad)
    swayPeriod: 8.4,
    swayPitch: 0.025,
    swayPitchPeriod: 6.1,
    blendSpeed: 2.2        // kecepatan transisi masuk/keluar mode idle
  },

  // Interaksi pointer & drag
  interaction: {
    hoverTiltYaw: 0.2,       // kemiringan maks dari posisi pointer
    hoverTiltPitch: 0.1,
    hoverSmoothing: 4.5,     // makin besar makin cepat mengikuti pointer
    dragYawPerPixel: 0.011,  // ±285px ≈ setengah putaran
    dragPitchPerPixel: 0.006,
    dragPitchLimit: 0.35,    // batas putaran atas-bawah saat drag
    dragStartThreshold: 4,   // px sebelum gerakan dianggap drag
    inertiaDamping: 4.5,     // perlambatan putaran setelah dilepas
    maxSpin: 9,              // batas kecepatan putar (rad/detik)
    returnDelay: 1.6,        // jeda diam sebelum kembali ke pose utama
    returnSpeed: 3.0,        // kecepatan kembali (eksponensial)
    companionParallax: 0.35  // seberapa jauh elemen pendamping ikut condong
  },

  // Elemen pendamping (maks. 4). Posisi dalam unit dunia, relatif pusat laptop.
  companions: {
    playButton: { position: [-2.35, 2.55, 0.3], scale: 1, float: [0.13, 4.3, 0.0], wobble: [0.18, 5.6] },
    star:       { position: [2.55, 3.0, -0.7], scale: 0.9, float: [0.1, 3.7, 1.3], wobble: [0.25, 6.4], spin: 0.35 },
    cursor:     { position: [2.35, 0.0, 1.45], scale: 0.95, float: [0.08, 3.1, 2.4], wobble: [0.12, 4.2] },
    timeline:   { position: [-2.2, -0.05, 1.25], scale: 1, float: [0.09, 4.8, 3.6], wobble: [0.1, 7.1], playheadSpeed: 0.18 }
  },

  // Performa
  render: {
    maxPixelRatio: 1.75,
    curveSegments: 6,   // kehalusan sudut membulat
    bevelSegments: 4,
    playheadSpeed: 0.07 // kecepatan playhead di layar (fraksi timeline per detik)
  }
};
