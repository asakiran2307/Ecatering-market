// pages/search.js
import api from '../api.js';
import { statusBadge, cuisineEmoji, renderEmpty, renderLoader, debounce } from '../utils.js';

export async function renderSearch(container, params) {
  const q = params.get('q') || '';
  const location = params.get('location') || '';
  const cuisine = params.get('cuisine') || '';

  container.innerHTML = `
    <div class="page-content">
      <div class="page-header">
        <h1 class="page-title">Find a Caterer</h1>
        <p class="page-subtitle">Discover verified catering businesses near you</p>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <span class="filter-bar-label">Filters</span>
        <div class="search-bar" style="flex:1">
          <div class="search-input-wrap" style="flex:2">
            <span class="search-icon">🔍</span>
            <input type="text" id="filter-q" value="${q}" placeholder="Search caterers…" />
          </div>
          <div class="search-input-wrap" style="flex:1">
            <span class="search-icon">📍</span>
            <input type="text" id="filter-location" value="${location}" placeholder="City…" />
          </div>
        </div>
        <select id="filter-cuisine" class="filter-select">
          <option value="">All Cuisines</option>
          ${['North Indian','South Indian','Continental','Chinese','Healthy','Street Food','Gujarati','Mughlai','Jain'].map(c =>
            `<option value="${c}" ${cuisine===c?'selected':''}>${c}</option>`
          ).join('')}
        </select>
        <select id="filter-sort" class="filter-select">
          <option value="rating">Top Rated</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="newest">Newest</option>
          <option value="reviews">Most Reviews</option>
        </select>
        <select id="filter-min-rating" class="filter-select">
          <option value="">Any Rating</option>
          <option value="4">4+ Stars</option>
          <option value="4.5">4.5+ Stars</option>
        </select>
      </div>

      <!-- Results -->
      <div id="search-results-info" style="font-size:var(--font-size-sm);color:var(--color-text-secondary);margin-bottom:var(--space-5)"></div>
      <div class="caterer-grid" id="search-results">${renderLoader()}</div>
      <div id="search-pagination"></div>
    </div>
  `;

  let currentPage = 1;

  async function load() {
    const q = document.getElementById('filter-q').value.trim();
    const location = document.getElementById('filter-location').value.trim();
    const cuisine = document.getElementById('filter-cuisine').value;
    const sort = document.getElementById('filter-sort').value;
    const minRating = document.getElementById('filter-min-rating').value;

    document.getElementById('search-results').innerHTML = renderLoader();
    document.getElementById('search-results-info').textContent = '';

    try {
      const data = await api.caterers.list({
        q, location, cuisine, sort,
        ...(minRating ? { min_rating: minRating } : {}),
        page: currentPage
      });

      const { caterers, total, pages } = data;

      document.getElementById('search-results-info').textContent =
        `${total} caterer${total !== 1 ? 's' : ''} found${q ? ` for "${q}"` : ''}`;

      if (!caterers.length) {
        document.getElementById('search-results').innerHTML = renderEmpty('🔍', 'No caterers found', 'Try adjusting your filters or search in a different city.', `<a href="#/search" class="btn btn-secondary">Clear filters</a>`);
        document.getElementById('search-pagination').innerHTML = '';
        return;
      }

      document.getElementById('search-results').innerHTML = caterers.map(c => {
        const cuisines = Array.isArray(c.cuisine_types) ? c.cuisine_types : [];
        const emoji = cuisineEmoji(cuisines[0]);
        const defaultImg = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80';
        const src = c.image_url || defaultImg;
        const imgContent = `<img src="${src}" alt="${c.business_name}" loading="lazy" crossorigin="anonymous" onerror="this.onerror=null; this.src='${defaultImg}';" />`;
        const stars = Math.round(c.rating || 0);
        return `
          <div class="card caterer-card card-interactive" data-id="${c.id}" role="button" tabindex="0">
            <div class="caterer-card-img">${imgContent}</div>
            <div class="caterer-card-body">
              <div class="caterer-card-name">${c.business_name}</div>
              <div class="caterer-card-area">📍 ${c.service_area || '—'}</div>
              <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin-top:4px;line-height:1.4">
                ${(c.description || '').substring(0, 80)}${(c.description || '').length > 80 ? '…' : ''}
              </div>
              <div class="caterer-card-tags" style="margin-top:var(--space-3)">
                ${cuisines.slice(0,3).map(cu => `<span class="tag tag-primary">${cu}</span>`).join('')}
              </div>
            </div>
            <div class="caterer-card-footer">
              <div class="rating">
                <span class="rating-stars">${'★'.repeat(stars)}${'☆'.repeat(5-stars)}</span>
                <span class="rating-count">(${c.review_count || 0})</span>
              </div>
              <div class="price">₹${c.base_price_per_person || 0} <span class="price-unit">/person</span></div>
            </div>
          </div>
        `;
      }).join('');

      // Pagination
      if (pages > 1) {
        let paginationHTML = `<div class="pagination">`;
        if (currentPage > 1) paginationHTML += `<button class="page-btn" id="page-prev">←</button>`;
        for (let p = 1; p <= pages; p++) {
          paginationHTML += `<button class="page-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
        }
        if (currentPage < pages) paginationHTML += `<button class="page-btn" id="page-next">→</button>`;
        paginationHTML += '</div>';
        document.getElementById('search-pagination').innerHTML = paginationHTML;

        document.getElementById('page-prev')?.addEventListener('click', () => { currentPage--; load(); });
        document.getElementById('page-next')?.addEventListener('click', () => { currentPage++; load(); });
        document.querySelectorAll('[data-page]').forEach(btn => {
          btn.addEventListener('click', () => { currentPage = parseInt(btn.dataset.page); load(); });
        });
      } else {
        document.getElementById('search-pagination').innerHTML = '';
      }

      // Card clicks
      document.querySelectorAll('.caterer-card[data-id]').forEach(card => {
        card.addEventListener('click', () => window.location.hash = `#/caterers/${card.dataset.id}`);
        card.addEventListener('keydown', e => { if (e.key === 'Enter') card.click(); });
      });

    } catch (e) {
      document.getElementById('search-results').innerHTML = `<div class="alert alert-error" style="grid-column:1/-1"><span class="alert-icon">✕</span>${e.message}</div>`;
    }
  }

  const debouncedLoad = debounce(() => { currentPage = 1; load(); }, 350);
  document.getElementById('filter-q').addEventListener('input', debouncedLoad);
  document.getElementById('filter-location').addEventListener('input', debouncedLoad);
  document.getElementById('filter-cuisine').addEventListener('change', () => { currentPage=1; load(); });
  document.getElementById('filter-sort').addEventListener('change', () => { currentPage=1; load(); });
  document.getElementById('filter-min-rating').addEventListener('change', () => { currentPage=1; load(); });

  load();
}
