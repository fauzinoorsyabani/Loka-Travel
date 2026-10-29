import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

const CATEGORIES = [
  { id: 'All', label: 'Semua Kategori' },
  { id: 'Taman Hiburan', label: 'Taman Hiburan' },
  { id: 'Camp', label: 'Camp & Alam' },
  { id: 'Mountain', label: 'Pegunungan' },
  { id: 'Beach', label: 'Pantai & Laut' },
];

export default function TourPackages({
  cfData,
  usersList = [],
  activeUserId = 'vanica',
  activeUser = null,
  isLoggedIn = false,
  onChangeUser,
  onCategoryChange,
  currentCategory = 'All',
  onBookPackage,
  onSyncCity,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('cf');
  const [bookingLoadingId, setBookingLoadingId] = useState(null);

  const filteredPackages = useMemo(() => {
    let list = [...(cfData?.recommendations || [])];
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.location?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.highlights?.toLowerCase().includes(q)
      );
    }
    if (sortOption === 'price_asc') {
      list.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortOption === 'price_desc') {
      list.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortOption === 'duration') {
      list.sort((a, b) => (a.duration_days || 0) - (b.duration_days || 0));
    } else {
      list.sort((a, b) => (b.predicted_cf_rating || 0) - (a.predicted_cf_rating || 0));
    }
    return list;
  }, [cfData?.recommendations, searchQuery, sortOption]);

  const handleBook = async (pkg) => {
    setBookingLoadingId(pkg.id);
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });
      await onBookPackage(pkg.id);
    } finally {
      setBookingLoadingId(null);
    }
  };

  return (
    <section id="cf-workbench" className="space-y-6 sm:space-y-8 scroll-mt-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="max-w-2xl space-y-1.5">
          <p className="text-xs font-mono uppercase tracking-widest text-[#00897B] font-semibold">
            01 · Rekomendasi Paket Wisata Untukmu
          </p>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            Destinasi Pilihan Sesuai Gaya Perjalananmu
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Dipilih cerdas berdasarkan pola perjalanan wisatawan dengan minat serupa agar kamu menemukan destinasi liburan terbaik yang belum pernah kamu kunjungi.
          </p>
        </div>
      </div>

      {/* Filter & Search Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-4">
        {/* Category Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1" id="cf-category-pills">
          {CATEGORIES.map((cat) => {
            const isActive = currentCategory === cat.id;
            return (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => onCategoryChange(cat.id)}
                data-cat={cat.id}
                className={`cf-cat-btn px-4 py-2.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-[#0B3B68] text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-[#0B3B68]'
                }`}
              >
                {cat.label}
              </motion.button>
            );
          })}
        </div>

        {/* Live Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          <input
            type="search"
            id="cf-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama wisata atau kota..."
            className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#0B3B68] sm:w-60 shadow-xs"
          />
          <select
            id="cf-sort-select"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0B3B68] shadow-xs"
          >
            <option value="cf">Urutkan: Paling Cocok Untukmu</option>
            <option value="price_asc">Urutkan: Harga Terendah</option>
            <option value="price_desc">Urutkan: Harga Tertinggi</option>
            <option value="duration">Urutkan: Durasi Singkat</option>
          </select>
        </div>
      </div>

      {/* Tour Package Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6" id="cf-packages-grid">
        {filteredPackages.length === 0 ? (
          <div className="col-span-full card-surface p-8 text-center text-sm text-slate-500">
            Tidak ada paket wisata yang cocok dengan kata kunci pencarian.
          </div>
        ) : (
          filteredPackages.map((pkg, idx) => (
            <motion.article
              key={pkg.id || idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.05 }}
              whileHover={{ y: -4 }}
              className="card-surface border border-slate-300 hover:border-[#0B3B68] overflow-hidden flex flex-col justify-between transition shadow-xs"
            >
              <div>
                <div className="relative h-48 sm:h-52 bg-slate-100 overflow-hidden">
                  <picture>
                    <source srcset={pkg.image_avif || pkg.image} type="image/avif" />
                    <source srcset={pkg.image_webp || pkg.image} type="image/webp" />
                    <img
                      src={pkg.image}
                      alt={pkg.name}
                      width="640"
                      height="400"
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                    />
                  </picture>
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-[#061F38]/80 backdrop-blur-sm text-white text-[11px] font-semibold">
                    {pkg.cf_match_percent || Math.round((pkg.predicted_cf_rating || 4.5) * 20)}% Cocok Untukmu
                  </div>
                </div>

                <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-slate-500 font-medium">
                        {pkg.category} &middot; {pkg.location}
                      </div>
                      <h3 className="font-bold text-base sm:text-lg text-slate-900 mt-1 leading-snug">
                        {pkg.name}
                      </h3>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm sm:text-base font-extrabold text-[#0B3B68] whitespace-nowrap">
                        Rp {Number(pkg.price || 0).toLocaleString('id-ID')}
                      </div>
                      <div className="text-[11px] sm:text-xs text-slate-500">
                        {pkg.duration_days} hari / paket
                      </div>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
                    {pkg.highlights}
                  </p>

                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                    <span>
                      Rating <strong className="text-slate-800">{pkg.rating} / 5.0</strong>
                    </span>
                    <span>
                      {pkg.already_booked ? (
                        <span className="text-[#0B3B68] font-bold">Terjadwal di Pesananmu</span>
                      ) : (
                        <span>
                          Favorit:{' '}
                          <strong className="text-slate-700">
                            {Array.isArray(pkg.endorsed_by) ? pkg.endorsed_by.join(', ') : 'Traveler Favorit'}
                          </strong>
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  disabled={bookingLoadingId === pkg.id}
                  onClick={() => handleBook(pkg)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#0B3B68] hover:bg-[#082B4D] text-white transition text-center shadow-xs disabled:opacity-50"
                >
                  {bookingLoadingId === pkg.id ? 'Memproses...' : 'Pesan Paket Wisata'}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => onSyncCity(pkg.city)}
                  className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition shrink-0 text-center"
                >
                  {(pkg.location || '').includes(pkg.city) ? `Hotel di ${pkg.city}` : 'Cari Hotel Rombongan'}
                </motion.button>
              </div>
            </motion.article>
          ))
        )}
      </div>
    </section>
  );
}
