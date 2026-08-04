// pages/cart.js
import api from '../api.js';
import cart from '../cart.js';
import auth from '../auth.js';
import toast from '../components/toast.js';
import { formatDate, renderEmpty } from '../utils.js';

export async function renderCart(container) {
  function buildPage() {
    const cartData = cart.get();
    const items = Object.values(cartData.items || {});

    if (items.length === 0) {
      container.innerHTML = `
        <div class="page-content-narrow">
          ${renderEmpty('🛒', 'Your cart is empty', 'Browse caterers and add items to your order.', '<a href="#/search" class="btn btn-primary">Browse Caterers</a>')}
        </div>
      `;
      return;
    }

    const subtotal = cart.total();
    const now = new Date();
    const minDate = new Date(now.getTime() + 48 * 3600 * 1000).toISOString().split('T')[0];

    container.innerHTML = `
      <div class="page-content-narrow">
        <div class="page-header">
          <h1 class="page-title">Review Your Order</h1>
          <p class="page-subtitle">From <strong>${cartData.caterer_name}</strong></p>
        </div>

        <!-- Items -->
        <div class="card" style="margin-bottom:var(--space-6)">
          <div class="card-header">
            <span class="font-semibold">Order Items</span>
            <button class="btn btn-ghost btn-sm" id="clear-cart-btn">Clear cart</button>
          </div>
          <div class="card-body">
            ${items.map(item => `
              <div class="menu-item-row">
                <div class="menu-item-info">
                  <div class="menu-item-name">${item.name}</div>
                  <div class="menu-item-desc">₹${item.price} × ${item.qty}</div>
                </div>
                <div class="menu-item-controls">
                  <button class="qty-btn" data-action="dec" data-id="${item.id}">−</button>
                  <span class="qty-display">${item.qty}</span>
                  <button class="qty-btn" data-action="inc" data-id="${item.id}">+</button>
                  <button class="qty-btn" data-action="remove" data-id="${item.id}" style="color:var(--color-error);margin-left:4px" title="Remove">✕</button>
                </div>
                <div class="menu-item-price" style="min-width:70px;text-align:right">
                  ₹${(item.price * item.qty).toLocaleString('en-IN')}
                </div>
              </div>
            `).join('')}
            <div style="display:flex;justify-content:space-between;font-weight:700;padding-top:var(--space-4);border-top:1px solid var(--color-border);margin-top:var(--space-3)">
              <span>Items Subtotal</span>
              <span>₹${subtotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <!-- Event Details -->
        <div class="card" style="margin-bottom:var(--space-6)">
          <div class="card-header"><span class="font-semibold">Event Details</span></div>
          <div class="card-body">
            <div class="form-row form-row-2">
              <div class="form-group">
                <label class="form-label" for="guest-count">Guest Count <span style="color:var(--color-error)">*</span></label>
                <input type="number" id="guest-count" class="form-input" min="1" placeholder="e.g. 100" />
                <span class="form-hint">Minimum guests required may vary</span>
              </div>
              <div class="form-group">
                <label class="form-label" for="event-type">Event Type</label>
                <select id="event-type" class="form-select">
                  <option value="">Select type…</option>
                  ${['Wedding','Corporate','Birthday','Pooja/Ceremony','Conference','Social Gathering','Other'].map(t =>
                    `<option value="${t}">${t}</option>`
                  ).join('')}
                </select>
              </div>
            </div>
            <div class="form-row form-row-2">
              <div class="form-group">
                <label class="form-label" for="event-date">Event Date <span style="color:var(--color-error)">*</span></label>
                <input type="date" id="event-date" class="form-input" min="${minDate}" />
                <span class="form-hint">Minimum 48 hours notice required</span>
              </div>
              <div class="form-group">
                <label class="form-label" for="event-time">Event Time</label>
                <input type="time" id="event-time" class="form-input" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="event-address">Event Address <span style="color:var(--color-error)">*</span></label>
              <textarea id="event-address" class="form-textarea" rows="2" placeholder="Full address including city and pincode"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label" for="special-instructions">Special Instructions <span class="form-label-optional">(optional)</span></label>
              <textarea id="special-instructions" class="form-textarea" rows="3"
                        placeholder="Dietary restrictions, serving preferences, specific requests…"></textarea>
            </div>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="card" style="margin-bottom:var(--space-6)">
          <div class="card-header"><span class="font-semibold">Cost Summary</span></div>
          <div class="card-body">
            <div id="cost-breakdown">
              <div class="order-panel-item"><span>Items subtotal</span><span>₹${subtotal.toLocaleString('en-IN')}</span></div>
              <div class="order-panel-item" style="color:var(--color-text-muted)"><span>Service charges</span><span>₹0</span></div>
              <div class="order-panel-total"><span>Estimated Total</span><span id="total-display">₹${subtotal.toLocaleString('en-IN')}</span></div>
              <p style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin-top:var(--space-3)">
                Final price will be confirmed by the caterer. Payment is arranged directly with the caterer.
              </p>
            </div>
          </div>
        </div>

        <button class="btn btn-primary btn-full btn-lg" id="send-order-btn">Send Order Request →</button>
        <a href="#/caterers/${cartData.caterer_id}" class="btn btn-ghost btn-full" style="margin-top:var(--space-3)">← Continue Adding Items</a>
      </div>
    `;

    // Qty controls
    document.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        const action = btn.dataset.action;
        if (action === 'remove') {
          cart.removeItem(id);
        } else {
          const current = cart.getQty(id);
          cart.setQty(id, action === 'inc' ? current + 1 : current - 1);
        }
        buildPage();
      });
    });

    // Clear cart
    document.getElementById('clear-cart-btn').addEventListener('click', () => {
      cart.clear();
      buildPage();
    });

    // Send order
    document.getElementById('send-order-btn').addEventListener('click', async () => {
      const guestCount = parseInt(document.getElementById('guest-count').value);
      const eventDate = document.getElementById('event-date').value;
      const eventAddress = document.getElementById('event-address').value.trim();
      const eventTime = document.getElementById('event-time').value;
      const eventType = document.getElementById('event-type').value;
      const specialInstructions = document.getElementById('special-instructions').value.trim();

      if (!guestCount || guestCount < 1) {
        toast.error('Please enter a valid guest count');
        document.getElementById('guest-count').focus();
        return;
      }
      if (!eventDate) {
        toast.error('Please select an event date');
        document.getElementById('event-date').focus();
        return;
      }
      if (!eventAddress) {
        toast.error('Please enter the event address');
        document.getElementById('event-address').focus();
        return;
      }

      const btn = document.getElementById('send-order-btn');
      btn.textContent = 'Sending…';
      btn.classList.add('btn-loading');

      try {
        const orderItems = Object.values(cartData.items).map(i => ({
          menu_item_id: i.id,
          quantity: i.qty,
        }));

        const order = await api.orders.create({
          caterer_id: cartData.caterer_id,
          guest_count: guestCount,
          event_date: eventDate,
          event_time: eventTime,
          event_address: eventAddress,
          event_type: eventType,
          special_instructions: specialInstructions,
          items: orderItems,
        });

        cart.clear();
        toast.success('Order request sent successfully!');
        window.location.hash = `#/orders/${order.id}`;
      } catch (e) {
        toast.error(e.message);
        btn.textContent = 'Send Order Request →';
        btn.classList.remove('btn-loading');
      }
    });
  }

  buildPage();
}
