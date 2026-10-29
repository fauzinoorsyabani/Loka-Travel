import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar({
  activeUser,
  isLoggedIn = false,
  hasBookings = false,
  scheduleCount = 0,
  onOpenAuth,
  onOpenProfile,
  onOpenDashboard,
  onLogout,
  onScrollToSection,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
    setProfileDropdownOpen(false);
  };
  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setProfileDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileDropdownOpen]);

  const handleNavClick = (sectionId) => {
    closeMobileMenu();
    setProfileDropdownOpen(false);
    if (onScrollToSection) {
      onScrollToSection(sectionId);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const isSuperAdmin = activeUser?.user_type === 'super_admin';
  const isAdmin = activeUser?.user_type === 'admin';
  const isAdminOrSuper = isSuperAdmin || isAdmin;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="page-container h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo & Title */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            closeMobileMenu();
            setProfileDropdownOpen(false);
          }}
          className="flex items-center gap-2.5 sm:gap-3 group min-w-0 flex-1 lg:flex-initial"
        >
          <picture className="w-9 h-9 sm:w-11 sm:h-11 shrink-0">
            <source srcset="/static/images/logo.avif" type="image/avif" />
            <source srcset="/static/images/logo.webp" type="image/webp" />
            <img
              src="/static/images/logo.png"
              alt="Loka Travel Logo"
              width="44"
              height="44"
              className="w-9 h-9 sm:w-11 sm:h-11 object-contain transition-transform duration-200 group-hover:scale-105"
            />
          </picture>
          <div className="min-w-0">
            <span className="block font-extrabold text-base sm:text-xl tracking-tight text-[#0B3B68] leading-none whitespace-nowrap">
              Loka Travel
            </span>
            <span className="block text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate max-w-[145px] sm:max-w-[240px] lg:max-w-[190px] xl:max-w-none">
              Paket Wisata &amp; Hotel Rombongan
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-5 xl:gap-7 text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => handleNavClick('cf-workbench')}
            className="whitespace-nowrap hover:text-[#0B3B68] transition"
          >
            Paket Wisata
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('group-hotel-workbench')}
            className="whitespace-nowrap hover:text-[#0B3B68] transition"
          >
            Hotel Rombongan
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('hybrid-itinerary-section')}
            className="whitespace-nowrap hover:text-[#0B3B68] transition"
          >
            Rencana &amp; Biaya
          </button>
          {isLoggedIn && hasBookings && (
            <button
              type="button"
              onClick={() => handleNavClick('schedule-section')}
              className="whitespace-nowrap text-[#00897B] font-semibold hover:text-[#0B3B68] transition flex items-center gap-1.5"
            >
              <span>Pesanan Saya</span>
              {scheduleCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#00897B] text-white text-[10px] font-bold">
                  {scheduleCount}
                </span>
              )}
            </button>
          )}
        </nav>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Quick Button: Cari Hotel */}
          <button
            type="button"
            onClick={() => handleNavClick('group-hotel-workbench')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-[#0B3B68] hover:bg-[#082B4D] text-white text-xs font-semibold transition whitespace-nowrap shadow-2xs"
          >
            <span>Cari Hotel</span>
          </button>

          {/* Account Profile / Dropdown Button */}
          {isLoggedIn ? (
            <div className="relative" ref={dropdownRef}>
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                id="header-user-btn"
                className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 hover:border-[#0B3B68] bg-white transition shadow-2xs text-left"
                aria-expanded={profileDropdownOpen}
                aria-haspopup="true"
                title={`Profil: ${activeUser?.name || 'Traveler'}`}
              >
                <div className="w-8 h-8 rounded-full bg-[#0B3B68] text-white text-xs font-black flex items-center justify-center shrink-0">
                  {activeUser?.avatar || (activeUser?.name ? activeUser.name[0].toUpperCase() : 'U')}
                </div>
                <div className="hidden md:block min-w-0 pr-1">
                  <span className="block font-bold text-xs text-slate-800 leading-tight truncate max-w-[120px]">
                    {activeUser?.name || 'Traveler'}
                  </span>
                  <span className="block text-[10px] text-slate-500 font-medium capitalize">
                    {activeUser?.user_type === 'super_admin' ? 'Super Admin' : activeUser?.user_type === 'admin' ? 'Admin' : 'Traveler'}
                  </span>
                </div>
                <svg className="w-3.5 h-3.5 text-slate-500 shrink-0 hidden sm:block" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </motion.button>

              {/* Profile Dropdown Popover Menu */}
              <AnimatePresence>
                {profileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.16 }}
                    className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 overflow-hidden text-xs"
                  >
                    {/* User Identity Header */}
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 bg-slate-50/70">
                      <div className="w-10 h-10 rounded-full bg-[#0B3B68] text-white text-sm font-black flex items-center justify-center shrink-0">
                        {activeUser?.avatar || (activeUser?.name ? activeUser.name[0].toUpperCase() : 'U')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-sm text-slate-900 truncate">
                            {activeUser?.name || 'Traveler'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          {activeUser?.email || activeUser?.role || 'Traveler Terdaftar'}
                        </p>
                        <div className="mt-1">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-block ${
                              isSuperAdmin
                                ? 'bg-slate-100 text-[#0B3B68] border border-slate-300'
                                : isAdmin
                                ? 'bg-teal-50 text-[#00897B] border border-teal-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : 'Traveler'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Section Choices */}
                    <div className="py-1">
                      {/* Dashboard Option for Admin / Super Admin */}
                      {isAdminOrSuper && (
                        <button
                          type="button"
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            onOpenDashboard();
                          }}
                          className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-3 transition group text-[#0B3B68] font-bold"
                        >
                          <svg className="w-4 h-4 text-[#0B3B68] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                          </svg>
                          <div className="min-w-0">
                            <span className="block text-slate-900 group-hover:text-[#0B3B68]">
                              Dashboard Manajemen
                            </span>
                            <span className="block text-[10px] text-slate-500 font-normal">
                              Kelola pengguna, paket wisata &amp; pesanan
                            </span>
                          </div>
                        </button>
                      )}

                      {/* Pesanan Saya */}
                      <button
                        type="button"
                        onClick={() => handleNavClick('schedule-section')}
                        className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center justify-between transition group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <svg className="w-4 h-4 text-slate-600 group-hover:text-[#0B3B68] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
                          </svg>
                          <div>
                            <span className="block font-semibold text-slate-800 group-hover:text-[#0B3B68]">
                              Pesanan Saya
                            </span>
                            <span className="block text-[10px] text-slate-500 font-normal">
                              Riwayat booking &amp; status paket
                            </span>
                          </div>
                        </div>
                        {scheduleCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-[#00897B] text-white text-[10px] font-bold">
                            {scheduleCount}
                          </span>
                        )}
                      </button>

                      {/* Rencana & Biaya */}
                      <button
                        type="button"
                        onClick={() => handleNavClick('hybrid-itinerary-section')}
                        className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-3 transition group"
                      >
                        <svg className="w-4 h-4 text-slate-600 group-hover:text-[#0B3B68] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <span className="block font-semibold text-slate-800 group-hover:text-[#0B3B68]">
                            Rencana &amp; Estimasi Biaya
                          </span>
                          <span className="block text-[10px] text-slate-500 font-normal">
                            Alokasi kamar &amp; pembagian biaya
                          </span>
                        </div>
                      </button>

                      {/* Hotel Rombongan */}
                      <button
                        type="button"
                        onClick={() => handleNavClick('group-hotel-workbench')}
                        className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-3 transition group"
                      >
                        <svg className="w-4 h-4 text-slate-600 group-hover:text-[#0B3B68] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.75a1.5 1.5 0 011.5-1.5h1.5a1.5 1.5 0 011.5 1.5V21" />
                        </svg>
                        <div>
                          <span className="block font-semibold text-slate-800 group-hover:text-[#0B3B68]">
                            Hotel Rombongan
                          </span>
                          <span className="block text-[10px] text-slate-500 font-normal">
                            Pencarian hotel &amp; kamar keluarga
                          </span>
                        </div>
                      </button>

                      {/* Detail Profil Akun */}
                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onOpenProfile();
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-3 transition group"
                      >
                        <svg className="w-4 h-4 text-slate-600 group-hover:text-[#0B3B68] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                        <div>
                          <span className="block font-semibold text-slate-800 group-hover:text-[#0B3B68]">
                            Detail Profil Akun
                          </span>
                          <span className="block text-[10px] text-slate-500 font-normal">
                            Informasi identitas traveler
                          </span>
                        </div>
                      </button>
                    </div>

                    {/* Divider & Logout */}
                    <div className="border-t border-slate-100 pt-1 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onLogout?.();
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-rose-50 text-rose-600 font-semibold flex items-center gap-3 transition"
                      >
                        <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                        </svg>
                        <span>Keluar dari Akun</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            /* Not logged in: Clean "Masuk" button */
            <motion.button
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={onOpenAuth}
              id="header-login-btn"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition"
              aria-label="Masuk dengan Akun Google"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Masuk</span>
            </motion.button>
          )}

          {/* Hamburger Menu Toggle (Mobile Only - hidden on lg/desktop) */}
          <button
            type="button"
            id="mobile-menu-btn"
            onClick={toggleMobileMenu}
            aria-label="Buka Menu Navigasi"
            aria-expanded={mobileMenuOpen}
            className="lg:hidden inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg border border-slate-300 text-slate-700 hover:border-[#0B3B68] hover:text-[#0B3B68] transition shrink-0"
          >
            {mobileMenuOpen ? (
              <svg id="mobile-menu-icon-close" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg id="mobile-menu-icon-open" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Hamburger Navigation Pop-up (Compact, right-aligned, gradient border) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop for closing when tapping outside */}
            <div
              className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-xs lg:hidden"
              onClick={closeMobileMenu}
              aria-hidden="true"
            />
            <motion.div
              id="mobile-nav-drawer"
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.15 }}
              className="lg:hidden absolute right-3 sm:right-6 top-16 sm:top-20 w-64 sm:w-72 p-[1.5px] rounded-xl bg-gradient-to-br from-[#0B3B68] via-slate-200 to-[#00897B] shadow-2xl z-50 overflow-hidden"
            >
              <div className="bg-white rounded-[10px] p-2.5 flex flex-col gap-1 text-xs font-medium text-slate-700">
                {isLoggedIn ? (
                  /* Authenticated User Banner in Drawer */
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-[#0B3B68] text-white text-xs font-semibold flex items-center justify-center shrink-0">
                        {activeUser?.avatar || (activeUser?.name ? activeUser.name[0].toUpperCase() : 'U')}
                      </div>
                      <div className="min-w-0">
                        <span className="block font-semibold text-slate-900 text-xs truncate">
                          {activeUser?.name || 'Traveler'}
                        </span>
                        <span className="block text-[10px] text-slate-500 font-normal">
                          {isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : 'Traveler'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        closeMobileMenu();
                        onOpenProfile();
                      }}
                      className="text-xs text-[#0B3B68] font-medium hover:underline shrink-0"
                    >
                      Profil
                    </button>
                  </div>
                ) : (
                  /* Guest Sign-In in Drawer */
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      onOpenAuth();
                    }}
                    className="px-3 py-2 rounded-lg text-left bg-slate-50 hover:bg-slate-100 text-[#0B3B68] transition flex items-center justify-between font-medium mb-1 border border-slate-200"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      <span>Masuk</span>
                    </span>
                    <span className="text-xs">&rarr;</span>
                  </button>
                )}

                {/* Dashboard Shortcut in Drawer (Admin / Super Admin only) */}
                {isLoggedIn && isAdminOrSuper && (
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      onOpenDashboard();
                    }}
                    className="px-3 py-2 rounded-lg text-left bg-slate-50 hover:bg-slate-100 text-[#0B3B68] border border-slate-200 transition flex items-center justify-between font-medium mb-1"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#0B3B68]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                      </svg>
                      <span>Dashboard ({isSuperAdmin ? 'Super Admin' : 'Admin'})</span>
                    </span>
                    <span className="text-xs">&rarr;</span>
                  </button>
                )}

                {/* Navigation Section Links */}
                <button
                  type="button"
                  onClick={() => handleNavClick('cf-workbench')}
                  className="px-3 py-2 rounded-lg text-left hover:bg-slate-50 transition"
                >
                  Paket Wisata
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('group-hotel-workbench')}
                  className="px-3 py-2 rounded-lg text-left hover:bg-slate-50 transition"
                >
                  Hotel Rombongan
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('hybrid-itinerary-section')}
                  className="px-3 py-2 rounded-lg text-left hover:bg-slate-50 transition"
                >
                  Rencana &amp; Biaya
                </button>

                {isLoggedIn && hasBookings && (
                  <button
                    type="button"
                    onClick={() => handleNavClick('schedule-section')}
                    className="px-3 py-2 rounded-lg text-left hover:bg-slate-50 text-[#00897B] font-medium transition flex items-center justify-between"
                  >
                    <span>Pesanan Saya</span>
                    {scheduleCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-[#00897B] text-white text-[10px] font-bold">
                        {scheduleCount}
                      </span>
                    )}
                  </button>
                )}

                {isLoggedIn && (
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      onLogout?.();
                    }}
                    className="px-3 py-2 rounded-lg text-left hover:bg-rose-50 text-rose-600 font-medium transition mt-1 border-t border-slate-100"
                  >
                    Keluar dari Akun
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
