import React from 'react';
import { motion } from 'framer-motion';

export default function HybridItinerary({
  itinerary,
  stayNights = 2,
  onAdjustStayNights,
  onCopySummary,
}) {
  const tourPkg = itinerary?.tour_package || {
    name: 'Bukit Jamur Ciwidey & Kebun Teh',
    location: 'Bandung',
    category: 'Camp & Alam',
    highlights: 'Glamping alam terbuka di perkebunan teh Ciwidey dengan fasilitas lengkap.',
    price: 450000,
    duration_days: 2,
  };

  const hotel = itinerary?.hotel || {
    name: 'Grand Mercure Bandung Setiabudi',
    region: 'Bandung',
    match_percent: 92,
    price_per_night: 1100000,
  };

  const roomStrategy =
    itinerary?.room_allocation?.strategy ||
    '1 Deluxe Family Room (Kapasitas 4 orang) + 1 Extra Bed';

  const cost = itinerary?.cost_breakdown || {
    duration_days: tourPkg.duration_days || 2,
    stay_nights: stayNights,
    effective_tour_packs: 3,
    tour_total_idr: 1350000,
    hotel_total_idr: 2200000,
    grand_total_idr: 3550000,
    per_person_idr: 1183333,
  };

  return (
    <section id="hybrid-itinerary-section" className="space-y-6 sm:space-y-8 pt-4 border-t border-slate-200 scroll-mt-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 border-b border-slate-200 pb-5">
        <div className="max-w-2xl space-y-1.5">
          <p className="text-xs font-mono uppercase tracking-widest text-[#00897B] font-semibold">
            03 · Rencana Perjalanan &amp; Estimasi Biaya Rombongan
          </p>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            Ringkasan Paket Wisata &amp; Kamar Hotel Pilihanmu
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Menggabungkan paket wisata terpilih dengan konfigurasi kamar hotel rombongan serta menghitung estimasi biaya per peserta secara transparan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Stay Nights Stepper */}
          <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs shadow-xs">
            <span className="text-slate-600 font-medium">Durasi Menginap:</span>
            <button
              type="button"
              onClick={() => onAdjustStayNights(-1)}
              className="w-7 h-7 rounded-lg border border-slate-300 font-bold text-slate-700 hover:border-[#0B3B68] transition"
            >
              &minus;
            </button>
            <span id="stay-nights-control" className="font-mono font-bold text-slate-900 px-1">
              {cost.stay_nights || stayNights}
            </span>
            <span className="text-slate-500">malam</span>
            <button
              type="button"
              onClick={() => onAdjustStayNights(1)}
              className="w-7 h-7 rounded-lg border border-slate-300 font-bold text-slate-700 hover:border-[#0B3B68] transition"
            >
              +
            </button>
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={onCopySummary}
            className="px-4 py-2.5 rounded-xl bg-[#0B3B68] hover:bg-[#082B4D] text-white font-semibold text-xs transition shrink-0 shadow-xs"
          >
            Salin Rencana Perjalanan
          </motion.button>
        </div>
      </div>

      {/* 3-Column Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6" id="hybrid-itinerary-card">
        {/* 1. Tour Package Summary */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="card-surface p-5 sm:p-6 flex flex-col justify-between space-y-4"
        >
          <div>
            <div className="text-xs font-mono uppercase text-slate-400">1. Paket Wisata Pilihan</div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1" id="itin-pkg-name">
              {tourPkg.name}
            </h3>
            <p className="text-xs text-slate-500 mt-1" id="itin-pkg-meta">
              {tourPkg.location} &middot; {cost.duration_days} Hari ({tourPkg.category})
            </p>
            <p className="text-xs text-slate-600 mt-3 leading-relaxed" id="itin-pkg-desc">
              {tourPkg.highlights}
            </p>
          </div>
          <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs gap-2">
            <span className="text-slate-500">
              Subtotal Wisata (<span id="itin-packs-count">{cost.effective_tour_packs}</span> paket):
            </span>
            <span className="font-mono font-bold text-slate-900 whitespace-nowrap" id="itin-tour-total">
              Rp {Number(cost.tour_total_idr || 0).toLocaleString('id-ID')}
            </span>
          </div>
        </motion.div>

        {/* 2. Group Hotel Summary */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="card-surface p-5 sm:p-6 flex flex-col justify-between space-y-4"
        >
          <div>
            <div className="text-xs font-mono uppercase text-slate-400">2. Akomodasi Hotel Rombongan</div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1" id="itin-hotel-name">
              {hotel.name}
            </h3>
            <p className="text-xs text-slate-500 mt-1" id="itin-hotel-meta">
              {hotel.region} &middot; {hotel.match_percent || Math.round((hotel.composite_score || 0.88) * 100)}% Cocok
            </p>
            <p className="text-xs text-[#0B3B68] font-medium mt-3" id="itin-room-strategy">
              {roomStrategy} ({cost.stay_nights || stayNights} malam)
            </p>
          </div>
          <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs gap-2">
            <span className="text-slate-500">Subtotal Hotel:</span>
            <span className="font-mono font-bold text-slate-900 whitespace-nowrap" id="itin-hotel-total">
              Rp {Number(cost.hotel_total_idr || 0).toLocaleString('id-ID')}
            </span>
          </div>
        </motion.div>

        {/* 3. Total & Per-Person Economics */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="card-surface p-5 sm:p-6 bg-[#F2F7FB] border-[#CBD5E1] flex flex-col justify-between space-y-4"
        >
          <div className="space-y-1">
            <div className="text-xs font-mono uppercase text-[#0B3B68] font-semibold">
              3. Total Estimasi Rombongan
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0B3B68] font-mono pt-1" id="itin-grand-total">
              Rp {Number(cost.grand_total_idr || 0).toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-slate-600">
              Gabungan paket wisata &amp; seluruh kamar hotel rombongan
            </p>
          </div>
          <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs gap-2">
            <span className="text-slate-600 font-medium">Estimasi per Orang:</span>
            <span className="font-mono font-bold text-sm text-[#00897B] whitespace-nowrap" id="itin-per-person">
              Rp {Number(cost.per_person_idr || 0).toLocaleString('id-ID')} / tamu
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
