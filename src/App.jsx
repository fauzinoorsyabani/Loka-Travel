import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import TourPackages from './components/TourPackages';
import HotelRecommender from './components/HotelRecommender';
import HybridItinerary from './components/HybridItinerary';
import MyOrders from './components/MyOrders';
import AuthModal from './components/AuthModal';
import UserProfileModal from './components/UserProfileModal';
import AdminDashboard from './components/AdminDashboard';
import AIAssistantChatbot from './components/AIAssistantChatbot';
import Footer from './components/Footer';
import MobileBottomNav from './components/MobileBottomNav';
import Toast from './components/Toast';
import { lokaApi } from './api/client';
import {
  INITIAL_BENCHMARKS,
  INITIAL_USERS,
  INITIAL_CF_DATA,
  INITIAL_ROOM_ALLOCATION,
} from './constants/initialData';

export default function App() {
  const [activeUserId, setActiveUserId] = useState(() => {
    try {
      const saved = localStorage.getItem('loka_active_user');
      if (saved) {
        const u = JSON.parse(saved);
        return u.id || null;
      }
    } catch {}
    return null;
  });

  const [activeUser, setActiveUser] = useState(() => {
    try {
      const saved = localStorage.getItem('loka_active_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [usersList, setUsersList] = useState(INITIAL_USERS);
  const [benchmarks, setBenchmarks] = useState(INITIAL_BENCHMARKS);
  const [googleClientId, setGoogleClientId] = useState(
    '79331604162-1h51uaaqgsib8uqteb14017ic97t84ia.apps.googleusercontent.com'
  );

  const [cfData, setCfData] = useState(INITIAL_CF_DATA);
  const [currentCategory, setCurrentCategory] = useState('All');

  const [hotelData, setHotelData] = useState({
    hotels: [],
    room_allocation: INITIAL_ROOM_ALLOCATION,
    reference_hotel: { name: 'Hotel Rekomendasi Utama', region: 'Jakarta' },
    latency_ms: 28,
  });
  const [hotelParams, setHotelParams] = useState({
    city: 'Jakarta',
    mode: 'advanced',
    adults: 2,
    children: 1,
    seniors: 0,
    budget_per_night: 2500000,
    preferences: { wifi: 0.8, pool: 0.8, restaurant: 0.7, kids: 0.8, accessible: 0.6 },
  });
  const [isLoadingHotel, setIsLoadingHotel] = useState(false);

  const [itinerary, setItinerary] = useState(null);
  const [stayNights, setStayNights] = useState(2);

  const [currentView, setCurrentView] = useState(() => {
    return typeof window !== 'undefined' && window.location.hash === '#dashboard'
      ? 'dashboard'
      : 'travel';
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', visible: false });

  // Browser hash synchronization
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#dashboard') {
        setCurrentView('dashboard');
      } else {
        setCurrentView('travel');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleOpenDashboard = useCallback(() => {
    window.location.hash = '#dashboard';
    setCurrentView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBackToTravel = useCallback(() => {
    window.location.hash = '';
    setCurrentView('travel');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const isLoggedIn = Boolean(activeUser);
  const hasBookings = Boolean(cfData?.schedule && cfData.schedule.length > 0);
  const scheduleCount = cfData?.schedule?.length || 0;

  const showToast = useCallback((msg) => {
    setToast({ message: msg, visible: true });
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3800);
  }, []);

  const scrollToSection = useCallback((sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handleLogout = useCallback(() => {
    setActiveUser(null);
    setActiveUserId(null);
    localStorage.removeItem('loka_active_user');
    setCfData((prev) => ({ ...prev, schedule: [] }));
    setAuthModalOpen(false);
    setProfileModalOpen(false);
    if (window.location.hash === '#dashboard') {
      window.location.hash = '';
      setCurrentView('travel');
    }
    showToast('Berhasil keluar dari akun.');
  }, [showToast]);

  // Fetch initial data on mount or refresh
  const loadInitial = useCallback(async () => {
    try {
      const res = await lokaApi.getInitData(activeUserId || 'vanica', 'Jakarta');
      if (res.status === 'ok') {
        if (res.benchmarks) setBenchmarks(res.benchmarks);
        if (res.cf_initial) setCfData(res.cf_initial);
        if (res.hotel_initial) setHotelData(res.hotel_initial);
        if (res.itinerary_initial) {
          setItinerary(res.itinerary_initial);
          if (res.itinerary_initial.cost_breakdown?.stay_nights) {
            setStayNights(res.itinerary_initial.cost_breakdown.stay_nights);
          }
        }
        if (res.users_list) setUsersList(res.users_list);
        if (res.google_client_id) setGoogleClientId(res.google_client_id);

        if (activeUserId) {
          const found = (res.users_list || []).find((u) => u.id === activeUserId);
          if (found) setActiveUser(found);
        }
      }
    } catch (err) {
      console.warn('Initial data fetch fallback to local constants:', err);
    }
  }, [activeUserId]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // Recalculate Itinerary Costs helper
  const updateItineraryWithParams = useCallback(
    (customHotel, customStayNights, customParams) => {
      if (!itinerary || !itinerary.tour_package) return;
      const pkg = itinerary.tour_package;
      const activeHotel = customHotel || itinerary.hotel;
      const params = customParams || hotelParams;
      const nights = customStayNights ?? stayNights;

      const adults = Number(params.adults || 2);
      const children = Number(params.children || 0);
      const seniors = Number(params.seniors || 0);
      const totalGuests = Math.max(1, adults + children + seniors);
      const effectivePacks = Math.max(1, Math.ceil(adults + seniors + children * 0.5));
      const rooms = hotelData?.room_allocation?.total_rooms || Math.max(1, Math.ceil(effectivePacks / 2));

      const tourTotal = Math.round(Number(pkg.price || 0) * effectivePacks);
      const hotelPrice = Number(activeHotel?.price_per_night || 0);
      const hotelTotal = Math.round(hotelPrice * rooms * nights);
      const grandTotal = tourTotal + hotelTotal;
      const perPerson = Math.round(grandTotal / totalGuests);

      setItinerary((prev) => ({
        ...prev,
        hotel: activeHotel,
        room_allocation: hotelData?.room_allocation || prev?.room_allocation,
        cost_breakdown: {
          duration_days: pkg.duration_days || 2,
          stay_nights: nights,
          total_guests: totalGuests,
          effective_tour_packs: effectivePacks,
          tour_total_idr: tourTotal,
          hotel_total_idr: hotelTotal,
          grand_total_idr: grandTotal,
          per_person_idr: perPerson,
        },
      }));
    },
    [itinerary, hotelParams, stayNights, hotelData]
  );

  // Update Hotel Recommendations
  const handleUpdateHotelRecommendations = useCallback(
    async (newParams) => {
      setIsLoadingHotel(true);
      const merged = { ...hotelParams, ...newParams };
      setHotelParams(merged);

      try {
        const payload = {
          city: merged.city,
          mode: merged.mode,
          adults: merged.adults,
          children: merged.children,
          seniors: merged.seniors,
          budget_per_night: merged.budget_per_night,
          user_id: activeUserId || 'vanica',
          category: currentCategory,
          preferences: merged.preferences,
        };
        const res = await lokaApi.recommend(payload);
        if (res.hotel_recommendations) {
          setHotelData(res.hotel_recommendations);
        }
        if (res.collaborative_filtering) {
          setCfData(res.collaborative_filtering);
        }
        if (res.hybrid_itinerary) {
          setItinerary(res.hybrid_itinerary);
          if (res.hybrid_itinerary.cost_breakdown?.stay_nights) {
            setStayNights(res.hybrid_itinerary.cost_breakdown.stay_nights);
          }
        }
      } catch (err) {
        showToast('Gagal memperbarui rekomendasi hotel.');
      } finally {
        setIsLoadingHotel(false);
      }
    },
    [hotelParams, activeUserId, currentCategory, showToast]
  );

  // Change Traveler Profile
  const handleChangeUser = useCallback(
    async (userId) => {
      setActiveUserId(userId);
      const found = usersList.find((u) => u.id === userId);
      if (found) {
        setActiveUser(found);
        localStorage.setItem('loka_active_user', JSON.stringify(found));
      }

      try {
        const res = await lokaApi.recommend({
          user_id: userId,
          category: currentCategory,
          city: hotelParams.city,
          adults: hotelParams.adults,
          children: hotelParams.children,
          seniors: hotelParams.seniors,
          budget_per_night: hotelParams.budget_per_night,
          preferences: hotelParams.preferences,
        });
        if (res.collaborative_filtering) setCfData(res.collaborative_filtering);
        if (res.hybrid_itinerary) setItinerary(res.hybrid_itinerary);
        showToast(`Profil aktif beralih ke ${found?.name || userId}`);
      } catch (err) {
        showToast('Gagal memuat preferensi traveler.');
      }
    },
    [usersList, currentCategory, hotelParams, showToast]
  );

  // Category change for Tour Packages
  const handleCategoryChange = useCallback(
    async (cat) => {
      setCurrentCategory(cat);
      try {
        const res = await lokaApi.recommend({
          user_id: activeUserId || 'vanica',
          category: cat,
          city: hotelParams.city,
          adults: hotelParams.adults,
          children: hotelParams.children,
          seniors: hotelParams.seniors,
          budget_per_night: hotelParams.budget_per_night,
          preferences: hotelParams.preferences,
        });
        if (res.collaborative_filtering) setCfData(res.collaborative_filtering);
      } catch (err) {
        showToast('Gagal memfilter kategori.');
      }
    },
    [activeUserId, hotelParams, showToast]
  );

  // Book Tour Package
  const handleBookPackage = useCallback(
    async (packageId) => {
      let uid = activeUserId;
      if (!uid) {
        uid = 'vanica';
        setActiveUserId('vanica');
        const defaultUser = usersList.find((u) => u.id === 'vanica') || {
          id: 'vanica',
          name: 'Vanica',
          avatar: 'V',
        };
        setActiveUser(defaultUser);
        localStorage.setItem('loka_active_user', JSON.stringify(defaultUser));
      }

      try {
        const res = await lokaApi.bookPackage({
          user_id: uid,
          package_id: packageId,
          packs: 2,
          category: currentCategory,
          city: hotelParams.city,
          adults: hotelParams.adults,
          children: hotelParams.children,
          seniors: hotelParams.seniors,
          budget_per_night: hotelParams.budget_per_night,
        });
        if (res.updated_cf) setCfData(res.updated_cf);
        if (res.hybrid_itinerary) setItinerary(res.hybrid_itinerary);
        showToast(`Paket "${res.package_name}" berhasil dipesan & ditambahkan ke Pesanan Saya!`);
        setTimeout(() => scrollToSection('schedule-section'), 400);
      } catch (err) {
        showToast('Gagal memesan paket wisata.');
      }
    },
    [activeUserId, usersList, currentCategory, hotelParams, showToast, scrollToSection]
  );

  // Reset Bookings
  const handleResetOrders = useCallback(async () => {
    try {
      const res = await lokaApi.resetMatrix({
        user_id: activeUserId || 'vanica',
        category: currentCategory,
        city: hotelParams.city,
        adults: hotelParams.adults,
        children: hotelParams.children,
        seniors: hotelParams.seniors,
        budget_per_night: hotelParams.budget_per_night,
      });
      if (res.updated_cf) setCfData(res.updated_cf);
      if (res.hybrid_itinerary) setItinerary(res.hybrid_itinerary);
      showToast('Daftar pesanan & rekomendasi berhasil dikembalikan ke pengaturan awal.');
    } catch (err) {
      showToast('Gagal mereset pesanan.');
    }
  }, [activeUserId, currentCategory, hotelParams, showToast]);

  // Select Hotel for Itinerary
  const handleSelectHotel = useCallback(
    (chosenHotel) => {
      updateItineraryWithParams(chosenHotel, stayNights, hotelParams);
      scrollToSection('hybrid-itinerary-section');
      showToast(`Hotel "${chosenHotel.name}" dipilih ke dalam Rencana Perjalanan.`);
    },
    [updateItineraryWithParams, stayNights, hotelParams, scrollToSection, showToast]
  );

  // Adjust Stay Nights
  const handleAdjustStayNights = useCallback(
    (delta) => {
      const nextNights = Math.max(1, Math.min(30, stayNights + delta));
      setStayNights(nextNights);
      updateItineraryWithParams(null, nextNights, hotelParams);
    },
    [stayNights, updateItineraryWithParams, hotelParams]
  );

  // Copy Itinerary Summary
  const handleCopySummary = useCallback(() => {
    const pkgName = itinerary?.tour_package?.name || 'Paket Wisata Loka Travel';
    const hotelName = itinerary?.hotel?.name || 'Hotel Rekomendasi';
    const room = itinerary?.room_allocation?.strategy || 'Konfigurasi Kamar Rombongan';
    const grandTotal = Number(itinerary?.cost_breakdown?.grand_total_idr || 0).toLocaleString('id-ID');
    const perPerson = Number(itinerary?.cost_breakdown?.per_person_idr || 0).toLocaleString('id-ID');

    const summaryText = `Rencana Perjalanan Loka Travel:\n- Paket Wisata: ${pkgName}\n- Hotel Rombongan: ${hotelName}\n- Konfigurasi Kamar: ${room}\n- Total Estimasi: Rp ${grandTotal} (Rp ${perPerson} / tamu)`;

    navigator.clipboard?.writeText(summaryText);
    showToast('Ringkasan rencana perjalanan berhasil disalin ke clipboard.');
  }, [itinerary, showToast]);

  // Google Sign-in Handler
  const handleGoogleSignIn = useCallback(
    async (credential) => {
      if (typeof credential === 'string' && credential.length > 20) {
        try {
          const res = await lokaApi.loginGoogle(credential);
          if (res.user) {
            if (res.users_list) setUsersList(res.users_list);
            setActiveUser(res.user);
            setActiveUserId(res.user.id);
            localStorage.setItem('loka_active_user', JSON.stringify(res.user));
            setAuthModalOpen(false);
            showToast(`Selamat datang di Loka Travel, ${res.user.name}!`);
            handleChangeUser(res.user.id);
            return;
          }
        } catch (err) {
          showToast('Verifikasi login Google gagal.');
        }
      }

      if (window.google?.accounts?.id && googleClientId) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            if (response && response.credential) {
              await handleGoogleSignIn(response.credential);
            }
          },
        });
        window.google.accounts.id.prompt();
      } else {
        handleChangeUser('vanica');
        setAuthModalOpen(false);
        showToast('Masuk sebagai Vanica (Demo Google Auth)');
      }
    },
    [googleClientId, handleChangeUser, showToast]
  );

  // Register New User (Cold-Start)
  const handleRegisterUser = useCallback(
    async (formData) => {
      try {
        const res = await lokaApi.loginUser(formData);
        if (res.status === 'ok') {
          if (res.users_list) setUsersList(res.users_list);
          setActiveUser(res.user);
          setActiveUserId(res.user.id);
          localStorage.setItem('loka_active_user', JSON.stringify(res.user));
          showToast(`Selamat datang di Loka Travel, ${res.user.name}!`);
          handleChangeUser(res.user.id);
        }
      } catch (err) {
        showToast('Gagal mendaftarkan traveler baru.');
      }
    },
    [showToast, handleChangeUser]
  );

  // Sync City from Tour Package to Hotel Workbench
  const handleSyncCity = useCallback(
    (targetCity) => {
      const validCity = benchmarks.cities.includes(targetCity) ? targetCity : 'All';
      handleUpdateHotelRecommendations({ city: validCity });
      scrollToSection('group-hotel-workbench');
    },
    [benchmarks.cities, handleUpdateHotelRecommendations, scrollToSection]
  );

  if (currentView === 'dashboard') {
    return (
      <>
        <AdminDashboard
          activeUser={activeUser}
          onBackToTravel={handleBackToTravel}
          onNotify={showToast}
          onRefreshData={loadInitial}
        />
        <Toast message={toast.message} visible={toast.visible} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased selection:bg-[#0B3B68] selection:text-white overflow-x-hidden pb-20 lg:pb-0">
      {/* Top Navigation Bar */}
      <Navbar
        activeUser={activeUser}
        isLoggedIn={isLoggedIn}
        hasBookings={hasBookings}
        scheduleCount={scheduleCount}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenProfile={() => setProfileModalOpen(true)}
        onOpenDashboard={handleOpenDashboard}
        onLogout={handleLogout}
        onScrollToSection={scrollToSection}
      />

      {/* Hero Section */}
      <Hero
        benchmarks={benchmarks}
        latencyMs={hotelData?.latency_ms || 28}
        onQuickSearch={(searchParams) => {
          handleUpdateHotelRecommendations(searchParams);
        }}
        onScrollToSection={scrollToSection}
      />

      {/* Main Workspace */}
      <main className="page-container py-10 sm:py-14 space-y-16 sm:space-y-20">
        {/* Section 01: Tour Packages */}
        <TourPackages
          cfData={cfData}
          usersList={usersList}
          activeUserId={activeUserId}
          activeUser={activeUser}
          isLoggedIn={isLoggedIn}
          onChangeUser={handleChangeUser}
          onCategoryChange={handleCategoryChange}
          currentCategory={currentCategory}
          onBookPackage={handleBookPackage}
          onSyncCity={handleSyncCity}
        />

        {/* Section 02: Group Hotel Recommender */}
        <HotelRecommender
          benchmarks={benchmarks}
          hotelData={hotelData}
          onUpdateRecommendations={handleUpdateHotelRecommendations}
          onSelectHotel={handleSelectHotel}
          initialCity={hotelParams.city}
          isLoading={isLoadingHotel}
        />

        {/* Section 03: Hybrid Itinerary & Cost Split */}
        <HybridItinerary
          itinerary={itinerary}
          stayNights={stayNights}
          onAdjustStayNights={handleAdjustStayNights}
          onCopySummary={handleCopySummary}
        />

        {/* Section 04: My Orders & Schedule (Only appears when user is logged in & has bookings) */}
        {isLoggedIn && hasBookings && (
          <MyOrders
            schedule={cfData?.schedule || []}
            activeUserName={activeUser?.name || 'Traveler'}
            onReset={handleResetOrders}
          />
        )}
      </main>

      {/* AI Travel Assistant Chatbot powered by Gemini */}
      <AIAssistantChatbot
        currentCity={hotelParams.city}
        currentGuests={{
          adults: hotelParams.adults,
          children: hotelParams.children,
          seniors: hotelParams.seniors,
        }}
        currentBudget={hotelParams.budget_per_night}
      />

      {/* Footer */}
      <Footer onScrollToSection={scrollToSection} />

      {/* Mobile Sticky Bottom Nav */}
      <MobileBottomNav
        isLoggedIn={isLoggedIn}
        hasBookings={hasBookings}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenProfile={() => setProfileModalOpen(true)}
        onScrollToSection={scrollToSection}
      />

      {/* Authenticated User Profile Modal (Strictly for Logged-In Users) */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        activeUser={activeUser}
        hasBookings={hasBookings}
        scheduleCount={scheduleCount}
        onLogout={handleLogout}
        onOpenDashboard={handleOpenDashboard}
        onScrollToSection={scrollToSection}
      />

      {/* Guest Authentication Modal (Strictly for Guests & Demo Personas) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        usersList={usersList}
        onSelectDemoUser={(uid) => handleChangeUser(uid)}
        onRegisterUser={handleRegisterUser}
        onGoogleSignIn={handleGoogleSignIn}
        googleClientId={googleClientId}
      />

      {/* Toast Banner */}
      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
