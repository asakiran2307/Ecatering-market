// auth.js — Auth state management
import api from './api.js';

const TOKEN_KEY = 'ecatring_token';
const USER_KEY  = 'ecatring_user';

export const auth = {
  getToken() { return localStorage.getItem(TOKEN_KEY); },
  getUser()  {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); }
    catch { return null; }
  },
  isLoggedIn() { return !!this.getToken(); },
  getRole()  { return this.getUser()?.role || null; },

  login(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('auth:changed', { detail: user }));
  },
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.dispatchEvent(new CustomEvent('auth:changed', { detail: null }));
  },

  async refresh() {
    if (!this.getToken()) return null;
    try {
      const user = await api.auth.me();
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
    } catch {
      this.logout();
      return null;
    }
  },
};

export default auth;
