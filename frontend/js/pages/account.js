// pages/account.js — Customer account page
import api from '../api.js';
import auth from '../auth.js';
import toast from '../components/toast.js';
import { formatDate, formatDateTime, statusBadge, renderLoader, renderEmpty } from '../utils.js';

export async function renderAccount(container) {
  const user = auth.getUser();

  container.innerHTML = `
    <div class="page-header-row" style="margin-bottom:var(--space-8)">
      <div>
        <h1 class="page-title">My Account</h1>
        <p class="page-subtitle">Manage your profile and settings</p>
      </div>
    </div>
    <div class="tabs">
      <button class="tab-btn active" data-tab="profile">Profile</button>
      <button class="tab-btn" data-tab="security">Password</button>
      <button class="tab-btn" data-tab="orders">Order History</button>
    </div>
    <div id="tab-content">${renderLoader()}</div>
  `;

  async function loadTab(tab) {
    const content = document.getElementById('tab-content');
    content.innerHTML = renderLoader();

    if (tab === 'profile') {
      content.innerHTML = `
        <div class="card" style="max-width:520px">
          <div class="card-header"><span class="font-semibold">Profile Information</span></div>
          <div class="card-body">
            <div style="display:flex;align-items:center;gap:var(--space-5);margin-bottom:var(--space-6)">
              <div class="avatar-lg">${(user?.name||'?').charAt(0).toUpperCase()}</div>
              <div>
                <div style="font-weight:700;font-size:var(--font-size-md)">${user?.name}</div>
                <div style="color:var(--color-text-secondary);font-size:var(--font-size-sm)">${user?.email}</div>
                <span class="badge badge-accepted" style="margin-top:var(--space-1)">${user?.role}</span>
              </div>
            </div>
            <form id="profile-form">
              <div class="form-group">
                <label class="form-label" for="prof-name">Full Name</label>
                <input type="text" id="prof-name" class="form-input" value="${user?.name || ''}" />
              </div>
              <div class="form-group">
                <label class="form-label" for="prof-phone">Phone</label>
                <input type="tel" id="prof-phone" class="form-input" value="${user?.phone || ''}" placeholder="+91 98765 43210" />
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" class="form-input" value="${user?.email || ''}" disabled style="opacity:0.6" />
                <span class="form-hint">Email cannot be changed</span>
              </div>
              <button type="submit" class="btn btn-primary">Save Changes</button>
            </form>
          </div>
        </div>
      `;
      document.getElementById('profile-form').addEventListener('submit', async e => {
        e.preventDefault();
        try {
          await api.auth.updateMe({
            name: document.getElementById('prof-name').value.trim(),
            phone: document.getElementById('prof-phone').value.trim(),
          });
          await auth.refresh();
          toast.success('Profile updated');
        } catch (err) { toast.error(err.message); }
      });

    } else if (tab === 'security') {
      content.innerHTML = `
        <div class="card" style="max-width:400px">
          <div class="card-header"><span class="font-semibold">Change Password</span></div>
          <div class="card-body">
            <form id="pw-form">
              <div class="form-group">
                <label class="form-label" for="current-pw">Current Password</label>
                <input type="password" id="current-pw" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label" for="new-pw">New Password</label>
                <input type="password" id="new-pw" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label" for="confirm-pw">Confirm New Password</label>
                <input type="password" id="confirm-pw" class="form-input" />
              </div>
              <button type="submit" class="btn btn-primary">Change Password</button>
            </form>
          </div>
        </div>
      `;
      document.getElementById('pw-form').addEventListener('submit', async e => {
        e.preventDefault();
        const newPw = document.getElementById('new-pw').value;
        if (newPw !== document.getElementById('confirm-pw').value) { toast.error('Passwords do not match'); return; }
        try {
          await api.auth.changePassword({ current_password: document.getElementById('current-pw').value, new_password: newPw });
          toast.success('Password changed successfully');
          document.getElementById('pw-form').reset();
        } catch (err) { toast.error(err.message); }
      });

    } else if (tab === 'orders') {
      await renderOrderHistory(content);
    }
  }

  document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn[data-tab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadTab(btn.dataset.tab);
    });
  });

  loadTab('profile');
}

async function renderOrderHistory(container) {
  try {
    const data = await api.orders.list({ page: 1 });
    const orders = data.orders || [];

    if (!orders.length) {
      container.innerHTML = renderEmpty('📦', 'No orders yet', 'Browse caterers and place your first order!', '<a href="#/search" class="btn btn-primary">Browse Caterers</a>');
      return;
    }

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:var(--space-4)">
        ${orders.map(o => `
          <div class="order-card" data-id="${o.id}">
            <div class="order-card-header">
              <span class="order-card-id">Order #${o.id}</span>
              ${statusBadge(o.status)}
            </div>
            <div class="order-card-caterer">${o.caterer_name}</div>
            <div class="order-card-meta">
              <span class="order-card-meta-item">📅 ${formatDate(o.event_date)}</span>
              <span class="order-card-meta-item">👥 ${o.guest_count} guests</span>
              <span class="order-card-meta-item">💰 ₹${(o.total_cost||0).toLocaleString('en-IN')}</span>
              <span class="order-card-meta-item">🕐 ${formatDate(o.created_at)}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelectorAll('.order-card[data-id]').forEach(card => {
      card.addEventListener('click', () => window.location.hash = `#/orders/${card.dataset.id}`);
    });
  } catch (e) {
    container.innerHTML = `<div class="alert alert-error"><span class="alert-icon">✕</span>${e.message}</div>`;
  }
}

export { renderOrderHistory };
