import React from 'react';

export default function Footer({ onScrollToSection }) {
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
    <footer className="bg-white border-t border-slate-200 mt-14 sm:mt-20 py-10 sm:py-12">
      <div className="page-container flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <picture className="w-8 h-8 shrink-0">
            <source srcset="/static/images/logo.avif" type="image/avif" />
            <source srcset="/static/images/logo.webp" type="image/webp" />
            <img
              src="/static/images/logo.png"
              alt="Loka Travel"
              width="32"
              height="32"
              className="w-8 h-8 object-contain"
            />
          </picture>
          <span>
            <strong className="text-slate-800">Loka Travel Indonesia</strong> &middot; Rekomendasi Paket Wisata &amp; Hotel Rombongan
          </span>
        </div>
        <div className="flex flex-wrap justify-center gap-5 sm:gap-6 font-medium text-slate-600">
          <a
            href="#cf-workbench"
            onClick={(e) => handleClick(e, 'cf-workbench')}
            className="hover:text-[#0B3B68] transition"
          >
            Paket Wisata
          </a>
          <a
            href="#group-hotel-workbench"
            onClick={(e) => handleClick(e, 'group-hotel-workbench')}
            className="hover:text-[#0B3B68] transition"
          >
            Hotel Rombongan
          </a>
          <a
            href="#hybrid-itinerary-section"
            onClick={(e) => handleClick(e, 'hybrid-itinerary-section')}
            className="hover:text-[#0B3B68] transition"
          >
            Rencana &amp; Biaya
          </a>
          <a
            href="#schedule-section"
            onClick={(e) => handleClick(e, 'schedule-section')}
            className="hover:text-[#0B3B68] transition"
          >
            Pesanan Saya
          </a>
        </div>
      </div>
    </footer>
  );
}
