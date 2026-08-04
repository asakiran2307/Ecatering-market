// pages/home.js
import api from '../api.js';
import { formatRating, formatPrice, cuisineEmoji } from '../utils.js';

export async function renderHome(container) {
  container.innerHTML = `
    <section class="hero" role="banner">
      <div class="hero-content">
        <h1 class="hero-title">Book the Perfect Catering<br/>for Every Occasion</h1>
        <p class="hero-subtitle">Connect with verified local caterers. Browse menus, compare prices, and place your order — all in one place.</p>
        <div class="hero-search">
          <input type="text" id="hero-search-q" placeholder="Search caterers (e.g. 'wedding caterer')" />
          <input type="text" id="hero-search-loc" placeholder="Location (e.g. Mumbai)" />
          <button id="hero-search-btn" class="btn btn-primary">Search</button>
        </div>
        <div class="hero-stats">
          <div class="hero-stat">
            <span class="hero-stat-value" id="stat-caterers">—</span>
            <span class="hero-stat-label">Verified Caterers</span>
          </div>
          <div class="hero-stat">
            <span class="hero-stat-value" id="stat-cities">8</span>
            <span class="hero-stat-label">Cities Covered</span>
          </div>
          <div class="hero-stat">
            <span class="hero-stat-value" id="stat-orders">—</span>
            <span class="hero-stat-label">Orders Placed</span>
          </div>
        </div>
      </div>
    </section>

    <div class="page-content" style="padding: 0 var(--space-8);">
      <!-- Categories -->
      <section style="padding: var(--space-10) 0 var(--space-6);">
        <h2 class="section-title">Browse by Cuisine</h2>
        <div class="category-list" id="category-list">
          ${['🍛 North Indian','🌿 South Indian','🍽 Continental','🥢 Chinese','🥗 Healthy','🌮 Street Food','🍡 Gujarati','🍖 Mughlai'].map(c => `
            <button class="category-pill" data-cuisine="${c.split(' ').slice(1).join(' ')}">${c}</button>
          `).join('')}
        </div>
      </section>

      <!-- Featured Caterers -->
      <section style="padding: var(--space-6) 0;">
        <div class="page-header-row" style="margin-bottom:var(--space-5)">
          <h2 class="section-title" style="margin:0">Featured Caterers</h2>
          <a href="#/search" class="btn btn-secondary btn-sm">View all →</a>
        </div>
        <div class="caterer-grid" id="featured-grid">
          ${[1,2,3].map(() => `<div class="card" style="height:280px;background:var(--color-bg);animation:pulse 1.5s infinite;"></div>`).join('')}
        </div>
      </section>

      <!-- How It Works -->
      <section style="padding: var(--space-10) 0; border-top: 1px solid var(--color-border); margin-top: var(--space-8);">
        <h2 class="section-title" style="text-align:center;margin-bottom:var(--space-8)">How Ecatring Works</h2>
        <div class="grid-3" style="gap:var(--space-8)">
          ${[
            { icon: '🔍', step: '1', title: 'Search & Browse', desc: 'Find caterers by location, cuisine type, or event. Compare menus, prices, and reviews.' },
            { icon: '🛒', step: '2', title: 'Build Your Order', desc: 'Select menu items, specify guest count and event details, then send your order request.' },
            { icon: '✅', step: '3', title: 'Confirm & Relax', desc: 'Chat directly with the caterer, confirm details, and enjoy your perfectly catered event.' },
          ].map(h => `
            <div style="text-align:center;padding:var(--space-6)">
              <div style="font-size:40px;margin-bottom:var(--space-4)">${h.icon}</div>
              <div style="display:inline-block;background:var(--color-primary);color:white;width:24px;height:24px;border-radius:50%;font-size:12px;font-weight:700;line-height:24px;text-align:center;margin-bottom:var(--space-3)">${h.step}</div>
              <h3 style="font-size:var(--font-size-base);font-weight:700;margin-bottom:var(--space-2)">${h.title}</h3>
              <p style="font-size:var(--font-size-sm);color:var(--color-text-secondary);line-height:1.6">${h.desc}</p>
            </div>
          `).join('')}
        </div>
      </section>
    </div>
  `;

  // Hero search
  document.getElementById('hero-search-btn').addEventListener('click', () => {
    const q = document.getElementById('hero-search-q').value.trim();
    const loc = document.getElementById('hero-search-loc').value.trim();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (loc) params.set('location', loc);
    window.location.hash = '#/search?' + params.toString();
  });
  ['hero-search-q','hero-search-loc'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('hero-search-btn').click();
    });
  });

  // Category pills
  document.querySelectorAll('.category-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const cuisine = pill.dataset.cuisine;
      window.location.hash = `#/search?cuisine=${encodeURIComponent(cuisine)}`;
    });
  });

  // Load featured caterers
  try {
    const caterers = await api.caterers.featured();
    document.getElementById('stat-caterers').textContent = caterers.length + '+';
    document.getElementById('stat-orders').textContent = '500+';

    const grid = document.getElementById('featured-grid');
    if (!caterers.length) {
      grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🍽</div><p class="empty-state-title">No caterers yet</p><p class="empty-state-desc">Be the first to join!</p></div>`;
      return;
    }
    grid.innerHTML = caterers.map(c => renderCatererCard(c)).join('');
    grid.querySelectorAll('.caterer-card').forEach(card => {
      card.addEventListener('click', () => {
        window.location.hash = `#/caterers/${card.dataset.id}`;
      });
    });
  } catch (e) {
    document.getElementById('featured-grid').innerHTML = `
      <div class="alert alert-warning" style="grid-column:1/-1">
        <span class="alert-icon">⚠️</span>
        Could not load caterers. Make sure the backend is running on port 5000.
      </div>
    `;
  }
}

function renderCatererCard(c) {
  const cuisines = Array.isArray(c.cuisine_types) ? c.cuisine_types : [];
  const emoji = cuisineEmoji(cuisines[0]);

  // Fallback catering image if URL is missing or fails to load
  const defaultImg = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80';
  const src = c.image_url || defaultImg;

  const imgContent = `<img src="${src}" alt="${c.business_name}" loading="eager" decoding="async" onload="this.classList.add('loaded')" onerror="this.onerror=null; this.src='${defaultImg}'; this.classList.add('loaded');" />`;

  return `
    <div class="card caterer-card card-interactive" data-id="${c.id}" role="button" tabindex="0"
         aria-label="View ${c.business_name}">
      <div class="caterer-card-img">${imgContent}</div>
      <div class="caterer-card-body">
        <div class="caterer-card-name">${c.business_name}</div>
        <div class="caterer-card-area">📍 ${c.service_area || 'Location not specified'}</div>
        <div class="caterer-card-tags">
          ${cuisines.slice(0,3).map(cu => `<span class="tag tag-primary">${cu}</span>`).join('')}
        </div>
      </div>
      <div class="caterer-card-footer">
        <div class="rating">
          <span class="rating-stars">${'★'.repeat(Math.round(c.rating || 0))}${'☆'.repeat(5 - Math.round(c.rating || 0))}</span>
          <span class="rating-count">(${c.review_count || 0})</span>
        </div>
        <div class="price">
          ₹${c.base_price_per_person || 0}
          <span class="price-unit">/person</span>
        </div>
      </div>
    </div>
  `;
}

export { renderCatererCard };
