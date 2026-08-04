// pages/catererProfile.js
import api from '../api.js';
import cart from '../cart.js';
import auth from '../auth.js';
import toast from '../components/toast.js';
import { formatPrice, cuisineEmoji, renderLoader, renderEmpty } from '../utils.js';

export async function renderCatererProfile(container, caterer_id) {
  container.innerHTML = renderLoader();

  let caterer;
  try {
    caterer = await api.caterers.get(caterer_id);
  } catch (e) {
    container.innerHTML = `<div class="alert alert-error"><span class="alert-icon">✕</span>${e.message}</div>`;
    return;
  }

  const cuisines = Array.isArray(caterer.cuisine_types) ? caterer.cuisine_types : [];
  const events = Array.isArray(caterer.event_types) ? caterer.event_types : [];
  const stars = Math.round(caterer.rating || 0);
  const menuCategories = caterer.menu || {};
  const reviews = caterer.reviews || [];

  container.innerHTML = `
    <div class="page-content-wide">
      <div class="breadcrumb">
        <a href="#/">Home</a>
        <span class="breadcrumb-sep">/</span>
        <a href="#/search">Browse Caterers</a>
        <span class="breadcrumb-sep">/</span>
        <span>${caterer.business_name}</span>
      </div>

      <div class="caterer-profile-layout">
        <!-- Left Column -->
        <div>
          <div class="caterer-hero">${caterer.image_url ? `<img src="${caterer.image_url}" alt="${caterer.business_name}" />` : cuisineEmoji(cuisines[0])}</div>

          <!-- Business Info -->
          <div class="card" style="margin-bottom:var(--space-6)">
            <div class="card-body">
              <div class="flex items-center justify-between" style="flex-wrap:wrap;gap:var(--space-4)">
                <div>
                  <h1 class="page-title" style="font-size:var(--font-size-xl)">${caterer.business_name}</h1>
                  <div style="display:flex;align-items:center;gap:var(--space-5);margin-top:var(--space-2);flex-wrap:wrap">
                    <div class="rating">
                      <span class="rating-stars" style="font-size:18px">${'★'.repeat(stars)}${'☆'.repeat(5-stars)}</span>
                      <span style="font-weight:700;font-size:var(--font-size-base)">${(caterer.rating||0).toFixed(1)}</span>
                      <span class="rating-count">(${caterer.review_count || 0} reviews)</span>
                    </div>
                    <span style="color:var(--color-text-secondary);font-size:var(--font-size-sm)">📍 ${caterer.service_area || '—'}</span>
                    <span style="color:var(--color-text-secondary);font-size:var(--font-size-sm)">👥 ${caterer.min_guests}–${caterer.max_guests} guests</span>
                  </div>
                </div>
                <div style="text-align:right">
                  <div class="price" style="font-size:var(--font-size-xl)">₹${caterer.base_price_per_person}</div>
                  <div class="price-unit">base price / person</div>
                </div>
              </div>

              ${caterer.description ? `<p style="margin-top:var(--space-5);color:var(--color-text-secondary);font-size:var(--font-size-sm);line-height:1.7">${caterer.description}</p>` : ''}

              <div style="margin-top:var(--space-5);display:flex;flex-wrap:wrap;gap:var(--space-3)">
                ${cuisines.map(c => `<span class="tag tag-primary">🍽 ${c}</span>`).join('')}
                ${events.map(e => `<span class="tag">📅 ${e}</span>`).join('')}
              </div>
            </div>
          </div>

          <!-- Menu -->
          <div class="card" style="margin-bottom:var(--space-6)">
            <div class="card-header">
              <h2 class="section-title" style="margin:0">Menu</h2>
              <span style="font-size:var(--font-size-sm);color:var(--color-text-muted)">Select items to add to your order</span>
            </div>
            <div class="card-body">
              ${Object.keys(menuCategories).length === 0 ? renderEmpty('🍽','No menu items yet','The caterer has not added any menu items yet.') :
                Object.entries(menuCategories).map(([category, items]) => `
                  <div class="menu-category">
                    <div class="menu-category-title">${category}</div>
                    ${items.filter(i => i.is_available).map(item => `
                      <div class="menu-item-row" id="menu-row-${item.id}">
                        ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}" class="menu-item-thumb" loading="lazy" />` : ''}
                        <div class="menu-item-info">
                          <div class="menu-item-name">${item.name}</div>
                          ${item.description ? `<div class="menu-item-desc">${item.description}</div>` : ''}
                          <div class="menu-item-price" style="margin-top:4px">₹${item.price} <span class="price-unit">${item.unit || 'per person'}</span></div>
                        </div>
                        <div class="menu-item-controls" id="controls-${item.id}" data-item-id="${item.id}">
                          <button class="btn btn-primary btn-sm add-item-btn" data-item-id="${item.id}"
                                  data-item='${JSON.stringify({id:item.id,name:item.name,price:item.price,category})}'>
                            + Add
                          </button>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                `).join('')}
            </div>
          </div>

          <!-- Reviews -->
          <div class="card">
            <div class="card-header">
              <h2 class="section-title" style="margin:0">Customer Reviews</h2>
              <span style="font-size:var(--font-size-sm);color:var(--color-text-muted)">${caterer.review_count || 0} total</span>
            </div>
            <div class="card-body">
              ${reviews.length === 0 ? renderEmpty('⭐','No reviews yet','Be the first to review after completing an order.') :
                reviews.map(r => {
                  const rs = Math.round(r.rating||0);
                  return `
                    <div style="padding:var(--space-4) 0;border-bottom:1px solid var(--color-border)">
                      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-2)">
                        <div style="font-weight:600;font-size:var(--font-size-sm)">${r.customer_name}</div>
                        <div style="color:#F59E0B;font-size:14px">${'★'.repeat(rs)}${'☆'.repeat(5-rs)}</div>
                      </div>
                      ${r.comment ? `<p style="font-size:var(--font-size-sm);color:var(--color-text-secondary)">${r.comment}</p>` : ''}
                    </div>
                  `;
                }).join('')}
            </div>
          </div>
        </div>

        <!-- Order Panel -->
        <div>
          <div class="order-panel" id="order-panel">
            <div class="order-panel-title">Your Order</div>
            <div id="order-panel-items">
              <p style="color:var(--color-text-muted);font-size:var(--font-size-sm)">Add items from the menu to get started</p>
            </div>
            <div style="margin-top:var(--space-5)">
              <div class="form-group">
                <label class="form-label" for="guest-count">Guest Count</label>
                <input type="number" id="guest-count" class="form-input" min="1" placeholder="e.g. 100" />
              </div>
            </div>
            <button class="btn btn-primary btn-full" id="view-cart-btn" style="margin-top:var(--space-4)" disabled>
              Review Order →
            </button>
            ${!auth.isLoggedIn() ? `<p style="font-size:var(--font-size-xs);color:var(--color-text-muted);text-align:center;margin-top:var(--space-3)"><a href="#/login">Sign in</a> to place an order</p>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;

  // Sync cart display
  function updateOrderPanel() {
    const cartData = cart.get();
    const items = Object.values(cartData.items || {});
    const panel = document.getElementById('order-panel-items');
    const reviewBtn = document.getElementById('view-cart-btn');

    if (!items.length) {
      panel.innerHTML = `<p style="color:var(--color-text-muted);font-size:var(--font-size-sm)">Add items from the menu to get started</p>`;
      reviewBtn.disabled = true;
    } else {
      panel.innerHTML = `
        ${items.map(i => `
          <div class="order-panel-item">
            <span>${i.name} × ${i.qty}</span>
            <span>₹${(i.price * i.qty).toLocaleString('en-IN')}</span>
          </div>
        `).join('')}
        <div class="order-panel-total">
          <span>Subtotal</span>
          <span>₹${cart.total().toLocaleString('en-IN')}</span>
        </div>
      `;
      reviewBtn.disabled = false;
    }

    // Update add buttons to show qty controls
    document.querySelectorAll('[data-item-id][id^="controls-"]').forEach(wrap => {
      const itemId = parseInt(wrap.dataset.itemId);
      const qty = cart.getQty(itemId);
      if (cartData.caterer_id && cartData.caterer_id !== caterer.id) return;
      if (qty > 0) {
        wrap.innerHTML = `
          <div class="menu-item-controls">
            <button class="qty-btn" data-action="dec" data-id="${itemId}">−</button>
            <span class="qty-display">${qty}</span>
            <button class="qty-btn" data-action="inc" data-id="${itemId}">+</button>
          </div>
        `;
      } else {
        wrap.innerHTML = `<button class="btn btn-primary btn-sm add-item-btn" data-item-id="${itemId}" data-item='${wrap.querySelector('button')?.dataset.item || '{}'}'>+ Add</button>`;
      }
    });
  }

  let catData = cart.get();
  updateOrderPanel();

  // Menu item add buttons
  document.addEventListener('click', function handler(e) {
    const addBtn = e.target.closest('.add-item-btn');
    if (addBtn) {
      if (!auth.isLoggedIn()) {
        toast.info('Please sign in to place an order');
        window.location.hash = '#/login';
        return;
      }
      const item = JSON.parse(addBtn.dataset.item || '{}');
      const changed = cart.addItem(caterer.id, caterer.business_name, item);
      if (!changed) {
        toast.warning('Your cart has items from a different caterer. Clear your cart first.');
        return;
      }
      catData = cart.get();
      updateOrderPanel();
      toast.success(`${item.name} added to order`);

      // Convert btn to qty control
      const wrap = document.getElementById(`controls-${item.id}`);
      if (wrap) {
        wrap.innerHTML = `
          <div class="menu-item-controls">
            <button class="qty-btn" data-action="dec" data-id="${item.id}">−</button>
            <span class="qty-display">1</span>
            <button class="qty-btn" data-action="inc" data-id="${item.id}">+</button>
          </div>
        `;
      }
    }

    const qtyBtn = e.target.closest('.qty-btn');
    if (qtyBtn) {
      const id = parseInt(qtyBtn.dataset.id);
      const action = qtyBtn.dataset.action;
      const current = cart.getQty(id);
      cart.setQty(id, action === 'inc' ? current + 1 : current - 1);
      catData = cart.get();
      updateOrderPanel();

      const newQty = cart.getQty(id);
      const wrap = document.getElementById(`controls-${id}`);
      if (wrap) {
        if (newQty <= 0) {
          // Find the item info from page
          const row = wrap.closest('.menu-item-row');
          const name = row?.querySelector('.menu-item-name')?.textContent || '';
          wrap.innerHTML = `<button class="btn btn-primary btn-sm add-item-btn" data-item-id="${id}" data-item='{"id":${id},"name":"${name}","price":0,"category":""}'>+ Add</button>`;
        } else {
          wrap.querySelector('.qty-display').textContent = newQty;
        }
      }
    }
  });

  // View cart
  document.getElementById('view-cart-btn').addEventListener('click', () => {
    if (!auth.isLoggedIn()) {
      toast.info('Please sign in to continue');
      window.location.hash = '#/login';
      return;
    }
    window.location.hash = '#/cart';
  });
}
