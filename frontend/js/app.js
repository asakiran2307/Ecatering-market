// app.js — Main SPA router and bootstrapper
import auth from './auth.js';
import { renderNavbar } from './components/navbar.js';
import { renderSidebar, clearSidebar } from './components/sidebar.js';
import { renderHome } from './pages/home.js';
import { renderSearch } from './pages/search.js';
import { renderCatererProfile } from './pages/catererProfile.js';
import { renderCart } from './pages/cart.js';
import { renderLogin } from './pages/login.js';
import { renderSignup } from './pages/signup.js';
import { renderOrderStatus } from './pages/orderStatus.js';
import { renderChat } from './pages/chat.js';
import { renderAccount, renderOrderHistory } from './pages/account.js';
import { renderCatererOrders } from './pages/caterer/orders.js';
import { renderCatererMenu } from './pages/caterer/menu.js';
import { renderCatererCalendar } from './pages/caterer/calendar.js';
import { renderCatererChatInbox } from './pages/caterer/chatInbox.js';
import { renderCatererSettings } from './pages/caterer/settings.js';
import { renderAdminAnalytics } from './pages/admin/analytics.js';
import { renderAdminVerification } from './pages/admin/verification.js';
import { renderAdminOrders } from './pages/admin/orders.js';
import { renderAdminDisputes } from './pages/admin/disputes.js';
import { renderAdminUsers } from './pages/admin/users.js';
import { renderAdminSettings } from './pages/admin/settings.js';

const mainContent = document.getElementById('main-content');

