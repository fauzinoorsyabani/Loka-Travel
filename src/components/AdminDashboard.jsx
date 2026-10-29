import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { lokaApi } from '../api/client';

export default function AdminDashboard({
  onBackToTravel,
  activeUser,
  onNotify,
  onRefreshData,
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [packages, setPackages] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [matrixData, setMatrixData] = useState(null);
  const [loading, setLoading] = useState(false);

  // New package form state
  const [showAddPackageModal, setShowAddPackageModal] = useState(false);
  const [newPkg, setNewPkg] = useState({
    name: '',
    city: 'Bandung',
    location: 'Bandung, Jawa Barat',
    category: 'Camp',
    price: 1500000,
    duration_days: 3,
    rating: 4.8,
    highlights: '',
    image: '/static/images/tours/pkg_bukit_jamur.webp',
  });

  const isSuperAdmin = activeUser?.user_type === 'super_admin';
  const isAdminOrSuper = activeUser?.user_type === 'admin' || isSuperAdmin;

  // Load dashboard data based on active tab
  const loadTabContent = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const res = await lokaApi.getAdminOverview();
        if (res.status === 'ok') setOverview(res.overview);
      } else if (activeTab === 'users') {
        const res = await lokaApi.getAdminUsers();
        if (res.status === 'ok') setUsersList(res.users);
      } else if (activeTab === 'packages') {
        const res = await lokaApi.getAdminPackages();
        if (res.status === 'ok') setPackages(res.packages);
      } else if (activeTab === 'bookings') {
        const res = await lokaApi.getAdminBookings();
        if (res.status === 'ok') setBookings(res.bookings);
      } else if (activeTab === 'research') {
        const res = await lokaApi.getAdminMatrix();
        if (res.status === 'ok') setMatrixData(res.matrix);
      }
    } catch (err) {
      onNotify?.('Gagal memuat data dashboard: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab, onNotify]);

  useEffect(() => {
    loadTabContent();
  }, [loadTabContent]);

  // Handle Role Change
  const handleChangeRole = async (userId, newType) => {
    if (!isSuperAdmin) {
      onNotify?.('Hanya Super Admin yang berwenang mengubah hak akses pengguna.');
      return;
    }
    try {
      const res = await lokaApi.updateUserRole({ user_id: userId, user_type: newType });
      if (res.status === 'ok') {
        onNotify?.(`Hak akses ${res.user.name} berhasil diubah ke ${newType.toUpperCase()}`);
        loadTabContent();
        onRefreshData?.();
      }
    } catch (err) {
      onNotify?.('Gagal mengubah hak akses pengguna.');
    }
  };

  // Handle Add Package
  const handleCreatePackage = async (e) => {
    e.preventDefault();
    if (!newPkg.name.trim()) return;
    try {
      const res = await lokaApi.addAdminPackage(newPkg);
      if (res.status === 'ok') {
        onNotify?.(`Paket wisata "${res.package.name}" berhasil ditambahkan ke katalog.`);
        setShowAddPackageModal(false);
        setNewPkg({
          name: '',
          city: 'Bandung',
          location: 'Bandung, Jawa Barat',
          category: 'Camp',
          price: 1500000,
          duration_days: 3,
          rating: 4.8,
          highlights: '',
          image: '/static/images/tours/pkg_bukit_jamur.webp',
        });
        loadTabContent();
        onRefreshData?.();
      }
    } catch (err) {
      onNotify?.('Gagal menambahkan paket wisata baru.');
    }
  };

  // Handle Delete Package
  const handleDeletePackage = async (packageId, packageName) => {
    if (!window.confirm(`Hapus paket wisata "${packageName}" dari katalog?`)) return;
    try {
      const res = await lokaApi.deleteAdminPackage(packageId);
      if (res.status === 'ok') {
        onNotify?.(`Paket wisata "${packageName}" berhasil dihapus.`);
        loadTabContent();
        onRefreshData?.();
      }
    } catch (err) {
      onNotify?.('Gagal menghapus paket wisata.');
    }
  };

  const [userSearch, setUserSearch] = useState('');
  const [packageSearch, setPackageSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('All');
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Recalculate Matrix & Update Cache
  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      const res = await lokaApi.recalculateAdminMatrix();
      if (res.status === 'ok') {
        onNotify?.('Matriks Collaborative Filtering & kemiripan pengguna berhasil disinkronkan ulang!');
        setMatrixData(res.matrix);
        onRefreshData?.();
      }
    } catch (err) {
      onNotify?.('Gagal menghitung ulang matrix: ' + err.message);
    } finally {
      setIsRecalculating(false);
    }
  };

  // Handle Update Booking Status
  const handleUpdateStatus = async (bookingId, userId, newStatus) => {
    try {
      const res = await lokaApi.updateBookingStatus({
        booking_id: bookingId,
        user_id: userId,
        status: newStatus,
      });
      if (res.status === 'ok') {
        onNotify?.(`Status pesanan diperbarui menjadi: ${newStatus}`);
        loadTabContent();
        onRefreshData?.();
      }
    } catch (err) {
      onNotify?.('Gagal memperbarui status pesanan.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            {/* Back to Travel Website Button */}
            <button
              type="button"
              onClick={onBackToTravel}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition shrink-0"
              title="Kembali ke Halaman Utama Loka Travel"
            >
              <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              <span className="hidden sm:inline">Kembali ke Website</span>
              <span className="sm:hidden">Kembali</span>
            </button>

            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            {/* Dashboard Title & Active Role */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-sm sm:text-base lg:text-lg text-slate-900 tracking-tight truncate">
                  Dashboard Manajemen Operasional
                </h1>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                    isSuperAdmin
                      ? 'bg-slate-100 text-[#0B3B68] border border-slate-300'
                      : 'bg-teal-50 text-[#00897B] border border-teal-200'
                  }`}
                >
                  {isSuperAdmin ? 'Super Admin' : 'Admin'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate mt-0.5">
                Loka Travel &middot; Pengguna: <strong className="text-slate-800">{activeUser?.name || 'Administrator'}</strong>
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                loadTabContent();
                onRefreshData?.();
                onNotify?.('Data dashboard berhasil disegarkan');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition"
              title="Perbarui Data"
            >
              <svg className={`w-3.5 h-3.5 text-slate-600 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              <span className="hidden sm:inline">Segarkan Data</span>
            </button>

            {/* Profile Avatar Badge */}
            <div className="w-8 h-8 rounded-full bg-[#0B3B68] text-white font-bold flex items-center justify-center text-xs shrink-0">
              {activeUser?.avatar || (activeUser?.name ? activeUser.name[0].toUpperCase() : 'A')}
            </div>
          </div>
        </div>

        {/* Tab Navigation Bar (No emojis, clean vector SVGs & text) */}
        <div className="border-t border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar text-xs font-semibold">
            {/* Tab 1: Ringkasan Sistem */}
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-3 sm:px-4 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-[#0B3B68] text-[#0B3B68]'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
              </svg>
              <span>Ringkasan Sistem</span>
            </button>

            {/* Tab 2: Manajemen Akun & Role */}
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`py-3 px-3 sm:px-4 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'users'
                  ? 'border-[#0B3B68] text-[#0B3B68]'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              <span>Manajemen Akun &amp; Role (RBAC)</span>
            </button>

            {/* Tab 3: Katalog Paket Wisata */}
            <button
              type="button"
              onClick={() => setActiveTab('packages')}
              className={`py-3 px-3 sm:px-4 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'packages'
                  ? 'border-[#0B3B68] text-[#0B3B68]'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              <span>Katalog Paket Wisata</span>
            </button>

            {/* Tab 4: Pesanan Traveler */}
            <button
              type="button"
              onClick={() => setActiveTab('bookings')}
              className={`py-3 px-3 sm:px-4 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'bookings'
                  ? 'border-[#0B3B68] text-[#0B3B68]'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
              <span>Pesanan Traveler</span>
            </button>

            {/* Tab 5: Riset & Algoritma CF (Super Admin Only) */}
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab('research')}
                className={`py-3 px-3 sm:px-4 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'research'
                    ? 'border-[#0B3B68] text-[#0B3B68]'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.942a3.75 3.75 0 01-3.86 0L12 15l-2.37 1.242a3.75 3.75 0 01-3.86 0L4.2 15.3m15.6 0A3.75 3.75 0 0121 18.375V19.5a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 19.5v-1.125c0-1.156.526-2.235 1.43-2.925" />
                </svg>
                <span>Riset &amp; Algoritma CF</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Full-Page Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {loading && (
          <div className="flex items-center justify-center py-16 text-sm text-slate-500 gap-2">
            <span className="w-4 h-4 border-2 border-[#0B3B68] border-t-transparent rounded-full animate-spin" />
            <span>Memuat data operasional...</span>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {!loading && activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Statistics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hotel Terkurasi</span>
                <div className="text-2xl sm:text-3xl font-black text-[#0B3B68]">{overview?.total_hotels || 797}</div>
                <p className="text-[11px] text-slate-500">11 Kota Utama Indonesia</p>
              </div>

              <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Paket Wisata Aktif</span>
                <div className="text-2xl sm:text-3xl font-black text-[#00897B]">{overview?.total_packages || 10}</div>
                <p className="text-[11px] text-slate-500">Pantai, Gunung, Camp, Hiburan</p>
              </div>

              <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Traveler Terdaftar</span>
                <div className="text-2xl sm:text-3xl font-black text-slate-900">{overview?.total_users || 7}</div>
                <p className="text-[11px] text-slate-500">User, Admin &amp; Super Admin</p>
              </div>

              <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Pesanan</span>
                <div className="text-2xl sm:text-3xl font-black text-[#0B3B68]">{overview?.total_bookings || 1}</div>
                <p className="text-[11px] text-slate-500">Pesanan terkonfirmasi &amp; proses</p>
              </div>
            </div>

            {/* Research Benchmarks Card */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#00897B] font-bold">
                    Dipublikasikan di International Journal (Nov 2025)
                  </span>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Performa Model Collaborative Filtering Loka Travel
                  </h3>
                  <p className="text-xs text-slate-500">
                    Muhammad Edi Iswanto, Andi Nur Rachman, Fauzi Noorsyabani (Corresponding Author)
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold text-[#0B3B68] bg-white border border-slate-200 shrink-0 self-start sm:self-auto">
                  5-Fold Cross Validation
                </span>
              </div>

              <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="text-xs text-slate-500 font-medium">Rata-rata Akurasi Sistem</div>
                  <div className="text-2xl font-black text-[#0B3B68] mt-1">80.63%</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Tingkat presisi rekomendasi paket</div>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="text-xs text-slate-500 font-medium">Mean Absolute Error (MAE)</div>
                  <div className="text-2xl font-black text-[#00897B] mt-1">0.9689</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Deviasi rating skala 1.0 - 5.0</div>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="text-xs text-slate-500 font-medium">Engine AI Asisten</div>
                  <div className="text-lg font-black text-slate-800 mt-1">Gemini 3.5 Flash Lite</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Response streaming &amp; natural dialog</div>
                </div>
              </div>
            </div>

            {/* Role Allocation Status */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <h4 className="font-bold text-sm text-slate-900">Distribusi Akun &amp; Hak Akses (RBAC)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Super Admin</div>
                    <div className="text-[11px] text-slate-500">Akses penuh sistem, riset &amp; RBAC</div>
                  </div>
                  <span className="text-lg font-black text-[#0B3B68]">
                    {overview?.active_roles?.super_admin || 1}
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Admin</div>
                    <div className="text-[11px] text-slate-500">Kelola paket wisata &amp; pesanan</div>
                  </div>
                  <span className="text-lg font-black text-[#00897B]">
                    {overview?.active_roles?.admin || 1}
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">User / Traveler</div>
                    <div className="text-[11px] text-slate-500">Pencarian, alokasi &amp; pesanan pribadi</div>
                  </div>
                  <span className="text-lg font-black text-slate-700">
                    {overview?.active_roles?.user || 5}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RBAC USER MANAGEMENT */}
        {!loading && activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Manajemen Akun Traveler &amp; Hak Akses (RBAC)
                </h3>
                <p className="text-xs text-slate-500">
                  Tentukan tingkatan wewenang pengguna platform: Traveler (User), Admin Operasional, atau Super Admin.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="search"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Cari nama atau email..."
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs w-48 focus:outline-none focus:border-[#0B3B68]"
                />
                {!isSuperAdmin && (
                  <span className="text-[10px] text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded whitespace-nowrap">
                    Hanya Super Admin
                  </span>
                )}
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-900 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Pengguna</th>
                    <th className="p-3.5">Email / ID</th>
                    <th className="p-3.5">Deskripsi Peran</th>
                    <th className="p-3.5">Aktivitas</th>
                    <th className="p-3.5">Tingkat Hak Akses</th>
                    <th className="p-3.5 text-right">Ubah Hak Akses</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {usersList
                    .filter(
                      (u) =>
                        !userSearch ||
                        u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                        u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
                        u.role?.toLowerCase().includes(userSearch.toLowerCase())
                    )
                    .map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-full bg-[#0B3B68] text-white font-bold flex items-center justify-center text-xs shrink-0">
                          {u.avatar || u.name[0]}
                        </span>
                        <span className="font-bold text-slate-900">{u.name}</span>
                      </td>
                      <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                        {u.email || u.id}
                      </td>
                      <td className="p-3.5 text-slate-600">{u.role}</td>
                      <td className="p-3.5 text-slate-500">
                        {u.bookings_count} Pesanan &middot; {u.ratings_count} Rating
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-block ${
                            u.user_type === 'super_admin'
                              ? 'bg-slate-100 text-[#0B3B68] border border-slate-300'
                              : u.user_type === 'admin'
                              ? 'bg-teal-50 text-[#00897B] border border-teal-200'
                              : 'bg-slate-50 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {u.user_type === 'super_admin' ? 'Super Admin' : u.user_type === 'admin' ? 'Admin' : 'Traveler'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {isSuperAdmin ? (
                          <select
                            value={u.user_type || 'user'}
                            onChange={(e) => handleChangeRole(u.id, e.target.value)}
                            className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:border-[#0B3B68]"
                          >
                            <option value="user">User (Traveler)</option>
                            <option value="admin">Admin</option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Terkunci</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PACKAGES MANAGEMENT */}
        {!loading && activeTab === 'packages' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Katalog Paket Wisata ({packages.length} Paket)
                </h3>
                <p className="text-xs text-slate-500">
                  Kelola paket wisata aktif yang direkomendasikan melalui User-Based Collaborative Filtering.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="search"
                  value={packageSearch}
                  onChange={(e) => setPackageSearch(e.target.value)}
                  placeholder="Cari paket atau kota..."
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs w-44 focus:outline-none focus:border-[#0B3B68]"
                />
                <button
                  type="button"
                  onClick={() => setShowAddPackageModal(true)}
                  className="px-3.5 py-2 rounded-lg bg-[#00897B] hover:bg-[#00796B] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span>Tambah Paket Baru</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {packages
                .filter(
                  (pkg) =>
                    !packageSearch ||
                    pkg.name?.toLowerCase().includes(packageSearch.toLowerCase()) ||
                    pkg.city?.toLowerCase().includes(packageSearch.toLowerCase()) ||
                    pkg.category?.toLowerCase().includes(packageSearch.toLowerCase())
                )
                .map((pkg) => (
                <div
                  key={pkg.id}
                  className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col justify-between shadow-2xs"
                >
                  <div>
                    <div className="relative h-36 bg-slate-100">
                      <img
                        src={pkg.image}
                        alt={pkg.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 text-white text-[10px] font-bold">
                        {pkg.category}
                      </span>
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-sm text-slate-900 leading-snug">{pkg.name}</h4>
                        <span className="text-xs font-black text-[#0B3B68] whitespace-nowrap">
                          Rp {Number(pkg.price).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{pkg.highlights}</p>
                      <div className="text-[11px] text-slate-600 flex items-center justify-between pt-2 border-t border-slate-100 font-medium">
                        <span>{pkg.city}</span>
                        <span>{pkg.duration_days} hari</span>
                        <span>Rating {pkg.rating}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleDeletePackage(pkg.id, pkg.name)}
                      className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 rounded hover:bg-rose-50 transition"
                    >
                      Hapus Paket
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: BOOKINGS / ORDERS */}
        {!loading && activeTab === 'bookings' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Semua Pesanan Paket Wisata Traveler
                </h3>
                <p className="text-xs text-slate-500">
                  Daftar seluruh transaksi yang dilakukan oleh pengguna terdaftar dengan status real-time.
                </p>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {['All', 'Terkonfirmasi', 'Menunggu', 'Dibatalkan', 'Selesai'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setBookingStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                      bookingStatusFilter === st
                        ? 'bg-[#0B3B68] text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {st === 'All' ? 'Semua Status' : st}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-900 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">ID / Tanggal</th>
                    <th className="p-3.5">Paket Wisata</th>
                    <th className="p-3.5">Traveler</th>
                    <th className="p-3.5">Jumlah &amp; Durasi</th>
                    <th className="p-3.5">Total Biaya</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Ubah Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {bookings.filter(
                    (b) =>
                      bookingStatusFilter === 'All' ||
                      b.status?.toLowerCase().includes(bookingStatusFilter.toLowerCase())
                  ).length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-400">
                        Tidak ada pesanan dengan kriteria filter yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    bookings
                      .filter(
                        (b) =>
                          bookingStatusFilter === 'All' ||
                          b.status?.toLowerCase().includes(bookingStatusFilter.toLowerCase())
                      )
                      .map((b, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition">
                          <td className="p-3.5 font-mono text-[11px]">
                            <div className="font-bold text-slate-900">{b.booking_id}</div>
                            <div className="text-slate-400">{b.date}</div>
                          </td>
                          <td className="p-3.5 font-bold text-slate-900">{b.name}</td>
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900">{b.user_name}</div>
                            <div className="text-slate-400 text-[11px]">{b.user_role}</div>
                          </td>
                          <td className="p-3.5 text-slate-600">
                            {b.packs} paket &middot; {b.duration}
                          </td>
                          <td className="p-3.5 font-bold text-[#0B3B68]">
                            Rp {Number(b.price_total || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                b.status?.toLowerCase().includes('terkonfirmasi') ||
                                b.status?.toLowerCase().includes('confirmed')
                                  ? 'bg-teal-50 text-teal-800 border border-teal-200'
                                  : b.status?.toLowerCase().includes('selesai')
                                  ? 'bg-slate-100 text-slate-800 border border-slate-300'
                                  : b.status?.toLowerCase().includes('dibatalkan')
                                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateStatus(b.booking_id || b.name, b.user_id, 'Terkonfirmasi')
                                }
                                className="px-2 py-1 rounded bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-[11px] border border-teal-200 transition"
                              >
                                Konfirmasi
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateStatus(b.booking_id || b.name, b.user_id, 'Selesai')
                                }
                                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] border border-slate-300 transition"
                              >
                                Selesai
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateStatus(b.booking_id || b.name, b.user_id, 'Dibatalkan')
                                }
                                className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-[11px] border border-rose-200 transition"
                              >
                                Batal
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: CF ALGORITHM & RESEARCH (SUPER ADMIN ONLY) */}
        {!loading && activeTab === 'research' && isSuperAdmin && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Inspeksi Algoritma Collaborative Filtering &amp; Metrik Riset
                </h3>
                <p className="text-xs text-slate-500">
                  Memverifikasi User-Based Collaborative Filtering (UBCF) Cosine Similarity dan metrik 5-Fold Cross Validation (Iswanto et al., 2025).
                </p>
              </div>
              <button
                type="button"
                disabled={isRecalculating}
                onClick={handleRecalculate}
                className="px-3.5 py-2 rounded-lg bg-[#0B3B68] hover:bg-[#082B4D] text-white font-bold text-xs flex items-center gap-2 shadow-2xs transition disabled:opacity-50 shrink-0 self-start sm:self-auto"
              >
                <svg className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                <span>{isRecalculating ? 'Menghitung Ulang...' : 'Sinkronkan & Hitung Ulang Matrix CF'}</span>
              </button>
            </div>

            {/* 5-Fold CV Paper Table (Clean Slate/White Design without circular rounded bubble backgrounds) */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Tabel Eksperimen 5-Fold Cross Validation (Paper Publikasi)
                  </h4>
                  <p className="text-xs text-slate-500">Iswanto, Rachman, &amp; Noorsyabani (2025)</p>
                </div>
                <span className="text-xs font-mono font-semibold text-[#0B3B68] bg-white px-2.5 py-1 rounded border border-slate-200">
                  Rata-rata Akurasi: 80.63% | MAE: 0.9689
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 p-2 text-center text-xs">
                <div className="p-3">
                  <div className="text-slate-400 text-[11px] font-medium">Fold 1</div>
                  <div className="font-bold text-[#0B3B68] text-base mt-1">80.67%</div>
                  <div className="text-[10px] text-slate-500">MAE 0.9664</div>
                </div>
                <div className="p-3">
                  <div className="text-slate-400 text-[11px] font-medium">Fold 2</div>
                  <div className="font-bold text-[#0B3B68] text-base mt-1">80.63%</div>
                  <div className="text-[10px] text-slate-500">MAE 0.9682</div>
                </div>
                <div className="p-3">
                  <div className="text-slate-400 text-[11px] font-medium">Fold 3</div>
                  <div className="font-bold text-[#0B3B68] text-base mt-1">80.65%</div>
                  <div className="text-[10px] text-slate-500">MAE 0.9673</div>
                </div>
                <div className="p-3">
                  <div className="text-slate-400 text-[11px] font-medium">Fold 4</div>
                  <div className="font-bold text-[#0B3B68] text-base mt-1">80.63%</div>
                  <div className="text-[10px] text-slate-500">MAE 0.9685</div>
                </div>
                <div className="p-3">
                  <div className="text-slate-400 text-[11px] font-medium">Fold 5</div>
                  <div className="font-bold text-[#0B3B68] text-base mt-1">80.57%</div>
                  <div className="text-[10px] text-slate-500">MAE 0.9711</div>
                </div>
              </div>
            </div>

            {/* Pairwise Similarities */}
            {matrixData && (
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-slate-900">
                  Peringkat Kemiripan Pengguna (Cosine Similarity Matrix)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {matrixData.pairwise_similarities?.slice(0, 9).map((pair, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-2xs"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 truncate">
                          {pair.user_a} &amp; {pair.user_b}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Cosine Sim: {pair.similarity}
                        </div>
                      </div>
                      <span className="font-bold text-xs text-[#00897B] bg-teal-50 px-2 py-1 rounded border border-teal-200">
                        {pair.match_percent}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal Tambah Paket Baru (Clean Simple Form) */}
      {showAddPackageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          onClick={() => setShowAddPackageModal(false)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900">Tambah Paket Wisata Baru</h3>
              <button
                type="button"
                onClick={() => setShowAddPackageModal(false)}
                className="w-7 h-7 rounded text-slate-400 hover:text-slate-700 flex items-center justify-center font-bold"
                aria-label="Tutup Dialog"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreatePackage} className="space-y-3.5 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1">Nama Paket Wisata</label>
                <input
                  type="text"
                  required
                  value={newPkg.name}
                  onChange={(e) => setNewPkg({ ...newPkg, name: e.target.value })}
                  placeholder="Contoh: Glamping Pinus Rancabali"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 font-normal focus:outline-none focus:border-[#0B3B68]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Kota Destinasi</label>
                  <select
                    value={newPkg.city}
                    onChange={(e) =>
                      setNewPkg({ ...newPkg, city: e.target.value, location: `${e.target.value}, Indonesia` })
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#0B3B68]"
                  >
                    <option value="Bandung">Bandung</option>
                    <option value="Jakarta">Jakarta</option>
                    <option value="Yogyakarta">Yogyakarta</option>
                    <option value="Bali">Bali</option>
                    <option value="Surabaya">Surabaya</option>
                    <option value="Bogor">Bogor</option>
                    <option value="Medan">Medan</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Kategori</label>
                  <select
                    value={newPkg.category}
                    onChange={(e) => setNewPkg({ ...newPkg, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#0B3B68]"
                  >
                    <option value="Camp">Camp &amp; Alam</option>
                    <option value="Beach">Pantai &amp; Laut</option>
                    <option value="Mountain">Pegunungan</option>
                    <option value="Taman Hiburan">Taman Hiburan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Harga per Paket (Rp)</label>
                  <input
                    type="number"
                    min="100000"
                    step="50000"
                    value={newPkg.price}
                    onChange={(e) => setNewPkg({ ...newPkg, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 font-normal focus:outline-none focus:border-[#0B3B68]"
                  />
                </div>

                <div>
                  <label className="block mb-1">Durasi (Hari)</label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={newPkg.duration_days}
                    onChange={(e) => setNewPkg({ ...newPkg, duration_days: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 font-normal focus:outline-none focus:border-[#0B3B68]"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">Pilih Gambar Sampul Paket</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Camp Pinus', url: '/static/images/tours/pkg_bukit_jamur.webp' },
                    { label: 'Pantai Bali', url: '/static/images/tours/pkg_nusa_penida.webp' },
                    { label: 'Danau Toba', url: '/static/images/tours/pkg_danau_toba.webp' },
                    { label: 'Pegunungan', url: '/static/images/tours/pkg_gunung_anyar.webp' },
                    { label: 'Taman Hiburan', url: '/static/images/tours/pkg_ancol_dufan.webp' },
                    { label: 'Wisata Budaya', url: '/static/images/tours/pkg_parangtritis.webp' },
                  ].map((img) => (
                    <button
                      key={img.url}
                      type="button"
                      onClick={() => setNewPkg({ ...newPkg, image: img.url })}
                      className={`p-1 rounded-lg border text-left transition flex items-center gap-1.5 ${
                        newPkg.image === img.url
                          ? 'border-[#0B3B68] bg-slate-50 ring-1 ring-[#0B3B68]'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img src={img.url} alt={img.label} className="w-8 h-8 rounded object-cover" />
                      <span className="text-[10px] font-semibold text-slate-800 truncate">{img.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-1">Ringkasan &amp; Daya Tarik</label>
                <textarea
                  rows="3"
                  value={newPkg.highlights}
                  onChange={(e) => setNewPkg({ ...newPkg, highlights: e.target.value })}
                  placeholder="Jelaskan fasilitas, keindahan destinasi, dan kenyamanan untuk rombongan keluarga..."
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 font-normal focus:outline-none focus:border-[#0B3B68]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPackageModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0B3B68] hover:bg-[#082B4D] text-white font-bold transition shadow-2xs"
                >
                  Simpan Paket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
