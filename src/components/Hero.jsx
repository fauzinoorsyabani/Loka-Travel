import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HERO_SCENIC_SLIDES } from '../constants/initialData';

export default function Hero({
  benchmarks,
  latencyMs = 28,
  onQuickSearch,
  onScrollToSection,
}) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [quickCity, setQuickCity] = useState('Bandung');
  const [quickGuests, setQuickGuests] = useState('2-1-0');

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SCENIC_SLIDES.length);
    }, 7500);
    return () => clearInterval(timer);
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    const [adults, children, seniors] = quickGuests.split('-').map(Number);
    if (onQuickSearch) {
      onQuickSearch({
        city: quickCity,
        adults: adults || 2,
        children: children || 0,
        seniors: seniors || 0,
      });
    }
    const el = document.getElementById('group-hotel-workbench');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const citiesList = benchmarks?.cities || [
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
  ];

  return (
    <section className="relative overflow-hidden bg-[#061F38] text-white border-b border-slate-200">
      {/* Animated Scenic Background Slides (Ken Burns Smooth Zoom-In / Zoom-Out) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {HERO_SCENIC_SLIDES.map((slide, idx) => (
          <div
            key={slide.idx}
            className={`hero-slide absolute inset-0 transition-opacity duration-1000 ${
              activeSlide === idx ? 'opacity-100' : 'opacity-0'
            }`}
            data-slide-idx={slide.idx}
          >
            <picture className="block w-full h-full">
              <source srcset={slide.avif} type="image/avif" />
              <source srcset={slide.webp} type="image/webp" />
              <img
                src={slide.webp}
                alt={slide.alt}
                width="1600"
                height="900"
                className="w-full h-full object-cover hero-zoom-media"
                loading={idx === 0 ? 'eager' : 'lazy'}
              />
            </picture>
          </div>
        ))}
        {/* Ocean Gradient Overlay for Deep Contrast & Readability */}
        <div
          className="absolute inset-0 hero-overlay-gradient"
          style={{
            background:
              'linear-gradient(180deg, rgba(6, 31, 56, 0.55) 0%, rgba(11, 59, 104, 0.45) 50%, rgba(6, 31, 56, 0.78) 100%)',
          }}
        />
      </div>

      {/* Hero Content Container: FAANG Clean Centered Composition */}
      <div className="page-container relative z-10 py-16 sm:py-24 lg:py-28 text-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="max-w-4xl mx-auto space-y-6 sm:space-y-8"
        >
          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.14] drop-shadow-md">
            Liburan Impian &amp; Hotel Rombongan Tanpa Ribet.
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base lg:text-lg text-slate-100/90 max-w-2xl mx-auto leading-relaxed drop-shadow-xs">
            Rekomendasi paket wisata dan konfigurasi kamar hotel keluarga terbaik di Indonesia.
          </p>

          {/* Unified Floating Search Bar (Airbnb / Apple Travel Glassmorphic Style) */}
          <form
            onSubmit={handleHeroSearch}
            className="w-full max-w-3xl mx-auto p-2 sm:p-2.5 rounded-2xl sm:rounded-full bg-white/95 backdrop-blur-md shadow-2xl shadow-black/35 border border-white/60 text-slate-900"
          >
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
              {/* Destination City Field */}
              <div className="flex-1 px-4 py-2.5 sm:py-2 text-left">
                <label
                  htmlFor="hero-quick-city"
                  className="block text-[10px] font-bold uppercase tracking-wider text-slate-500"
                >
                  Kota Destinasi
                </label>
                <select
                  id="hero-quick-city"
                  value={quickCity}
                  onChange={(e) => setQuickCity(e.target.value)}
                  aria-label="Pilih Kota Destinasi"
                  className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-none cursor-pointer mt-0.5"
                >
                  <option value="All">Semua Destinasi ({benchmarks?.total_hotels || 797} Hotel)</option>
                  {citiesList.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Guests Composition Field */}
              <div className="flex-1 px-4 py-2.5 sm:py-2 text-left">
                <label
                  htmlFor="hero-quick-guests"
                  className="block text-[10px] font-bold uppercase tracking-wider text-slate-500"
                >
                  Rombongan Tamu
                </label>
                <select
                  id="hero-quick-guests"
                  value={quickGuests}
                  onChange={(e) => setQuickGuests(e.target.value)}
                  aria-label="Pilih Komposisi Rombongan"
                  className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-none cursor-pointer mt-0.5"
                >
                  <option value="2-1-0">Keluarga (2 Dewasa, 1 Anak)</option>
                  <option value="4-2-1">3 Generasi (4 Dewasa, 2 Anak, 1 Lansia)</option>
                  <option value="2-0-0">Pasangan / 2 Dewasa</option>
                  <option value="6-0-0">Grup Sahabat (6 Dewasa)</option>
                </select>
              </div>

              {/* Action Button */}
              <div className="p-1 sm:p-0 sm:pr-1 shrink-0">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  className="w-full sm:w-auto px-7 py-3 sm:py-3.5 rounded-xl sm:rounded-full bg-[#00897B] hover:bg-[#00796B] text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2"
                >
                  <span>Cari Rekomendasi</span>
                  <span aria-hidden="true">&rarr;</span>
                </motion.button>
              </div>
            </div>
          </form>

          {/* Clean Trust Line (Pure typography, no boxed borders, no emojis) */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-200/90 font-medium">
            <span>{benchmarks?.total_hotels || 797} Hotel Terkurasi</span>
            <span className="hidden sm:inline text-slate-400">&bull;</span>
            <span>{benchmarks?.total_cities || 11} Kota Destinasi</span>
            <span className="hidden sm:inline text-slate-400">&bull;</span>
            <span>Alokasi Kamar Keluarga Otomatis</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
