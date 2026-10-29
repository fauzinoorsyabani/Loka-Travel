import React from 'react';
import { motion } from 'framer-motion';

export default function MyOrders({ schedule = [], activeUserName = 'Vanica', onReset }) {
  return (
    <section id="schedule-section" className="space-y-6 sm:space-y-8 pt-4 border-t border-slate-200 scroll-mt-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <p className="text-xs font-mono uppercase tracking-widest text-[#00897B] font-semibold">
            04 · Jadwal &amp; Pesanan Saya
          </p>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Daftar Perjalanan Wisata Terkonfirmasi
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Setiap paket wisata yang kamu pesan otomatis tercatat dalam jadwal perjalananmu dan memperbarui rekomendasi destinasi berikutnya secara cerdas.
          </p>
        </div>

        <motion.button
          whileTap={{ scale: 0.96 }}
          type="button"
          onClick={onReset}
          className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:border-[#0B3B68] text-slate-700 text-xs font-semibold transition shrink-0 self-start sm:self-auto shadow-xs"
        >
          Reset Daftar Pesanan
        </motion.button>
      </div>

      {/* Confirmed Orders Container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5" id="schedule-cards-container">
        {schedule.length > 0 ? (
          schedule.map((item, idx) => {
            const localizedDuration = String(item.duration || '').replace('days', 'hari');
            const localizedStatus =
              item.status === 'Confirmation Process' ? 'Menunggu Konfirmasi' : item.status;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="card-surface p-4 flex items-center gap-4"
              >
                <picture className="w-16 h-16 shrink-0">
                  <source srcset={item.image_avif || item.image} type="image/avif" />
                  <source srcset={item.image_webp || item.image} type="image/webp" />
                  <img
                    src={item.image}
                    alt={item.name}
                    width="64"
                    height="64"
                    className="w-16 h-16 rounded-xl object-cover"
                    loading="lazy"
                  />
                </picture>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="text-[11px] font-mono text-slate-500">{item.date}</div>
                  <h3 className="font-bold text-sm text-slate-900 truncate">{item.name}</h3>
                  <p className="text-xs text-slate-500">
                    {localizedDuration} &middot; {item.packs} paket &middot;{' '}
                    <span className="text-[#00897B] font-medium">{localizedStatus}</span>
                  </p>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="col-span-full card-surface p-6 text-center text-xs sm:text-sm text-slate-500">
            Belum ada paket wisata terjadwal untuk profil <strong className="text-slate-800">{activeUserName}</strong>. Pilih tombol <strong className="text-[#0B3B68]">Pesan Paket Wisata</strong> di atas untuk menambahkan rencana perjalananmu.
          </div>
        )}
      </div>
    </section>
  );
}
