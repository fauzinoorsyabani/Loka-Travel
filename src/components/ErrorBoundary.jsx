import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Loka Travel React App caught an error:', error, errorInfo);
  }

  handleReload = () => {
    localStorage.removeItem('loka_active_user');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800 font-sans">
          <div className="max-w-md w-full bg-white rounded-xl p-8 shadow-xl border border-slate-200 text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[#0B3B68]">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-extrabold text-slate-900">
                Sistem Sedang Menyelaraskan Data
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Terjadi pembaruan konfigurasi rekomendasi paket wisata &amp; hotel. Klik tombol di bawah untuk memuat ulang katalog terbaru.
              </p>
            </div>
            <button
              type="button"
              onClick={this.handleReload}
              className="w-full py-2.5 px-5 rounded-lg bg-[#0B3B68] hover:bg-[#082B4D] text-white font-bold text-sm shadow-2xs transition"
            >
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

