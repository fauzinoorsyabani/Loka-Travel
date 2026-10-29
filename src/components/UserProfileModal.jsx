import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UserProfileModal({
  isOpen,
  onClose,
  activeUser,
  hasBookings = false,
  scheduleCount = 0,
  onLogout,
  onOpenDashboard,
  onScrollToSection,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.classList.add('overflow-hidden');
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen, onClose]);

  if (!isOpen || !activeUser) return null;

  const userType = activeUser.user_type || 'user';
  const isSuperAdmin = userType === 'super_admin';
  const isAdmin = userType === 'admin';
  const isAdminOrSuper = isSuperAdmin || isAdmin;

  const handleViewOrders = () => {
    onClose();
    if (onScrollToSection) {
      onScrollToSection('schedule-section');
    } else {
      const el = document.getElementById('schedule-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenDashboardFromProfile = () => {
    onClose();
    onOpenDashboard?.();
  };

  return (
    <AnimatePresence>
      <div
        id="user-profile-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-profile-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
            <h3 id="user-profile-title" className="font-extrabold text-base text-slate-900">
              Profil Pengguna
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition shrink-0"
              aria-label="Tutup Dialog Profil"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Identity Card */}
          <div className="p-6 overflow-y-auto space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="relative shrink-0">
                {activeUser.avatar_url ? (
                  <img
                    src={activeUser.avatar_url}
                    alt={activeUser.name}
                    className="w-12 h-12 rounded-full object-cover border border-[#0B3B68]"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#0B3B68] text-white text-base font-black flex items-center justify-center shadow-xs">
                    {activeUser.avatar || (activeUser.name ? activeUser.name[0].toUpperCase() : 'U')}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-base text-slate-900 truncate">
                    {activeUser.name}
                  </h4>
                </div>

                <div className="flex items-center gap-2">
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

                <p className="text-xs text-slate-500 truncate">
                  {activeUser.email || activeUser.role || 'Traveler Terdaftar'}
                </p>
              </div>
            </div>

            {/* Quick Account Highlights */}
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="p-3.5 rounded-lg bg-white border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Pesanan Aktif
                </span>
                <div className="text-lg font-black text-[#0B3B68]">
                  {scheduleCount} Paket
                </div>
                <p className="text-[11px] text-slate-500">
                  {hasBookings ? 'Terkonfirmasi' : 'Belum ada pesanan'}
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-white border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Tipe Akun
                </span>
                <div className="text-sm font-bold text-slate-800 truncate">
                  {isSuperAdmin ? 'Peneliti & Owner' : isAdmin ? 'Operasional' : 'Wisatawan'}
                </div>
                <p className="text-[11px] text-slate-500">Terverifikasi</p>
              </div>
            </div>

            {/* Actions for Authorized Roles (Admin / Super Admin) */}
            {isAdminOrSuper && (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-[#0B3B68] flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-[#0B3B68]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                    </svg>
                    <span>Hak Akses Manajemen</span>
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                    {userType.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Kelola katalog paket wisata, status pesanan, serta {isSuperAdmin ? 'hak akses pengguna dan algoritma riset.' : 'konfirmasi transaksi.'}
                </p>
                <button
                  type="button"
                  onClick={handleOpenDashboardFromProfile}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#0B3B68] hover:bg-[#082B4D] text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-2xs"
                >
                  <span>Buka Dashboard {isSuperAdmin ? 'Super Admin' : 'Admin'}</span>
                  <span>&rarr;</span>
                </button>
              </div>
            )}

            {/* Traveler Booking Shortcut */}
            {hasBookings && (
              <button
                type="button"
                onClick={handleViewOrders}
                className="w-full py-2.5 px-3 rounded-lg border border-slate-200 hover:border-[#0B3B68] hover:bg-slate-50 transition flex items-center justify-between text-xs font-semibold text-slate-700"
              >
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-[#00897B]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
                  </svg>
                  <span>Lihat Jadwal &amp; Pesanan Saya</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#00897B] text-white text-[10px] font-bold">
                  {scheduleCount}
                </span>
              </button>
            )}

            {/* Logout Button */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="w-full py-2 px-3 rounded-lg border border-slate-200 hover:border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                <span>Keluar dari Akun</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
