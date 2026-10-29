export async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.message) errorMsg = errJson.message;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const lokaApi = {
  getInitData: (userId = 'vanica', city = 'Bandung') =>
    apiFetch(`/api/init?user_id=${encodeURIComponent(userId)}&city=${encodeURIComponent(city)}`),

  recommend: (payload) =>
    apiFetch('/api/recommend', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  calculateItinerary: (payload) =>
    apiFetch('/api/itinerary', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  bookPackage: (payload) =>
    apiFetch('/api/book-package', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  resetMatrix: (payload) =>
    apiFetch('/api/reset-matrix', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  loginUser: (payload) =>
    apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: (userId = 'vanica') =>
    apiFetch(`/api/auth/me?user_id=${encodeURIComponent(userId)}`),

  loginGoogle: (credential, preferredCategories = ['Beach', 'Mountain']) =>
    apiFetch('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential, preferred_categories: preferredCategories }),
    }),

  getDbStatus: () => apiFetch('/api/db/status'),

  getMetrics: () => apiFetch('/api/metrics'),

  sendChatMessage: (payload) =>
    apiFetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Multi-Role Admin & Super Admin Management Endpoints
  getAdminOverview: () => apiFetch('/api/admin/overview'),

  getAdminUsers: () => apiFetch('/api/admin/users'),

  updateUserRole: (payload) =>
    apiFetch('/api/admin/users/role', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getAdminPackages: () => apiFetch('/api/admin/packages'),

  addAdminPackage: (payload) =>
    apiFetch('/api/admin/packages', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteAdminPackage: (pkgId) =>
    apiFetch(`/api/admin/packages/${encodeURIComponent(pkgId)}`, {
      method: 'DELETE',
    }),

  getAdminBookings: () => apiFetch('/api/admin/bookings'),

  updateBookingStatus: (payload) =>
    apiFetch('/api/admin/bookings/status', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getAdminMatrix: () => apiFetch('/api/admin/matrix'),

  recalculateAdminMatrix: () =>
    apiFetch('/api/admin/recalculate', {
      method: 'POST',
    }),
};
