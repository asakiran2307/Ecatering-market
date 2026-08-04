// pages/orderStatus.js
import api from '../api.js';
import auth from '../auth.js';
import toast from '../components/toast.js';
import { showModal } from '../components/modal.js';
import { formatDate, formatDateTime, formatPrice, statusBadge, renderLoader } from '../utils.js';

export async function renderOrderStatus(container, orderId) {
  container.innerHTML = renderLoader();

  let order;
  try {
    order = await api.orders.get(orderId);
  } catch (e) {
    container.innerHTML = `<div class="alert alert-error"><span class="alert-icon">✕</span>${e.message}</div>`;
    return;
  }

  const user = auth.getUser();
  const isCaterer = user?.role === 'caterer';
  const isCustomer = user?.role === 'customer';
  const isAdmin = user?.role === 'admin';

  const STATUS_FLOW = ['pending', 'accepted', 'confirmed', 'completed'];
  const currentIdx = STATUS_FLOW.indexOf(order.status);

  container.innerHTML = `
    <div class="page-content-wide">
      <div class="breadcrumb">
        <a href="${isCaterer ? '#/caterer/orders' : '#/account/orders'}">Orders</a>
        <span class="breadcrumb-sep">/</span>
        <span>Order #${order.id}</span>
      </div>

      <div class="page-header-row" style="margin-bottom:var(--space-8)">
        <div>
          <h1 class="page-title" style="font-size:var(--font-size-xl)">Order #${order.id}</h1>
          <div style="margin-top:var(--space-2);display:flex;align-items:center;gap:var(--space-4)">
            ${statusBadge(order.status)}
            <span style="font-size:var(--font-size-sm);color:var(--color-text-secondary)">Placed ${formatDateTime(order.created_at)}</span>
          </div>
        </div>
        <a href="#/orders/${order.id}/chat" class="btn btn-primary">
          💬 Open Chat
        </a>
      </div>

      <!-- Status Progress -->
      ${order.status !== 'rejected' && order.status !== 'cancelled' ? `
      <div class="card" style="margin-bottom:var(--space-6)">
        <div class="card-body">
          <div style="display:flex;align-items:center;justify-content:space-between;position:relative;">
            <div style="position:absolute;top:16px;left:10%;right:10%;height:2px;background:var(--color-border);z-index:0"></div>
            <div style="position:absolute;top:16px;left:10%;width:${Math.max(0, currentIdx) * 33}%;height:2px;background:var(--color-primary);z-index:0;transition:width 0.6s ease"></div>
            ${STATUS_FLOW.map((s, i) => `
              <div style="text-align:center;z-index:1;flex:1">
                <div style="width:32px;height:32px;border-radius:50%;margin:0 auto;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;border:2px solid ${i <= currentIdx ? 'var(--color-primary)' : 'var(--color-border)'};background:${i <= currentIdx ? 'var(--color-primary)' : 'var(--color-surface)'};color:${i <= currentIdx ? 'white' : 'var(--color-text-muted)'}">
                  ${i < currentIdx ? '✓' : i+1}
                </div>
                <div style="margin-top:var(--space-2);font-size:var(--font-size-xs);font-weight:${i===currentIdx?'700':'400'};color:${i===currentIdx?'var(--color-primary)':'var(--color-text-secondary)'}">
                  ${s.charAt(0).toUpperCase() + s.slice(1)}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      ` : `
      <div class="alert alert-${order.status === 'rejected' ? 'error' : 'warning'}" style="margin-bottom:var(--space-6)">
        <span class="alert-icon">${order.status === 'rejected' ? '✕' : '⚠️'}</span>
        This order was <strong>${order.status}</strong>.
      </div>
      `}

      <div class="grid-2" style="gap:var(--space-6)">
        <!-- Left -->
        <div style="display:flex;flex-direction:column;gap:var(--space-6)">
          <!-- Order Info -->
          <div class="card">
            <div class="card-header"><span class="font-semibold">Order Details</span></div>
            <div class="card-body">
              <div class="grid-2" style="gap:var(--space-4)">
                <div><div class="text-xs text-muted">Caterer</div><div class="font-semibold">${order.caterer_name}</div></div>
                <div><div class="text-xs text-muted">Customer</div><div class="font-semibold">${order.customer_name}</div></div>
                <div><div class="text-xs text-muted">Event Date</div><div class="font-semibold">${formatDate(order.event_date)}${order.event_time ? ' at '+order.event_time : ''}</div></div>
                <div><div class="text-xs text-muted">Guest Count</div><div class="font-semibold">${order.guest_count} guests</div></div>
                ${order.event_type ? `<div><div class="text-xs text-muted">Event Type</div><div class="font-semibold">${order.event_type}</div></div>` : ''}
              </div>
              <div style="margin-top:var(--space-4)">
                <div class="text-xs text-muted">Event Address</div>
                <div style="margin-top:4px">${order.event_address}</div>
              </div>
              ${order.special_instructions ? `
                <div style="margin-top:var(--space-4)">
                  <div class="text-xs text-muted">Special Instructions</div>
                  <div style="margin-top:4px;color:var(--color-text-secondary)">${order.special_instructions}</div>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Items -->
          <div class="card">
            <div class="card-header"><span class="font-semibold">Items Ordered</span></div>
            <div class="card-body" style="padding:0">
              <table>
                <thead><tr>
                  <th>Item</th><th>Category</th><th>Qty</th><th style="text-align:right">Price</th>
                </tr></thead>
                <tbody>
                  ${(order.items || []).map(i => `
                    <tr>
                      <td>${i.name}</td>
                      <td><span class="tag">${i.category}</span></td>
                      <td>${i.quantity}</td>
                      <td style="text-align:right;font-weight:700">₹${(i.price_at_order * i.quantity).toLocaleString('en-IN')}</td>
                    </tr>
                  `).join('')}
                  <tr style="background:var(--color-bg)">
                    <td colspan="3" style="font-weight:700">Total</td>
                    <td style="text-align:right;font-weight:800;color:var(--color-primary)">₹${order.total_cost.toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Review section (customer, completed, not reviewed) -->
          ${isCustomer && order.status === 'completed' && !order.review ? `
            <div class="card">
              <div class="card-header"><span class="font-semibold">Leave a Review</span></div>
              <div class="card-body">
                <div class="form-group">
                  <label class="form-label">Rating</label>
                  <div id="star-rating" style="display:flex;gap:var(--space-2);font-size:28px;cursor:pointer">
                    ${[1,2,3,4,5].map(s => `<span class="star" data-val="${s}" style="color:var(--color-border);transition:color var(--transition)">★</span>`).join('')}
                  </div>
                  <input type="hidden" id="rating-val" value="0" />
                </div>
                <div class="form-group">
                  <label class="form-label">Comment <span class="form-label-optional">(optional)</span></label>
                  <textarea id="review-comment" class="form-textarea" rows="3" placeholder="Share your experience…"></textarea>
                </div>
                <button class="btn btn-primary" id="submit-review-btn">Submit Review</button>
              </div>
            </div>
          ` : ''}

          ${isCustomer && order.review ? `
            <div class="card">
              <div class="card-header"><span class="font-semibold">Your Review</span></div>
              <div class="card-body">
                <div style="color:#F59E0B;font-size:20px">${'★'.repeat(order.review.rating)}${'☆'.repeat(5-order.review.rating)}</div>
                ${order.review.comment ? `<p style="margin-top:var(--space-3);color:var(--color-text-secondary)">${order.review.comment}</p>` : ''}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Right: Status History + Actions -->
        <div style="display:flex;flex-direction:column;gap:var(--space-6)">
          <!-- Actions -->
          <div class="card" id="actions-card">
            <div class="card-header"><span class="font-semibold">Actions</span></div>
            <div class="card-body" style="display:flex;flex-direction:column;gap:var(--space-3)">
              ${renderActionButtons(order, user)}
            </div>
          </div>

          <!-- Status History -->
          <div class="card">
            <div class="card-header"><span class="font-semibold">Status History</span></div>
            <div class="card-body">
              <div class="status-timeline">
                ${(order.status_history || []).map((h, idx, arr) => `
                  <div class="timeline-item">
                    ${idx < arr.length - 1 ? '<div class="timeline-line"></div>' : ''}
                    <div class="timeline-dot ${idx < arr.length - 1 ? 'timeline-dot-past' : ''}"></div>
                    <div class="timeline-content">
                      <div class="timeline-title">${h.status.charAt(0).toUpperCase()+h.status.slice(1)}
                        ${h.actor_role ? `<span class="text-xs text-muted">by ${h.actor_name || h.actor_role}</span>` : ''}
                      </div>
                      <div class="timeline-time">${formatDateTime(h.created_at)}</div>
                      ${h.note ? `<div class="timeline-note">${h.note}</div>` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Star rating
  const stars = document.querySelectorAll('.star');
  const ratingInput = document.getElementById('rating-val');
  if (stars.length) {
    stars.forEach(star => {
      star.addEventListener('mouseenter', () => {
        const val = parseInt(star.dataset.val);
        stars.forEach((s, i) => s.style.color = i < val ? '#F59E0B' : 'var(--color-border)');
      });
      star.addEventListener('mouseleave', () => {
        const current = parseInt(ratingInput?.value || 0);
        stars.forEach((s, i) => s.style.color = i < current ? '#F59E0B' : 'var(--color-border)');
      });
      star.addEventListener('click', () => {
        const val = parseInt(star.dataset.val);
        if (ratingInput) ratingInput.value = val;
        stars.forEach((s, i) => s.style.color = i < val ? '#F59E0B' : 'var(--color-border)');
      });
    });
  }

  document.getElementById('submit-review-btn')?.addEventListener('click', async () => {
    const rating = parseInt(document.getElementById('rating-val').value);
    if (!rating) { toast.error('Please select a rating'); return; }
    try {
      await api.reviews.create({ order_id: order.id, rating, comment: document.getElementById('review-comment').value.trim() });
      toast.success('Review submitted!');
      renderOrderStatus(container, orderId);
    } catch (e) { toast.error(e.message); }
  });

  // Action buttons
  document.querySelectorAll('.status-action-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const newStatus = btn.dataset.status;
      let note = '';
      if (newStatus === 'rejected' || newStatus === 'cancelled') {
        note = prompt('Optional: Add a reason?') || '';
      }
      try {
        await api.orders.updateStatus(order.id, { status: newStatus, note });
        toast.success(`Order ${newStatus}`);
        renderOrderStatus(container, orderId);
      } catch (e) { toast.error(e.message); }
    });
  });
}

function renderActionButtons(order, user) {
  const TRANSITIONS = {
    customer: { pending: ['cancelled'], accepted: ['confirmed','cancelled'], confirmed: ['cancelled'] },
    caterer:  { pending: ['accepted','rejected'], confirmed: ['completed'] },
    admin:    { pending: ['accepted','rejected','cancelled'], accepted: ['confirmed','cancelled'], confirmed: ['completed','cancelled'] },
  };

  const allowed = TRANSITIONS[user?.role]?.[order.status] || [];
  if (!allowed.length) {
    return `<p class="text-sm text-muted">No actions available for this order's current status.</p>`;
  }

  const btnMap = {
    accepted:  { label: '✓ Accept Order',    cls: 'btn-primary' },
    rejected:  { label: '✕ Reject Order',    cls: 'btn-danger' },
    confirmed: { label: '✓ Confirm Booking', cls: 'btn-primary' },
    completed: { label: '✓ Mark Completed',  cls: 'btn-primary' },
    cancelled: { label: '⚠ Cancel Order',   cls: 'btn-secondary' },
  };

  return allowed.map(s => `
    <button class="btn ${btnMap[s]?.cls || 'btn-secondary'} status-action-btn" data-status="${s}">
      ${btnMap[s]?.label || s}
    </button>
  `).join('');
}