function parseHash() {
  const hash = window.location.hash.replace(/^#/, '') || '/';
  const [path, queryStr] = hash.split('?');
  const params = new URLSearchParams(queryStr || '');
  return { path, params };
}

async function route() {
  const { path, params } = parseHash();
  const user = auth.getUser();
  const role = user?.role;

  // Reset body classes
  document.body.className = '';

  // Match routes
  let matched = false;

  // Show loader
  mainContent.innerHTML = '<div class="page-loader"><div class="loader-spinner"></div></div>';

  // --- Public routes (no auth needed) ---
  if (path === '/' || path === '') {
    document.body.classList.add('public-page');
    clearSidebar();
    mainContent.style.padding = '0';
    mainContent.style.maxWidth = 'none';
    await renderHome(mainContent);
    matched = true;
  }

  else if (path === '/search') {
    clearSidebar();
    mainContent.style.padding = 'var(--space-8)';
    await renderSearch(mainContent, params);
    matched = true;
  }

  else if (path.match(/^\/caterers\/(\d+)$/)) {
    const id = path.match(/^\/caterers\/(\d+)$/)[1];
    clearSidebar();
    mainContent.style.padding = 'var(--space-8)';
    await renderCatererProfile(mainContent, id);
    matched = true;
  }

  else if (path === '/login') {
    clearSidebar();
    mainContent.style.padding = '0';
    renderLogin(mainContent);
    matched = true;
  }

  else if (path === '/signup') {
    clearSidebar();
    mainContent.style.padding = '0';
    renderSignup(mainContent, params);
    matched = true;
  }

  // --- Protected: any logged-in user ---
  else if (path === '/cart') {
    if (!requireAuth()) return;
    clearSidebar();
    mainContent.style.padding = 'var(--space-8)';
    await renderCart(mainContent);
    matched = true;
  }

  else if (path.match(/^\/orders\/(\d+)\/chat$/)) {
    if (!requireAuth()) return;
    const id = path.match(/^\/orders\/(\d+)\/chat$/)[1];
    clearSidebar();
    mainContent.style.padding = 'var(--space-8)';
    await renderChat(mainContent, id);
    matched = true;
  }

  else if (path.match(/^\/orders\/(\d+)$/)) {
    if (!requireAuth()) return;
    const id = path.match(/^\/orders\/(\d+)$/)[1];
    clearSidebar();
    mainContent.style.padding = 'var(--space-8)';
    await renderOrderStatus(mainContent, id);
    matched = true;
  }

  else if (path === '/account' || path === '/account/orders') {
    if (!requireAuth('customer')) return;
    renderSidebar('customer');
    mainContent.style.padding = 'var(--space-8)';
    if (path === '/account/orders') {
      mainContent.innerHTML = '<div class="page-header"><h1 class="page-title">My Orders</h1></div><div id="orders-history-content"><div class="page-loader"><div class="loader-spinner"></div></div></div>';
      await renderOrderHistory(document.getElementById('orders-history-content'));
    } else {
      await renderAccount(mainContent);
    }
    matched = true;
  }

  // --- Caterer routes ---
  else if (path === '/caterer' || path === '/caterer/orders') {
    if (!requireAuth('caterer')) return;
    renderSidebar('caterer');
    mainContent.style.padding = 'var(--space-8)';
    await renderCatererOrders(mainContent);
    matched = true;
  }
  else if (path === '/caterer/menu') {
    if (!requireAuth('caterer')) return;
    renderSidebar('caterer');
    mainContent.style.padding = 'var(--space-8)';
    await renderCatererMenu(mainContent);
    matched = true;
  }
  else if (path === '/caterer/calendar') {
    if (!requireAuth('caterer')) return;
    renderSidebar('caterer');
    mainContent.style.padding = 'var(--space-8)';
    await renderCatererCalendar(mainContent);
    matched = true;
  }
  else if (path === '/caterer/chat') {
    if (!requireAuth('caterer')) return;
    renderSidebar('caterer');
    mainContent.style.padding = 'var(--space-8)';
    await renderCatererChatInbox(mainContent);
    matched = true;
  }
  else if (path === '/caterer/settings') {
    if (!requireAuth('caterer')) return;
    renderSidebar('caterer');
    mainContent.style.padding = 'var(--space-8)';
    await renderCatererSettings(mainContent);
    matched = true;
  }

  // --- Admin routes ---
  else if (path === '/admin' || path === '/admin/analytics') {
    if (!requireAuth('admin')) return;
    renderSidebar('admin');
    mainContent.style.padding = 'var(--space-8)';
    await renderAdminAnalytics(mainContent);
    matched = true;
  }
  else if (path === '/admin/verification') {
    if (!requireAuth('admin')) return;
    renderSidebar('admin');
    mainContent.style.padding = 'var(--space-8)';
    await renderAdminVerification(mainContent);
    matched = true;
  }
  else if (path === '/admin/orders') {
    if (!requireAuth('admin')) return;
    renderSidebar('admin');
    mainContent.style.padding = 'var(--space-8)';
    await renderAdminOrders(mainContent);
    matched = true;
  }
  else if (path === '/admin/disputes') {
    if (!requireAuth('admin')) return;
    renderSidebar('admin');
    mainContent.style.padding = 'var(--space-8)';
    await renderAdminDisputes(mainContent);
    matched = true;
  }
  else if (path === '/admin/users') {
    if (!requireAuth('admin')) return;
    renderSidebar('admin');
    mainContent.style.padding = 'var(--space-8)';
    await renderAdminUsers(mainContent);
    matched = true;
  }
  else if (path === '/admin/settings') {
    if (!requireAuth('admin')) return;
    renderSidebar('admin');
    mainContent.style.padding = 'var(--space-8)';
    await renderAdminSettings(mainContent);
    matched = true;
  }

  // --- 404 ---
  if (!matched) {
    clearSidebar();
    mainContent.innerHTML = `
      <div style="text-align:center;padding:var(--space-16)">
        <div style="font-size:64px;margin-bottom:var(--space-5)">🔍</div>
        <h1 style="font-size:var(--font-size-2xl);font-weight:800;margin-bottom:var(--space-3)">Page Not Found</h1>
        <p style="color:var(--color-text-secondary)">The page you're looking for doesn't exist.</p>
        <a href="#/" class="btn btn-primary" style="margin-top:var(--space-6)">Go Home</a>
      </div>
    `;
  }

  // Rebuild navbar (cart count may have changed)
  renderNavbar();
  // Update active sidebar links
  document.querySelectorAll('.sidebar-link').forEach(link => {
    const linkPath = link.getAttribute('href').replace('#','');
    link.classList.toggle('active', linkPath === path);
  });
}

function requireAuth(requiredRole = null) {
  const user = auth.getUser();
  if (!user) {
    window.location.hash = '#/login';
    return false;
  }
  if (requiredRole && user.role !== requiredRole) {
    // Redirect to appropriate dashboard
    if (user.role === 'caterer') window.location.hash = '#/caterer/orders';
    else if (user.role === 'admin') window.location.hash = '#/admin/analytics';
    else window.location.hash = '#/';
    return false;
  }
  return true;
}

// Listen for hash changes
window.addEventListener('hashchange', route);

// Listen for auth changes — rebuild navbar
window.addEventListener('auth:changed', () => {
  renderNavbar();
});

// Listen for cart changes — rebuild navbar
window.addEventListener('cart:changed', () => {
  renderNavbar();
});

// Initial boot
async function boot() {
  // Default to home if no hash
  if (!window.location.hash || window.location.hash === '#') {
    window.location.hash = '#/';
    return;
  }
  renderNavbar();
  await route();
}

boot();
