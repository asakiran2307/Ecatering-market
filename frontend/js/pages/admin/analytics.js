// pages/admin/analytics.js
import api from '../../api.js';
import { renderLoader } from '../../utils.js';

export async function renderAdminAnalytics(container) {
  container.innerHTML = `
    <div class="page-header" style="margin-bottom:var(--space-6)">
      <h1 class="page-title">Analytics Dashboard</h1>
      <p class="page-subtitle">Platform performance overview</p>
    </div>
    <div id="analytics-content">${renderLoader()}</div>
  `;

  try {
    const d = await api.admin.analytics();

    document.getElementById('analytics-content').innerHTML = `
      <!-- KPI Stats -->
      <div class="stats-grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));margin-bottom:var(--space-8)">
        <div class="stat-card"><div class="stat-icon">📦</div><div class="stat-label">Total Orders</div><div class="stat-value">${d.total_orders}</div></div>
        <div class="stat-card"><div class="stat-icon">⏳</div><div class="stat-label">Pending Orders</div><div class="stat-value">${d.pending_orders}</div></div>
        <div class="stat-card"><div class="stat-icon">✅</div><div class="stat-label">Completed Orders</div><div class="stat-value">${d.completed_orders}</div></div>
        <div class="stat-card"><div class="stat-icon">💰</div><div class="stat-label">Total GMV</div><div class="stat-value" style="font-size:var(--font-size-xl)">₹${(d.gmv||0).toLocaleString('en-IN')}</div></div>
        <div class="stat-card"><div class="stat-icon">🤝</div><div class="stat-label">Commission Earned</div><div class="stat-value" style="font-size:var(--font-size-xl)">₹${(d.commission_earned||0).toLocaleString('en-IN')}</div></div>
        <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-label">Active Customers</div><div class="stat-value">${d.total_customers}</div></div>
        <div class="stat-card"><div class="stat-icon">🍽</div><div class="stat-label">Active Caterers</div><div class="stat-value">${d.total_caterers}</div></div>
        <div class="stat-card"><div class="stat-icon">⚠️</div><div class="stat-label">Open Disputes</div><div class="stat-value" style="color:${d.open_disputes>0?'var(--color-error)':'inherit'}">${d.open_disputes}</div></div>
      </div>

      <div class="grid-2" style="gap:var(--space-6);margin-bottom:var(--space-6)">
        <!-- Status Breakdown -->
        <div class="card">
          <div class="card-header"><span class="font-semibold">Orders by Status</span></div>
          <div class="card-body">
            <div class="bar-chart">
              ${(d.status_breakdown||[]).map(s => {
                const pct = d.total_orders ? Math.round(s.cnt / d.total_orders * 100) : 0;
                return `
                  <div class="bar-row">
                    <span class="bar-label">${s.status}</span>
                    <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
                    <span class="bar-value">${s.cnt} (${pct}%)</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- Daily Revenue (Last 7 Days) -->
        <div class="card">
          <div class="card-header"><span class="font-semibold">Revenue — Last 7 Days</span></div>
          <div class="card-body">
            ${(d.daily_revenue||[]).length === 0 ? '<p style="color:var(--color-text-muted)">No revenue data yet</p>' : ''}
            <div class="bar-chart">
              ${(d.daily_revenue||[]).map(day => {
                const maxRev = Math.max(...(d.daily_revenue||[]).map(x=>x.revenue), 1);
                const pct = Math.round(day.revenue / maxRev * 100);
                return `
                  <div class="bar-row">
                    <span class="bar-label">${day.day}</span>
                    <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:var(--color-accent)"></div></div>
                    <span class="bar-value">₹${Math.round(day.revenue).toLocaleString('en-IN')}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Top Caterers -->
      <div class="card">
        <div class="card-header"><span class="font-semibold">Top Caterers by Revenue</span></div>
        <div style="overflow-x:auto">
          <table>
            <thead><tr>
              <th>Business Name</th><th>Rating</th><th>Reviews</th><th>Orders</th><th>Total Revenue</th>
            </tr></thead>
            <tbody>
              ${(d.top_caterers||[]).map((c, i) => `
                <tr>
                  <td><span style="color:var(--color-text-muted);margin-right:8px">#${i+1}</span><strong>${c.business_name}</strong></td>
                  <td><span style="color:#F59E0B">★</span> ${(c.rating||0).toFixed(1)}</td>
                  <td>${c.review_count||0}</td>
                  <td>${c.order_count||0}</td>
                  <td style="font-weight:700">₹${(c.revenue||0).toLocaleString('en-IN')}</td>
                </tr>
              `).join('')}
              ${!(d.top_caterers||[]).length ? `<tr><td colspan="5" style="text-align:center;color:var(--color-text-muted)">No data yet</td></tr>` : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (e) {
    document.getElementById('analytics-content').innerHTML = `<div class="alert alert-error"><span>✕</span> ${e.message}</div>`;
  }
}
