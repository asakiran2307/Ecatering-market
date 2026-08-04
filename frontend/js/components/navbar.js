// navbar.js — Top navigation bar
import auth from '../auth.js';
import { cart } from '../cart.js';

export function renderNavbar() {
  const container = document.getElementById('navbar-container');
  const user = auth.getUser();
  const cartCount = cart.count();

  container.innerHTML = `
    <nav class="navbar" role="navigation" aria-label="Main navigation">
      <a href="#/" class="navbar-brand">
        <span class="navbar-brand-icon">🍽</span>
        Ecatring
      </a>

      <div class="navbar-search">
        <span class="navbar-search-icon">🔍</span>
        <input type="search" id="navbar-search-input" placeholder="Search caterers or location…"
               aria-label="Search caterers" autocomplete="off" />
      </div>

      <ul class="navbar-nav" role="list">
        ${user ? `
          ${user.role === 'customer' ? `
            <li>
              <button class="cart-btn" id="nav-cart-btn" aria-label="Cart (${cartCount} items)">
                🛒 Cart
                ${cartCount > 0 ? `<span class="cart-badge">${cartCount}</span>` : ''}
              </button>
            </li>
          ` : ''}
          <li>
            <button class="user-avatar" id="nav-user-btn" title="${user.name} (${user.role})"
                    aria-label="User menu">
              ${user.name.charAt(0).toUpperCase()}
            </button>
          </li>
          <li>
            <button id="nav-logout-btn" class="btn btn-ghost btn-sm">Sign out</button>
          </li>
        ` : `
          <li><a href="#/login" class="btn btn-ghost btn-sm">Sign in</a></li>
          <li><a href="#/signup" class="btn btn-primary btn-sm">Get started</a></li>
        `}
      </ul>
    </nav>
  `;

  // Search
  const searchInput = document.getElementById('navbar-search-input');
  if (searchInput) {
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.target.value.trim()) {
        window.location.hash = `#/search?q=${encodeURIComponent(e.target.value.trim())}`;
      }
    });
  }

  // Cart
  const cartBtn = document.getElementById('nav-cart-btn');
  if (cartBtn) cartBtn.addEventListener('click', () => { window.location.hash = '#/cart'; });

  // User menu → go to profile
  const userBtn = document.getElementById('nav-user-btn');
  if (userBtn && user) {
    userBtn.addEventListener('click', () => {
      if (user.role === 'customer') window.location.hash = '#/account';
      else if (user.role === 'caterer') window.location.hash = '#/caterer/settings';
      else window.location.hash = '#/admin/analytics';
    });
  }

  // Logout
  const logoutBtn = document.getElementById('nav-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      auth.logout();
      window.location.hash = '#/';
    });
  }
}
