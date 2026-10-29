import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SMART_PRESETS } from '../constants/initialData';

export default function HotelRecommender({
  benchmarks,
  hotelData,
  onUpdateRecommendations,
  onSelectHotel,
  initialCity = 'Jakarta',
  isLoading = false,
}) {
  const [city, setCity] = useState(initialCity);
  const [mode, setMode] = useState('advanced');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(1);
  const [seniors, setSeniors] = useState(0);
  const [budget, setBudget] = useState(2500000);
  const [activePreset, setActivePreset] = useState('family');

  const [amenities, setAmenities] = useState({
    wifi: 0.8,
    pool: 0.8,
    restaurant: 0.7,
    kids: 0.8,
    accessible: 0.6,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('composite');
  const [fineTuningOpen, setFineTuningOpen] = useState(false);

  useEffect(() => {
    if (initialCity && initialCity !== city) {
      setCity(initialCity);
    }
  }, [initialCity]);

  const handleSmartPreset = (presetKey) => {
    setActivePreset(presetKey);
    const p = SMART_PRESETS.find((item) => item.id === presetKey);
    if (!p) return;
    setAdults(p.adults);
    setChildren(p.children);
    setSeniors(p.seniors);
    setBudget(p.budget);
    const newAmenities = {
      wifi: p.amenities.wifi ? 0.9 : 0.2,
      pool: p.amenities.pool ? 0.9 : 0.2,
      restaurant: p.amenities.restaurant ? 0.9 : 0.2,
      kids: p.amenities.kids ? 0.9 : 0.2,
      accessible: p.amenities.accessible ? 0.9 : 0.2,
    };
    setAmenities(newAmenities);

    onUpdateRecommendations({
      city,
      mode,
      adults: p.adults,
      children: p.children,
      seniors: p.seniors,
      budget_per_night: p.budget,
      preferences: newAmenities,
    });
  };

  const handleAmenityChipToggle = (key) => {
    const isCurrentlyActive = (amenities[key] || 0) >= 0.6;
    const nextVal = isCurrentlyActive ? 0.2 : 0.9;
    const updated = { ...amenities, [key]: nextVal };
    setAmenities(updated);

    onUpdateRecommendations({
      city,
      mode,
      adults,
      children,
      seniors,
      budget_per_night: budget,
      preferences: updated,
    });
  };

  const handlePrefSliderChange = (key, val) => {
    const updated = { ...amenities, [key]: Number(val) };
    setAmenities(updated);
  };

  const handleBudgetQuickPill = (amount) => {
    setBudget(amount);
    onUpdateRecommendations({
      city,
      mode,
      adults,
      children,
      seniors,
      budget_per_night: amount,
      preferences: amenities,
    });
  };

  const handleFormSubmit = (e) => {
    if (e) e.preventDefault();
    onUpdateRecommendations({
      city,
      mode,
      adults,
      children,
      seniors,
      budget_per_night: budget,
      preferences: amenities,
    });
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

  const filteredHotels = useMemo(() => {
    let list = (hotelData?.hotels || []).map((h, idx) => ({ ...h, __origIdx: idx }));
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (h) =>
          h.name?.toLowerCase().includes(q) ||
          h.region?.toLowerCase().includes(q) ||
          (h.raw_features || '')?.toLowerCase().includes(q) ||
          (Array.isArray(h.features) && h.features.some((f) => f.toLowerCase().includes(q)))
      );
    }
    if (sortOption === 'price_asc') {
      list.sort((a, b) => (a.price_per_night || 0) - (b.price_per_night || 0));
    } else if (sortOption === 'rating_desc') {
      list.sort((a, b) => (b.userRating || 0) - (a.userRating || 0));
    } else {
      list.sort((a, b) => (b.composite_score || 0) - (a.composite_score || 0));
    }
    return list;
  }, [hotelData?.hotels, searchQuery, sortOption]);

  const roomAlloc = hotelData?.room_allocation || {
    strategy: '1 Deluxe Family Room (Kapasitas 4 orang)',
    total_guests: adults + children + seniors,
    total_rooms: 1,
  };

  return (
    <section id="group-hotel-workbench" className="space-y-6 sm:space-y-8 pt-4 border-t border-slate-200 scroll-mt-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 border-b border-slate-200 pb-5">
        <div className="max-w-2xl space-y-1.5">
          <p className="text-xs font-mono uppercase tracking-widest text-[#00897B] font-semibold">
            02 · Rekomendasi Hotel &amp; Konfigurasi Kamar Rombongan
          </p>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            Sesuaikan Kamar &amp; Fasilitas untuk Seluruh Anggota Rombongan
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Otomatis menyesuaikan jumlah kamar &amp; fasilitas hotel untuk dewasa, anak-anak, dan lansia dari {benchmarks?.total_hotels || 797} hotel pilihan di Indonesia.
          </p>
        </div>

        <div className="text-left md:text-right bg-white md:bg-transparent p-3.5 md:p-0 rounded-xl border md:border-0 border-slate-200">
          <div className="text-xs text-slate-500">Konfigurasi Kamar Disarankan</div>
          <div className="text-sm font-bold text-[#0B3B68] mt-0.5" id="allocation-summary-pill">
            {roomAlloc.total_guests} Tamu &rarr; {roomAlloc.strategy}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Filter Form Panel (4 Columns on Desktop) */}
        <div className="lg:col-span-4 card-surface p-4 sm:p-6 space-y-5">
          <form id="hotel-recommender-form" onSubmit={handleFormSubmit} className="space-y-5">
            {/* 1-Click Smart Group Presets */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-800">Pilihan Cepat Rombongan</span>
                <span className="text-[11px] text-[#00897B] font-medium">1-Klik Otomatis</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-semibold">
                {SMART_PRESETS.map((preset) => (
                  <motion.button
                    key={preset.id}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => handleSmartPreset(preset.id)}
                    id={`preset-${preset.id}`}
                    className={`preset-btn px-2.5 py-2 rounded-xl border text-left transition ${
                      activePreset === preset.id
                        ? 'border-[#0B3B68] bg-[#0B3B68]/10 text-[#0B3B68] font-bold shadow-xs'
                        : 'border-slate-200 bg-slate-50/70 hover:border-[#0B3B68] hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {preset.title}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Destination City */}
            <div>
              <label htmlFor="input-city" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kota Destinasi ({benchmarks?.total_cities || 11} Kota Populer)
              </label>
              <select
                id="input-city"
                name="city"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  onUpdateRecommendations({
                    city: e.target.value,
                    mode,
                    adults,
                    children,
                    seniors,
                    budget_per_night: budget,
                    preferences: amenities,
                  });
                }}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#0B3B68] shadow-xs"
              >
                <option value="All">Semua Kota ({benchmarks?.total_hotels || 797} Hotel)</option>
                {citiesList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Recommendation Mode */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Fokus Rekomendasi
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs font-semibold">
                {[
                  { id: 'advanced', label: 'Rombongan' },
                  { id: 'basic', label: 'Fasilitas' },
                  { id: 'group', label: 'Rating Tamu' },
                ].map((item) => (
                  <label key={item.id} className="cursor-pointer">
                    <input
                      type="radio"
                      name="mode"
                      value={item.id}
                      checked={mode === item.id}
                      onChange={(e) => {
                        setMode(e.target.value);
                        onUpdateRecommendations({
                          city,
                          mode: e.target.value,
                          adults,
                          children,
                          seniors,
                          budget_per_night: budget,
                          preferences: amenities,
                        });
                      }}
                      className="peer sr-only"
                    />
                    <div className="py-2.5 px-2 text-center rounded-xl border border-slate-300 text-slate-700 peer-checked:border-[#0B3B68] peer-checked:bg-[#0B3B68] peer-checked:text-white transition">
                      {item.label}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Guest Steppers */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Tamu &amp; Anggota Rombongan
              </label>
              <div className="space-y-2">
                {/* Adults */}
                <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-slate-200 bg-slate-50/70">
                  <div>
                    <div className="text-xs font-semibold text-slate-800">Dewasa</div>
                    <div className="text-[11px] text-slate-500">Usia 13–59 tahun</div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const next = Math.max(1, adults - 1);
                        setAdults(next);
                        onUpdateRecommendations({
                          city,
                          mode,
                          adults: next,
                          children,
                          seniors,
                          budget_per_night: budget,
                          preferences: amenities,
                        });
                      }}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-slate-300 bg-white text-slate-700 font-bold hover:border-[#0B3B68] transition"
                    >
                      &minus;
                    </button>
                    <input
                      type="number"
                      id="input-adults"
                      min="1"
                      max="20"
                      value={adults}
                      onChange={(e) => setAdults(Number(e.target.value))}
                      className="w-9 text-center bg-transparent font-bold text-sm focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = Math.min(20, adults + 1);
                        setAdults(next);
                        onUpdateRecommendations({
                          city,
                          mode,
                          adults: next,
                          children,
                          seniors,
                          budget_per_night: budget,
                          preferences: amenities,
                        });
                      }}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-slate-300 bg-white text-slate-700 font-bold hover:border-[#0B3B68] transition"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Children */}
                <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-slate-200 bg-slate-50/70">
                  <div>
                    <div className="text-xs font-semibold text-slate-800">Anak-anak</div>
                    <div className="text-[11px] text-slate-500">Prioritas klub &amp; arena bermain</div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const next = Math.max(0, children - 1);
                        setChildren(next);
                        onUpdateRecommendations({
                          city,
                          mode,
                          adults,
                          children: next,
                          seniors,
                          budget_per_night: budget,
                          preferences: amenities,
                        });
                      }}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-slate-300 bg-white text-slate-700 font-bold hover:border-[#0B3B68] transition"
                    >
                      &minus;
                    </button>
                    <input
                      type="number"
                      id="input-children"
                      min="0"
                      max="15"
                      value={children}
                      onChange={(e) => setChildren(Number(e.target.value))}
                      className="w-9 text-center bg-transparent font-bold text-sm focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = Math.min(15, children + 1);
                        setChildren(next);
                        onUpdateRecommendations({
                          city,
                          mode,
                          adults,
                          children: next,
                          seniors,
                          budget_per_night: budget,
                          preferences: amenities,
                        });
                      }}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-slate-300 bg-white text-slate-700 font-bold hover:border-[#0B3B68] transition"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Seniors */}
                <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-slate-200 bg-slate-50/70">
                  <div>
                    <div className="text-xs font-semibold text-slate-800">Lansia</div>
                    <div className="text-[11px] text-slate-500">Prioritas lift &amp; akses mudah</div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const next = Math.max(0, seniors - 1);
                        setSeniors(next);
                        onUpdateRecommendations({
                          city,
                          mode,
                          adults,
                          children,
                          seniors: next,
                          budget_per_night: budget,
                          preferences: amenities,
                        });
                      }}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-slate-300 bg-white text-slate-700 font-bold hover:border-[#0B3B68] transition"
                    >
                      &minus;
                    </button>
                    <input
                      type="number"
                      id="input-seniors"
                      min="0"
                      max="15"
                      value={seniors}
                      onChange={(e) => setSeniors(Number(e.target.value))}
                      className="w-9 text-center bg-transparent font-bold text-sm focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = Math.min(15, seniors + 1);
                        setSeniors(next);
                        onUpdateRecommendations({
                          city,
                          mode,
                          adults,
                          children,
                          seniors: next,
                          budget_per_night: budget,
                          preferences: amenities,
                        });
                      }}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-slate-300 bg-white text-slate-700 font-bold hover:border-[#0B3B68] transition"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Nightly Budget Slider & Quick Pills */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-semibold text-slate-700">Batas Anggaran / Malam</span>
                <span className="font-mono font-bold text-[#0B3B68]" id="budget-display">
                  Rp {Number(budget).toLocaleString('id-ID')}
                </span>
              </div>
              <input
                type="range"
                id="input-budget"
                min="300000"
                max="10000000"
                step="100000"
                value={budget}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setBudget(val);
                }}
                onMouseUp={() =>
                  onUpdateRecommendations({
                    city,
                    mode,
                    adults,
                    children,
                    seniors,
                    budget_per_night: budget,
                    preferences: amenities,
                  })
                }
                onTouchEnd={() =>
                  onUpdateRecommendations({
                    city,
                    mode,
                    adults,
                    children,
                    seniors,
                    budget_per_night: budget,
                    preferences: amenities,
                  })
                }
                className="w-full"
              />
              <div className="flex items-center gap-1.5 mt-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleBudgetQuickPill(1500000)}
                  id="pill-budget-15"
                  className={`budget-pill flex-1 py-1 px-1.5 rounded-lg border text-center transition ${
                    budget <= 1500000
                      ? 'border-[#0B3B68] bg-[#0B3B68]/10 text-[#0B3B68] font-semibold'
                      : 'border-slate-200 text-slate-600 font-medium hover:border-[#0B3B68]'
                  }`}
                >
                  ≤ 1,5 Jt
                </button>
                <button
                  type="button"
                  onClick={() => handleBudgetQuickPill(2500000)}
                  id="pill-budget-25"
                  className={`budget-pill flex-1 py-1 px-1.5 rounded-lg border text-center transition ${
                    budget > 1500000 && budget <= 2500000
                      ? 'border-[#0B3B68] bg-[#0B3B68]/10 text-[#0B3B68] font-semibold'
                      : 'border-slate-200 text-slate-600 font-medium hover:border-[#0B3B68]'
                  }`}
                >
                  ≤ 2,5 Jt
                </button>
                <button
                  type="button"
                  onClick={() => handleBudgetQuickPill(5000000)}
                  id="pill-budget-50"
                  className={`budget-pill flex-1 py-1 px-1.5 rounded-lg border text-center transition ${
                    budget > 2500000 && budget <= 5000000
                      ? 'border-[#0B3B68] bg-[#0B3B68]/10 text-[#0B3B68] font-semibold'
                      : 'border-slate-200 text-slate-600 font-medium hover:border-[#0B3B68]'
                  }`}
                >
                  ≤ 5 Jt
                </button>
                <button
                  type="button"
                  onClick={() => handleBudgetQuickPill(10000000)}
                  id="pill-budget-all"
                  className={`budget-pill flex-1 py-1 px-1.5 rounded-lg border text-center transition ${
                    budget > 5000000
                      ? 'border-[#0B3B68] bg-[#0B3B68]/10 text-[#0B3B68] font-semibold'
                      : 'border-slate-200 text-slate-600 font-medium hover:border-[#0B3B68]'
                  }`}
                >
                  Semua
                </button>
              </div>
            </div>

            {/* Amenity Filter Chips */}
            <div className="space-y-2.5 pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">Fasilitas Utama Pilihan</span>
                <span className="text-[11px] text-slate-500">Klik untuk memilih</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  {
                    key: 'wifi',
                    label: 'WiFi Cepat',
                    icon: (
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
                      </svg>
                    ),
                  },
                  {
                    key: 'pool',
                    label: 'Kolam Renang',
                    icon: (
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15c2.25 0 3.75-1.5 5.25-1.5s3 1.5 5.25 1.5 3.75-1.5 5.25-1.5 3 1.5 5.25 1.5M2.25 19.5c2.25 0 3.75-1.5 5.25-1.5s3 1.5 5.25 1.5 3.75-1.5 5.25-1.5 3 1.5 5.25 1.5" />
                      </svg>
                    ),
                  },
                  {
                    key: 'restaurant',
                    label: 'Restoran',
                    icon: (
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v6.75a2.25 2.25 0 01-4.5 0V3m2.25 0v18m11.25-18v18m0-18a3.75 3.75 0 013.75 3.75v3a3.75 3.75 0 01-3.75 3.75v7.5" />
                      </svg>
                    ),
                  },
                  {
                    key: 'kids',
                    label: 'Area Anak',
                    icon: (
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm5.25 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75z" />
                      </svg>
                    ),
                  },
                  {
                    key: 'accessible',
                    label: 'Akses Lansia & Spa',
                    icon: (
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                    ),
                  },
                ].map((chip) => {
                  const isActive = (amenities[chip.key] || 0) >= 0.6;
                  return (
                    <motion.button
                      key={chip.key}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      id={`chip-${chip.key}`}
                      onClick={() => handleAmenityChipToggle(chip.key)}
                      className={`amenity-chip px-3 py-1.5 rounded-xl border text-xs font-medium transition flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-[#0B3B68] text-white border-[#0B3B68] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-[#0B3B68]'
                      }`}
                    >
                      <span>{chip.icon}</span>
                      <span>{chip.label}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Collapsible Fine-Tuning */}
              <div className="text-[11px] text-slate-500 pt-1">
                <button
                  type="button"
                  onClick={() => setFineTuningOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between font-medium hover:text-slate-800 py-1"
                >
                  <span>Sesuaikan bobot detail (opsional)</span>
                  <span className={`text-xs transition-transform ${fineTuningOpen ? 'rotate-180' : ''}`}>▾</span>
                </button>
                {fineTuningOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2.5 space-y-2 pt-2 border-t border-slate-100"
                  >
                    {[
                      { key: 'wifi', label: 'WiFi Cepat', id: 'pref-wifi', valId: 'val-wifi' },
                      { key: 'pool', label: 'Kolam Renang', id: 'pref-pool', valId: 'val-pool' },
                      { key: 'restaurant', label: 'Restoran', id: 'pref-restaurant', valId: 'val-restaurant' },
                      { key: 'kids', label: 'Area Anak', id: 'pref-kids', valId: 'val-kids' },
                      { key: 'accessible', label: 'Akses Lansia & Spa', id: 'pref-accessible', valId: 'val-accessible' },
                    ].map((item) => (
                      <div key={item.key}>
                        <div className="flex justify-between text-[11px] mb-0.5">
                          <span className="text-slate-600">{item.label}</span>
                          <span className="font-mono font-semibold text-slate-900" id={item.valId}>
                            {amenities[item.key]}
                          </span>
                        </div>
                        <input
                          type="range"
                          id={item.id}
                          min="0"
                          max="1"
                          step="0.1"
                          value={amenities[item.key]}
                          onChange={(e) => handlePrefSliderChange(item.key, e.target.value)}
                          onMouseUp={handleFormSubmit}
                          onTouchEnd={handleFormSubmit}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              id="btn-submit-hotel"
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-xl bg-[#0B3B68] hover:bg-[#082B4D] text-white font-semibold text-xs transition shadow-sm hover:shadow disabled:opacity-50"
            >
              {isLoading ? 'Memperbarui Rekomendasi...' : 'Perbarui Rekomendasi Hotel'}
            </motion.button>
          </form>
        </div>

        {/* Right Hotel Results Column (8 Columns on Desktop) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Room Allocation Strategy Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-surface p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 p-1 flex items-center justify-center shrink-0">
                <picture className="w-12 h-12 flex items-center justify-center">
                  <source srcset="/static/images/mascot/mascot-thumbsup.webp" type="image/webp" />
                  <img
                    src="/static/images/mascot/mascot-thumbsup.png"
                    alt="Si Loka Rekomendasi"
                    className="w-12 h-12 object-contain"
                  />
                </picture>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-mono uppercase text-[#00897B] font-semibold">
                  Rekomendasi Konfigurasi Kamar Rombongan
                </div>
                <div className="text-base sm:text-lg font-extrabold text-slate-900" id="room-strategy-headline">
                  {roomAlloc.strategy}
                </div>
                <p className="text-xs text-slate-500" id="room-strategy-sub">
                  Acuan Standar Fasilitas:{' '}
                  <strong>{hotelData?.reference_hotel?.name || 'Hotel Rekomendasi Utama'}</strong>{' '}
                  ({hotelData?.reference_hotel?.region || city}) &middot; Respons: {hotelData?.latency_ms || 28} ms
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <div>
                <div className="text-[11px] text-slate-500">Total Tamu</div>
                <div className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono" id="alloc-guests-count">
                  {roomAlloc.total_guests}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500">Total Kamar</div>
                <div className="text-lg sm:text-xl font-extrabold text-[#0B3B68] font-mono" id="alloc-rooms-count">
                  {roomAlloc.total_rooms}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Search & Sort Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
            <input
              type="search"
              id="hotel-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama hotel, area, atau fasilitas..."
              className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#0B3B68] flex-1 shadow-xs"
            />
            <select
              id="hotel-sort-select"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0B3B68] shadow-xs"
            >
              <option value="composite">Urutkan: Paling Sesuai Rombongan</option>
              <option value="price_asc">Urutkan: Harga Kamar Terendah</option>
              <option value="rating_desc">Urutkan: Rating Tamu Tertinggi</option>
            </select>
          </div>

          {/* Hotel Cards Stack */}
          <div className="space-y-4 sm:space-y-5" id="hotel-results-grid">
            {filteredHotels.length === 0 ? (
              <div className="card-surface p-8 text-center text-sm text-slate-500">
                Tidak ada hotel yang cocok dengan filter pencarian.
              </div>
            ) : (
              filteredHotels.map((h, idx) => (
                <motion.article
                  key={h.id || idx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.04 }}
                  whileHover={{ y: -2 }}
                  className="card-surface border border-slate-300 hover:border-[#0B3B68] overflow-hidden grid grid-cols-1 sm:grid-cols-12 shadow-xs transition"
                >
                  <div className="sm:col-span-5 relative h-48 sm:h-full min-h-[190px] bg-slate-100">
                    <picture>
                      <source srcset={h.image_avif || h.image} type="image/avif" />
                      <source srcset={h.image_webp || h.image} type="image/webp" />
                      <img
                        src={h.image}
                        alt={h.name}
                        width="640"
                        height="400"
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        loading="lazy"
                      />
                    </picture>
                  </div>

                  <div className="sm:col-span-7 p-4 sm:p-6 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs text-slate-500">
                            {h.region} &middot; {h.category} ({Math.round(h.starRating || 4)} Bintang)
                          </div>
                          <h3 className="font-bold text-base text-slate-900 mt-0.5 leading-snug">
                            {h.name}
                          </h3>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-mono font-bold text-[#00897B]">
                            {h.match_percent || Math.round((h.composite_score || 0.85) * 100)}% Cocok
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Rating {h.userRating}/10 ({Number(h.numReviews || 0).toLocaleString('id-ID')} ulasan)
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-slate-500 pt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                        <span>
                          Kecocokan Fasilitas:{' '}
                          <strong className="text-slate-800">
                            {Math.round(Number(h.preference_score || 0) * 100)}%
                          </strong>
                        </span>
                        <span>
                          &middot; Kenyamanan Rombongan:{' '}
                          <strong className="text-slate-800">
                            {Math.round(Number(h.demographic_score || 0) * 100)}%
                          </strong>
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {Array.isArray(h.features) ? h.features.slice(0, 5).join(' · ') : h.features}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-[11px] text-slate-500">
                          Rp {Number(h.price_per_night || 0).toLocaleString('id-ID')} / kamar &middot; Total Semua Kamar:
                        </div>
                        <div className="text-sm font-extrabold text-[#0B3B68]">
                          Rp {Number(h.estimated_group_total_per_night || h.price_per_night || 0).toLocaleString('id-ID')} / malam
                        </div>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        onClick={() => onSelectHotel(h)}
                        className="w-full sm:w-auto text-center py-2.5 px-4 rounded-xl text-xs font-semibold border border-slate-300 hover:border-[#0B3B68] hover:text-[#0B3B68] text-slate-700 transition shrink-0 shadow-xs"
                      >
                        Pilih ke Rencana Perjalanan
                      </motion.button>
                    </div>
                  </div>
                </motion.article>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
