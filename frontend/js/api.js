// api.js — Centralized API client
// Use relative /api path on Vercel (or any deployed host).
// Only fall back to localhost:5000 when running on localhost WITHOUT port 5000
// (i.e. opening index.html directly as a file, which is unusual).
const _origin = window.location.origin;
const BASE_URL = (_origin.includes('localhost') && !_origin.includes(':5000'))
  ? 'http://localhost:5000/api'
  : '/api';

function getToken() {
  return localStorage.getItem('ecatring_token');
}

async function request(method, path, body = null, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(BASE_URL + path, config);
  } catch (err) {
    throw new Error('Network error — is the backend running?');
  }

  let data;
  try { data = await res.json(); } catch { data = {}; }

  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/auth/login')) {
      localStorage.removeItem('ecatring_token');
      localStorage.removeItem('ecatring_user');
      window.dispatchEvent(new CustomEvent('auth:changed', { detail: null }));
    }
    const msg = data.error || `Request failed (${res.status})`;
    throw Object.assign(new Error(msg), { status: res.status, data });
  }
  return data;
}

export const api = {
  get:    (path)         => request('GET',    path),
  post:   (path, body)   => request('POST',   path, body),
  put:    (path, body)   => request('PUT',    path, body),
  delete: (path)         => request('DELETE', path),
  patch:  (path, body)   => request('PATCH',  path, body),

  // Auth
  auth: {
    login:          (d)  => request('POST', '/auth/login', d),
    signup:         (d)  => request('POST', '/auth/signup', d),
    me:             ()   => request('GET',  '/auth/me'),
    updateMe:       (d)  => request('PUT',  '/auth/me', d),
    changePassword: (d)  => request('POST', '/auth/change-password', d),
  },

  // Caterers
  caterers: {
    list:     (params = {}) => request('GET', '/caterers?' + new URLSearchParams(params)),
    get:      (id)           => request('GET', `/caterers/${id}`),
    featured: ()             => request('GET', '/caterers/featured'),
    myProfile:()             => request('GET', '/caterers/me'),
    updateProfile:(d)        => request('PUT', '/caterers/me', d),
    getMenu:  (id, avail)    => request('GET', `/caterers/${id}/menu${avail ? '?available=true' : ''}`),
    addItem:  (id, d)        => request('POST',   `/caterers/${id}/menu`, d),
    updateItem:(id, iid, d)  => request('PUT',    `/caterers/${id}/menu/${iid}`, d),
    deleteItem:(id, iid)     => request('DELETE', `/caterers/${id}/menu/${iid}`),
    toggleItem:(id, iid)     => request('POST',   `/caterers/${id}/menu/${iid}/toggle`),
  },

  // Orders
  orders: {
    create:       (d)       => request('POST', '/orders', d),
    list:         (params)  => request('GET', '/orders?' + new URLSearchParams(params || {})),
    get:          (id)      => request('GET',  `/orders/${id}`),
    updateStatus: (id, d)   => request('PUT',  `/orders/${id}/status`, d),
    getMessages:  (id, since) => request('GET', `/orders/${id}/messages${since ? `?since=${since}` : ''}`),
    sendMessage:  (id, d)   => request('POST', `/orders/${id}/messages`, d),
    chatThreads:  ()        => request('GET', '/orders/caterer/threads'),
  },

  // Reviews
  reviews: {
    create: (d)   => request('POST', '/reviews', d),
    forCaterer:(id, p) => request('GET', `/reviews/caterer/${id}?page=${p||1}`),
  },

  // Disputes
  disputes: {
    create: (d)    => request('POST', '/disputes', d),
    list:   (s)    => request('GET', `/disputes?status=${s||''}`),
    get:    (id)   => request('GET',  `/disputes/${id}`),
    update: (id,d) => request('PUT',  `/disputes/${id}`, d),
  },

  // Admin
  admin: {
    pendingCaterers:  ()         => request('GET', '/admin/caterers/pending'),
    verifyCaterer:    (id, d)    => request('POST', `/admin/caterers/${id}/verify`, d),
    users:            (params)   => request('GET', '/admin/users?' + new URLSearchParams(params || {})),
    updateUserStatus: (id, d)    => request('PUT',  `/admin/users/${id}/status`, d),
    analytics:        ()         => request('GET', '/admin/analytics'),
    orders:           (params)   => request('GET', '/admin/orders?' + new URLSearchParams(params || {})),
    getSettings:      ()         => request('GET', '/admin/settings'),
    updateSettings:   (d)        => request('PUT', '/admin/settings', d),
  },
};

export default api;
