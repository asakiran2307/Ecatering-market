// pages/admin/orders.js — Platform Order Feed
import api from '../../api.js';
import { formatDate, statusBadge, renderLoader, renderEmpty, debounce } from '../../utils.js';

export async function renderAdminOrders(container) {
  container.innerHTML = `
    <div class="page-header" style="margin-bottom:var(--space-6)">
      <h1 class="page-title">All Orders</h1>
      <p class="page-subtitle">Platform-wide order feed</p>
    </div>
    <div class="filter-bar" style="margin-bottom:var(--space-6)">
      <div class="search-input-wrap" style="flex:1">
        <span class="search-icon">🔍</span>
        <input type="text" id="admin-order-search" placeholder="Search by customer or caterer…" />
      </div>
      <select id="admin-order-status" class="filter-select">
        <option value="">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="accepted">Accepted</option>
        <option value="confirmed">Confirmed</option>
        <option value="completed">Completed</option>
        <option value="rejected">Rejected</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>
    <div id="admin-orders-table">${renderLoader()}</div>
  `;

  async function load() {
    const q = document.getElementById('admin-order-search').value.trim();
    const status = document.getElementById('admin-order-status').value;
    document.getElementById('admin-orders-table').innerHTML = renderLoader();

    try {
      const data = await api.admin.orders({ ...(q ? { q } : {}), ...(status ? { status } : {}) });
      const orders = data.orders || [];

      if (!orders.length) {
        document.getElementById('admin-orders-table').innerHTML = renderEmpty('📦', 'No orders found', 'No orders match your filters.');
        return;
      }

      document.getElementById('admin-orders-table').innerHTML = `
        <div class="table-wrapper">
          <table>
            <thead><tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Caterer</th>
              <th>Event Date</th>
              <th>Guests</th>
              <th>Total</th>
              <th>Status</th>
              <th>Placed On</th>
              <th></th>
            </tr></thead>
            <tbody>
              ${orders.map(o => `
                <tr>
                  <td><strong>#${o.id}</strong></td>
                  <td>${o.customer_name}</td>
                  <td>${o.caterer_name}</td>
                  <td>${formatDate(o.event_date)}</td>
                  <td>${o.guest_count}</td>
                  <td style="font-weight:700">₹${(o.total_cost||0).toLocaleString('en-IN')}</td>
                  <td>${statusBadge(o.status)}</td>
                  <td style="color:var(--color-text-muted)">${formatDate(o.created_at)}</td>
                  <td>
                    <a href="#/orders/${o.id}" class="btn btn-ghost btn-sm">View</a>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div style="margin-top:var(--space-4);font-size:var(--font-size-sm);color:var(--color-text-muted)">
          Showing ${orders.length} of ${data.total} orders
        </div>
      `;
    } catch (e) {
      document.getElementById('admin-orders-table').innerHTML = `<div class="alert alert-error"><span>✕</span> ${e.message}</div>`;
    }
  }

  const debouncedLoad = debounce(load, 350);
  document.getElementById('admin-order-search').addEventListener('input', debouncedLoad);
  document.getElementById('admin-order-status').addEventListener('change', load);
  load();
}
