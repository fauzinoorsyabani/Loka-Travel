import React from 'react';
import { motion } from 'framer-motion';

export default function MobileBottomNav({
  isLoggedIn = false,
  hasBookings = false,
  onOpenAuth,
  onOpenProfile,
  onScrollToSection,
}) {
  const handleClick = (e, sectionId) => {
    e.preventDefault();
    if (onScrollToSection) {
      onScrollToSection(sectionId);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav
      aria-label="Navigasi Cepat Mobile"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 grid grid-cols-4 gap-1 text-[11px] font-semibold text-slate-600"
    >
      <motion.button
        whileTap={{ scale: 0.92 }}
        type="button"
        onClick={(e) => handleClick(e, 'cf-workbench')}
        className="flex flex-col items-center justify-center py-1 rounded-lg hover:text-[#0B3B68] active:bg-slate-100"
      >
        <span>Wisata</span>
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.92 }}
        type="button"
        onClick={(e) => handleClick(e, 'group-hotel-workbench')}
        className="flex flex-col items-center justify-center py-1 rounded-lg hover:text-[#0B3B68] active:bg-slate-100"
      >
        <span>Hotel</span>
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.92 }}
        type="button"
        onClick={(e) => handleClick(e, 'hybrid-itinerary-section')}
        className="flex flex-col items-center justify-center py-1 rounded-lg hover:text-[#0B3B68] active:bg-slate-100"
      >
        <span>Biaya</span>
      </motion.button>

      {/* 4th Tab: If user has bookings, show "Pesanan". If not, show "Masuk / Akun" */}
      {isLoggedIn && hasBookings ? (
        <motion.button
          whileTap={{ scale: 0.92 }}
          type="button"
          onClick={(e) => handleClick(e, 'schedule-section')}
          className="flex flex-col items-center justify-center py-1 rounded-lg text-[#00897B] font-bold active:bg-slate-100"
        >
          <span>Pesanan</span>
        </motion.button>
      ) : (
        <motion.button
          whileTap={{ scale: 0.92 }}
          type="button"
          onClick={() => (isLoggedIn && onOpenProfile ? onOpenProfile() : onOpenAuth?.())}
          className="flex flex-col items-center justify-center py-1 rounded-lg hover:text-[#0B3B68] active:bg-slate-100"
        >
          <span>{isLoggedIn ? 'Akun' : 'Masuk'}</span>
        </motion.button>
      )}
    </nav>
  );
}
