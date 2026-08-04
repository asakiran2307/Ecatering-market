// utils.js — Shared utilities
export function formatPrice(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN');
}

export function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(str) {
  if (!str) return '—';
  return new Date(str).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export function formatRating(r) {
  return (r || 0).toFixed(1);
}

export function statusBadge(status) {
  return `<span class="badge badge-${status || 'pending'}">${status || 'pending'}</span>`;
}

export function cuisineEmoji(cuisine) {
  const map = {
    'North Indian': '🍛', 'South Indian': '🌿', 'Continental': '🍽',
    'Chinese': '🥢', 'Healthy': '🥗', 'Street Food': '🌮',
    'Gujarati': '🍡', 'Mughlai': '🍖', 'Chaat': '🥘', 'Jain': '🌱',
    'Salads': '🥗', 'Vegetarian': '🌿',
  };
  return map[cuisine] || '🍽';
}

export function avatarInitials(name) {
  return (name || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
}

export function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function renderEmpty(icon, title, desc, action = '') {
  return `
    <div class="empty-state">
      <div class="empty-state-icon">${icon}</div>
      <h3 class="empty-state-title">${title}</h3>
      <p class="empty-state-desc">${desc}</p>
      ${action}
    </div>
  `;
}

export function renderLoader() {
  return `<div class="page-loader"><div class="loader-spinner"></div></div>`;
}

export function debounce(fn, ms = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
