/* Arsip data lama untuk migrasi dan mode data:local saja.
   Setelah CMS aktif, kelola karya di Sanity; file ini tidak dimuat frontend.
   Jangan hapus sebelum migrasi diverifikasi. Lihat README.md. */

window.PORTFOLIO_CATEGORIES = [
  { id: 'all-view', label: 'All' },
  { id: 'motion', label: 'Motion' },
  { id: 'design', label: 'Design' },
  { id: 'code', label: 'Code' }
];

window.PORTFOLIO_WORKS = [
  {
    slug: 'different-mv-edit',
    title: 'DIFFERENT - MV Edit',
    category: 'motion',
    description: 'DIFFERENT by le sserafim MV semi mograph editing style, entry for #harraremakechain.',
    tools: ['After Effects'],
    thumbnail: 'assets/img/different.webp',
    thumbnailAlt: 'DIFFERENT MV Edit',
    media: { type: 'image' },
    links: [{ label: 'Instagram', url: 'https://www.instagram.com/p/DMc8OLjJrud/' }]
  },
  {
    slug: 'pionir-gadjah-mada-2026-transition',
    title: 'PIONIR Gadjah Mada 2026 Transition',
    category: 'motion',
    description: 'Motion Graphic Transition animation for PIONIR Gadjah Mada 2026.',
    tools: ['After Effects', 'Premiere Pro'],
    thumbnail: 'assets/img/transisi-pionir.webp',
    thumbnailAlt: 'Transisi PIONIR Gadjah Mada 2026',
    media: { type: 'image' },
    links: [{ label: 'TikTok', url: 'https://vt.tiktok.com/ZSQp75oNT/' }]
  },
  {
    slug: 'logotype-jundannz',
    title: 'Logotype Jundannz',
    category: 'design',
    description: 'Brush stylized logo for my personal rebrand.',
    tools: ['Illustrator'],
    thumbnail: 'assets/img/logotype.webp',
    thumbnailAlt: 'Logotype Jundannz',
    media: { type: 'image' },
    links: [
      {
        label: 'Google Drive',
        url: 'https://drive.google.com/drive/folders/1X6MB0jVHmsZGK7wknPytvenPIkes3oVN?usp=drive_link'
      }
    ]
  },
  {
    slug: 'thumbnail-early-bird',
    title: 'Thumbnail Early Bird',
    category: 'design',
    description: 'Symphony concert store thumbnail for early bird sale.',
    tools: ['Illustrator'],
    thumbnail: 'assets/img/early-bird.webp',
    thumbnailAlt: 'Thumbnail Early Bird',
    media: { type: 'image' },
    links: [
      {
        label: 'Google Drive',
        url: 'https://drive.google.com/file/d/1ieZhQhhXDVBcQ2zQoavZI18FsAaPGHVR/view?usp=drive_link'
      }
    ]
  },
  {
    slug: 'portfolio-website',
    title: 'Portfolio Website',
    category: 'code',
    description: 'My portfolio website for digital personal branding.',
    tools: ['HTML', 'CSS', 'JavaScript'],
    thumbnail: 'assets/img/web.webp',
    thumbnailAlt: 'Portfolio Website',
    media: { type: 'image' },
    links: [{ label: 'GitHub', url: 'https://github.com/Jundannz/Portfolio-Jundan' }]
  },
  {
    slug: 'airbnb-price-prediction',
    title: 'Airbnb Price Prediction',
    category: 'code',
    description: 'Machine learning regression project to predict the airbnb price in Singapore.',
    tools: ['Jupyter Notebook', 'Python'],
    thumbnail: 'assets/img/airbnb.webp',
    thumbnailAlt: 'Airbnb Price Prediction',
    media: { type: 'image' },
    links: [{ label: 'GitHub', url: 'https://github.com/Jundannz/Airbnb-Price-Prediction' }]
  },
  {
    slug: 'jamet-mv-edit',
    title: 'JAMET - MV Edit',
    category: 'motion',
    description: 'JAMET music lyrics video, remake @2good2be.truee to join the trend.',
    tools: ['After Effects'],
    thumbnail: 'assets/img/jamet.webp',
    thumbnailAlt: 'JAMET MV Edit',
    media: { type: 'image' },
    links: [{ label: 'Instagram', url: 'https://www.instagram.com/p/DQB_WugCfn1/' }]
  },
  {
    slug: 'hilang-pmv-edit',
    title: 'Hilang - PMV Edit',
    category: 'motion',
    description: 'Chaeroel - Hilang | Ryo Yamada PMV Edit.',
    tools: ['After Effects'],
    thumbnail: 'assets/img/hilang.webp',
    thumbnailAlt: 'Hilang PMV Edit',
    media: { type: 'image' },
    links: [{ label: 'Instagram', url: 'https://www.instagram.com/p/DPYw8cNiVU_/' }]
  },
  {
    slug: 'aint-it-fun-pmv-edit',
    title: "Ain't It Fun - PMV Edit",
    category: 'motion',
    description: "A Photo Music Video about Pionir Gadjah Mada 2025 combined with Ain't It Fun music.",
    tools: ['After Effects'],
    thumbnail: 'assets/img/aint-it-fun.webp',
    thumbnailAlt: "Ain't It Fun PMV Edit",
    media: { type: 'image' },
    links: [{ label: 'Instagram', url: 'https://www.instagram.com/jundnn._/reel/DNiBJX4p2_i/' }]
  },
  {
    slug: '4ever-pmv-edit',
    title: '4EVER - PMV Edit',
    category: 'motion',
    description: 'Naykilla - 4EVER | Chinatsu Photo Music Video Edit.',
    tools: ['After Effects'],
    thumbnail: 'assets/img/4ever.webp',
    thumbnailAlt: '4EVER PMV Edit',
    media: { type: 'image' },
    links: [{ label: 'Instagram', url: 'https://www.instagram.com/p/DLufY3XJDCO/' }]
  },
  {
    slug: 'bazar-pamphlet',
    title: 'Bazar Pamphlet',
    category: 'design',
    description: 'A pamphlet for bazaar ramadhan event that sells some daily needs, especially for Idul Fitri.',
    tools: ['Illustrator'],
    thumbnail: 'assets/img/bazar.webp',
    thumbnailAlt: 'Bazar Pamphlet',
    media: { type: 'image' },
    links: [
      {
        label: 'Google Drive',
        url: 'https://drive.google.com/file/d/1HBnEcAXpc5Z-LaWX7AUQoZWGdGLvZGz2/view?usp=drive_link'
      }
    ]
  },
  {
    slug: 'sca-banner',
    title: 'SCA Banner',
    category: 'design',
    description: 'Smago Creative Art banner for branding and google form banner.',
    // Perhatian: label tools di bawah masih mengikuti kartu di landing page
    // dan terlihat tidak sesuai. Mohon dicek lalu ganti bila perlu.
    tools: ['Jupyter Notebook', 'Python'],
    thumbnail: 'assets/img/sca.webp',
    thumbnailAlt: 'SCA Banner',
    media: { type: 'image' },
    links: [
      {
        label: 'Google Drive',
        url: 'https://drive.google.com/file/d/1OmEh5JL_BgsOKY8kVb7bu8xb1lLuYcjn/view?usp=drive_link'
      }
    ]
  },
  {
    slug: 'jundannz-banner',
    title: 'Jundannz Banner',
    category: 'design',
    description:
      'Jundannz banner for personal digital branding. Blends graffiti aesthetics with a winter atmosphere.',
    tools: ['Photoshop'],
    thumbnail: 'assets/img/jundannz-banner.webp',
    thumbnailAlt: 'Jundannz Banner',
    media: { type: 'image' },
    links: [
      {
        label: 'Google Drive',
        url: 'https://drive.google.com/file/d/1cOXgjFqsEQETCDJYYXvftBHnxIE4-bOT/view?usp=drive_link'
      }
    ]
  },
  {
    slug: 'ayo-sandalan-banner',
    title: 'Ayo Sandalan Banner',
    category: 'design',
    description:
      '"Ayo Sandalan" banner is made to use in the "Sandalan" event that is held by Forum Anak Moyudan.',
    tools: ['Illustrator'],
    thumbnail: 'assets/img/ayo-sandalan.webp',
    thumbnailAlt: 'Ayo Sandalan Banner',
    media: { type: 'image' },
    links: [
      {
        label: 'Google Drive',
        url: 'https://drive.google.com/file/d/1bLg_-9focUQ8GXGOLfqUqFPJQTS3vQpy/view?usp=drive_link'
      }
    ]
  },
  {
    slug: 'mushroom-classification',
    title: 'Mushroom Classification',
    category: 'code',
    description:
      'Machine learning classification project to predict the mushroom whether is it poisonous or not.',
    tools: ['Jupyter Notebook', 'Python'],
    thumbnail: 'assets/img/mushroom.webp',
    thumbnailAlt: 'Mushroom Classification',
    media: { type: 'image' },
    links: [{ label: 'GitHub', url: 'https://github.com/Jundannz/Mushroom-Classification-ML' }]
  },
  {
    slug: 'library-management',
    title: 'Library Management',
    category: 'code',
    description:
      'Library Management project is terminal based program that can help organizing books in library.',
    tools: ['C++'],
    thumbnail: 'assets/img/library.webp',
    thumbnailAlt: 'Library Management',
    media: { type: 'image' },
    links: [{ label: 'GitHub', url: 'https://github.com/Jundannz/Library-Management' }]
  },
  {
    slug: 'tictactoe',
    title: 'TicTacToe',
    category: 'code',
    description:
      'This is a semi-big project, making TicTacToe game with some feature and some difficulty against computer.',
    tools: ['C++'],
    thumbnail: 'assets/img/tictactoe.webp',
    thumbnailAlt: 'TicTacToe',
    media: { type: 'image' },
    links: [{ label: 'GitHub', url: 'https://github.com/Jundannz/TicTacToe' }]
  },
  {
    slug: 'rpg-game-system',
    title: 'RPG Game System',
    category: 'code',
    description:
      'RPG Game System project made using C++ language. This project copied how RPG Games logic work.',
    tools: ['C++'],
    thumbnail: 'assets/img/rpg.webp',
    thumbnailAlt: 'RPG Game System',
    media: { type: 'image' },
    links: [{ label: 'GitHub', url: 'https://github.com/Jundannz/RPG-System' }]
  }
];
