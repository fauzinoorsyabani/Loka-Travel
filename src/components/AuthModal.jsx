import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthModal({
  isOpen,
  onClose,
  usersList = [],
  onSelectDemoUser,
  onRegisterUser,
  onGoogleSignIn,
  googleClientId,
}) {
  const [activeTab, setActiveTab] = useState('google');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedCategories, setSelectedCategories] = useState(['Beach', 'Taman Hiburan']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize Google Sign-In button
  useEffect(() => {
    if (isOpen && googleClientId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response) => {
            if (response && response.credential) {
              onGoogleSignIn(response.credential);
            }
          },
        });
        const container = document.getElementById('google-btn-container');
        if (container) {
          container.innerHTML = '';
          window.google.accounts.id.renderButton(container, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'continue_with',
            shape: 'pill',
            locale: 'id',
          });
        }
      } catch (err) {
        console.error('Google Sign-In init error:', err);
      }
    }
  }, [isOpen, googleClientId, onGoogleSignIn]);

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

  const handleCategoryToggle = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await onRegisterUser({
        name: name.trim(),
        email: email.trim(),
        preferred_categories: selectedCategories,
      });
      setName('');
      setEmail('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // STRICT RBAC: Only regular traveler personas are accessible for guest demo
  const guestDemoUsers = usersList.filter(
    (u) => u.user_type !== 'admin' && u.user_type !== 'super_admin'
  );

  return (
    <AnimatePresence>
      <div
        id="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[80vh] my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-50 border border-teal-100 p-0.5 flex items-center justify-center shrink-0">
                <picture className="w-9 h-9 flex items-center justify-center">
                  <source srcset="/static/images/mascot/mascot-welcome.webp" type="image/webp" />
                  <img
                    src="/static/images/mascot/mascot-welcome.png"
                    alt="Si Loka"
                    className="w-9 h-9 object-contain"
                  />
                </picture>
              </div>
              <div>
                <h3 id="auth-modal-title" className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight">
                  Masuk ke Loka Travel
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                  Simpan riwayat liburan &amp; dapatkan rekomendasi cerdas
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition shrink-0"
              aria-label="Tutup Dialog"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Primary Authentication: Google Sign-In */}
          <div className="px-6 pt-4 pb-3 bg-slate-50/70 border-b border-slate-100 shrink-0 text-center space-y-2">
            <div id="google-btn-container" className="flex justify-center min-h-[40px]">
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => onGoogleSignIn()}
                id="btn-google-signin-fallback"
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2.5 transition shadow-xs"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Lanjutkan dengan Akun Google</span>
              </motion.button>
            </div>
            <p className="text-[11px] text-slate-400">
              Masuk aman tanpa repot mengingat kata sandi
            </p>
          </div>

          {/* Secondary Options Tabs */}
          <div className="flex border-b border-slate-100 bg-slate-50/70 p-1.5 gap-1 text-xs font-semibold shrink-0">
            <button
              type="button"
              id="auth-tab-demo-btn"
              onClick={() => setActiveTab('demo')}
              className={`flex-1 py-1.5 rounded-xl transition text-center ${
                activeTab === 'demo'
                  ? 'bg-white text-[#0B3B68] shadow-xs border border-slate-200/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Coba Akun Demo
            </button>
            <button
              type="button"
              id="auth-tab-register-btn"
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-1.5 rounded-xl transition text-center ${
                activeTab === 'register'
                  ? 'bg-white text-[#0B3B68] shadow-xs border border-slate-200/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daftar Traveler Baru
            </button>
          </div>

          {/* Tab Content */}
          <div className="overflow-y-auto flex-1 overscroll-contain">
            {activeTab === 'demo' ? (
              <div id="auth-tab-demo-content" className="p-5 space-y-2.5">
                <div className="text-[11px] sm:text-xs text-slate-600">
                  Pilih salah satu profil wisatawan untuk menguji rekomendasi cerdas (Cold-Start &amp; Collaborative Filtering):
                </div>
                <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                  {guestDemoUsers.map((u) => (
                    <motion.button
                      key={u.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => {
                        onSelectDemoUser(u.id);
                        onClose();
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-[#0B3B68] hover:bg-slate-50 flex items-center justify-between text-left transition group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-full bg-[#0B3B68]/10 text-[#0B3B68] font-bold flex items-center justify-center text-xs shrink-0 group-hover:bg-[#0B3B68] group-hover:text-white transition">
                          {u.avatar || u.name[0]}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">{u.name}</div>
                          <div className="text-[11px] text-slate-500 truncate">{u.role}</div>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-[#00897B] shrink-0 ml-2">Pilih &rarr;</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <form id="auth-register-form" onSubmit={handleRegister} className="p-5 space-y-3.5">
                <div>
                  <label htmlFor="reg-name" className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    id="reg-name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Rian Pratama"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#0B3B68]"
                  />
                </div>

                <div>
                  <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-700 mb-1">
                    Email (Opsional)
                  </label>
                  <input
                    type="email"
                    id="reg-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#0B3B68]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori Wisata Favorit (Inisialisasi Rekomendasi Awal)
                  </label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {[
                      { id: 'Beach', label: 'Pantai & Bahari' },
                      { id: 'Mountain', label: 'Pegunungan' },
                      { id: 'Camp', label: 'Camp & Alam' },
                      { id: 'Taman Hiburan', label: 'Taman Hiburan' },
                    ].map((cat) => {
                      const isChecked = selectedCategories.includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleCategoryToggle(cat.id)}
                          className={`p-2 rounded-xl border text-xs font-semibold transition text-left ${
                            isChecked
                              ? 'border-[#00897B] bg-teal-50 text-[#00897B]'
                              : 'border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={isSubmitting || !name.trim()}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#0B3B68] hover:bg-[#082B4D] text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
                  >
                    {isSubmitting ? 'Mendaftarkan...' : 'Daftar & Masuk Sekarang'}
                  </motion.button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
