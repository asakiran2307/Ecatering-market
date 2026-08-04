// sidebar.js — Role-based sidebar navigation
import auth from '../auth.js';

const CATERER_LINKS = [
  { href: '#/caterer/orders',   icon: '📋', label: 'Incoming Orders' },
  { href: '#/caterer/menu',     icon: '🍽',  label: 'Menu Management' },
  { href: '#/caterer/calendar', icon: '📅', label: 'Bookings Calendar' },
  { href: '#/caterer/chat',     icon: '💬', label: 'Chat Inbox' },
  { href: '#/caterer/settings', icon: '⚙️', label: 'Profile & Settings' },
];

const ADMIN_LINKS = [
  { href: '#/admin/analytics',    icon: '📊', label: 'Analytics' },
  { href: '#/admin/verification', icon: '✅', label: 'Caterer Verification' },
  { href: '#/admin/orders',       icon: '📦', label: 'All Orders' },
  { href: '#/admin/disputes',     icon: '⚠️', label: 'Disputes' },
  { href: '#/admin/users',        icon: '👥', label: 'User Management' },
  { href: '#/admin/settings',     icon: '⚙️', label: 'Platform Settings' },
];

const CUSTOMER_LINKS = [
  { href: '#/',               icon: '🏠', label: 'Browse Caterers' },
  { href: '#/account/orders', icon: '📦', label: 'My Orders' },
  { href: '#/account',        icon: '👤', label: 'My Account' },
];

export function renderSidebar(role) {
  const container = document.getElementById('sidebar-container');
  if (!role) { container.innerHTML = ''; return; }

  let links = [];
  let sectionLabel = '';

  if (role === 'caterer') { links = CATERER_LINKS; sectionLabel = 'Caterer Dashboard'; }
  else if (role === 'admin') { links = ADMIN_LINKS; sectionLabel = 'Admin Dashboard'; }
  else { links = CUSTOMER_LINKS; sectionLabel = 'Customer'; }

  const currentHash = window.location.hash.split('?')[0];

  const linksHTML = links.map(l => `
    <a href="${l.href}" class="sidebar-link ${currentHash === l.href ? 'active' : ''}">
      <span class="sidebar-link-icon">${l.icon}</span>
      ${l.label}
    </a>
  `).join('');

  container.innerHTML = `
    <aside class="sidebar" role="navigation" aria-label="Dashboard navigation">
      <div class="sidebar-section">
        <p class="sidebar-label">${sectionLabel}</p>
        ${linksHTML}
      </div>
    </aside>
  `;

  document.getElementById('app-shell').classList.add('has-sidebar');
}

export function clearSidebar() {
  const container = document.getElementById('sidebar-container');
  container.innerHTML = '';
  document.getElementById('app-shell').classList.remove('has-sidebar');
}
