export const HERO_SCENIC_SLIDES = [
  {
    idx: 0,
    title: 'Nusa Penida, Bali',
    avif: '/static/images/tours/pkg_nusa_penida.avif',
    webp: '/static/images/tours/pkg_nusa_penida.webp',
    alt: 'Nusa Penida Kelingking Beach Bali',
  },
  {
    idx: 1,
    title: 'Danau Toba, Sumatera',
    avif: '/static/images/tours/pkg_danau_toba.avif',
    webp: '/static/images/tours/pkg_danau_toba.webp',
    alt: 'Danau Toba & Pulau Samosir',
  },
  {
    idx: 2,
    title: 'Ciwidey, Bandung',
    avif: '/static/images/tours/pkg_bukit_jamur.avif',
    webp: '/static/images/tours/pkg_bukit_jamur.webp',
    alt: 'Bukit Jamur Ciwidey Bandung',
  },
];

export const SMART_PRESETS = [
  {
    id: 'family',
    title: 'Keluarga (4 Tamu)',
    adults: 2,
    children: 2,
    seniors: 0,
    budget: 2500000,
    amenities: { wifi: true, pool: true, restaurant: true, kids: true, accessible: false },
  },
  {
    id: 'senior',
    title: 'Ramah Lansia (3 Tamu)',
    adults: 2,
    children: 0,
    seniors: 2,
    budget: 2500000,
    amenities: { wifi: true, pool: false, restaurant: true, kids: false, accessible: true },
  },
  {
    id: 'workcation',
    title: 'Bisnis & Kerja (1 Tamu)',
    adults: 1,
    children: 0,
    seniors: 0,
    budget: 1500000,
    amenities: { wifi: true, pool: false, restaurant: true, kids: false, accessible: false },
  },
  {
    id: 'resort',
    title: 'Resor Santai (2 Tamu)',
    adults: 2,
    children: 0,
    seniors: 0,
    budget: 5000000,
    amenities: { wifi: true, pool: true, restaurant: true, kids: false, accessible: true },
  },
];

export const INITIAL_BENCHMARKS = {
  total_hotels: 797,
  total_cities: 11,
  cities: [
    'Banda Aceh',
    'Bandung',
    'Bogor',
    'Jakarta',
    'Medan',
    'Padang',
    'Palembang',
    'Semarang',
    'Solo',
    'Surabaya',
    'Yogyakarta',
  ],
};

export const INITIAL_USERS = [
  { id: 'fauzi', name: 'Fauzi Noor Syabani', role: 'Super Admin & Peneliti Utama', user_type: 'super_admin', avatar: 'F' },
  { id: 'admin_loka', name: 'Admin Operasional Loka', role: 'Admin Operasional Sistem', user_type: 'admin', avatar: 'A' },
  { id: 'vanica', name: 'Vanica (Penjelajah Pantai & Alam)', role: 'Wisatawan Pantai & Pegunungan', user_type: 'user', avatar: 'V' },
  { id: 'andi_explorer', name: 'Andi (Pecinta Gunung & Glamping)', role: 'Wisatawan Alam & Pegunungan', user_type: 'user', avatar: 'A' },
  { id: 'budi_family', name: 'Budi (Liburan Keluarga)', role: 'Wisatawan Keluarga & Taman Hiburan', user_type: 'user', avatar: 'B' },
  { id: 'sarah_family_peer', name: 'Sarah (Wisata Budaya & Keluarga)', role: 'Wisatawan Budaya & Keluarga', user_type: 'user', avatar: 'S' },
  { id: 'reza_adventure', name: 'Reza (Pendaki & Eksplorasi Alam)', role: 'Wisatawan Petualangan & Gunung', user_type: 'user', avatar: 'R' },
];

export const INITIAL_CF_DATA = {
  active_user: { id: 'vanica', name: 'Vanica', rated_count: 4 },
  most_similar_user: 'Andi',
  similarity_score: 0.94,
  peer_ranking: [
    { id: 'andi', name: 'Andi (Gunung & Petualangan)', similarity: 0.94 },
    { id: 'fauzi', name: 'Fauzi (Pantai & Bahari)', similarity: 0.81 },
    { id: 'iswanto', name: 'Iswanto (Rekreasi Keluarga)', similarity: 0.65 },
  ],
  recommendations: [],
  schedule: [],
};

export const INITIAL_ROOM_ALLOCATION = {
  strategy: '1 Deluxe Family Room (Kapasitas 4 orang) + 1 Extra Bed',
  total_guests: 3,
  total_rooms: 1,
  details: 'Rombongan keluarga dengan 2 dewasa dan 1 anak disarankan 1 kamar tipe keluarga.',
};
