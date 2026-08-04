// pages/caterer/orders.js — Incoming Orders
import api from '../../api.js';
import toast from '../../components/toast.js';
import { formatDate, formatDateTime, statusBadge, renderLoader, renderEmpty } from '../../utils.js';

export async function renderCatererOrders(container) {
  container.innerHTML = `
    <div class="page-header-row" style="margin-bottom:var(--space-6)">
      <div>
        <h1 class="page-title">Incoming Orders</h1>
        <p class="page-subtitle">Manage all order requests from customers</p>
      </div>
    </div>
    <div class="filter-bar" style="margin-bottom:var(--space-6)">
      <span class="filter-bar-label">Filter</span>
      <select id="status-filter" class="filter-select">
        <option value="">All Orders</option>
        <option value="pending" selected>Pending</option>
        <option value="accepted">Accepted</option>
        <option value="confirmed">Confirmed</option>
        <option value="completed">Completed</option>
        <option value="rejected">Rejected</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>
    <div id="orders-container">${renderLoader()}</div>
  `;

  async function loadOrders() {
    const status = document.getElementById('status-filter').value;
    document.getElementById('orders-container').innerHTML = renderLoader();
    try {
      const data = await api.orders.list({ ...(status ? { status } : {}) });
      const orders = data.orders || [];

      if (!orders.length) {
        document.getElementById('orders-container').innerHTML = renderEmpty('📋', 'No orders found', 'New order requests will appear here.');
        return;
      }

      document.getElementById('orders-container').innerHTML = `
        <div class="table-wrapper">
          <table>
            <thead><tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Event Date</th>
              <th>Guests</th>
              <th>Total</th>
              <th>Status</th>
              <th>Placed On</th>
              <th>Actions</th>
            </tr></thead>
            <tbody>
              ${orders.map(o => `
                <tr>
                  <td><a href="#/orders/${o.id}" style="font-weight:700;color:var(--color-primary)">#${o.id}</a></td>
                  <td>${o.customer_name}</td>
                  <td>${formatDate(o.event_date)}</td>
                  <td>${o.guest_count}</td>
                  <td style="font-weight:700">₹${(o.total_cost||0).toLocaleString('en-IN')}</td>
                  <td>${statusBadge(o.status)}</td>
                  <td style="color:var(--color-text-muted)">${formatDate(o.created_at)}</td>
                  <td>
                    <div style="display:flex;gap:var(--space-2);flex-wrap:wrap">
                      ${o.status === 'pending' ? `
                        <button class="btn btn-primary btn-sm" data-action="accepted" data-id="${o.id}">Accept</button>
                        <button class="btn btn-danger btn-sm" data-action="rejected" data-id="${o.id}">Reject</button>
                      ` : ''}
                      ${o.status === 'confirmed' ? `
                        <button class="btn btn-primary btn-sm" data-action="completed" data-id="${o.id}">Complete</button>
                      ` : ''}
                      <a href="#/orders/${o.id}/chat" class="btn btn-secondary btn-sm">Chat</a>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      document.querySelectorAll('[data-action][data-id]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const status = btn.dataset.action;
          const id = btn.dataset.id;
          let note = '';
          if (status === 'rejected') note = prompt('Reason for rejection (optional)?') || '';
          try {
            await api.orders.updateStatus(id, { status, note });
            toast.success(`Order ${status}`);
            loadOrders();
          } catch (e) { toast.error(e.message); }
        });
      });
    } catch (e) {
      document.getElementById('orders-container').innerHTML = `<div class="alert alert-error"><span class="alert-icon">✕</span>${e.message}</div>`;
    }
  }

  document.getElementById('status-filter').addEventListener('change', loadOrders);
  loadOrders();
}
