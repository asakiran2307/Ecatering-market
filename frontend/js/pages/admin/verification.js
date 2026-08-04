// pages/admin/verification.js — Caterer Verification Queue
import api from '../../api.js';
import toast from '../../components/toast.js';
import { formatDate, renderLoader, renderEmpty } from '../../utils.js';

export async function renderAdminVerification(container) {
  container.innerHTML = `
    <div class="page-header" style="margin-bottom:var(--space-6)">
      <h1 class="page-title">Caterer Verification</h1>
      <p class="page-subtitle">Review and approve new caterer applications</p>
    </div>
    <div id="verification-list">${renderLoader()}</div>
  `;

  async function load() {
    document.getElementById('verification-list').innerHTML = renderLoader();
    try {
      const caterers = await api.admin.pendingCaterers();
      const list = document.getElementById('verification-list');

      if (!caterers.length) {
        list.innerHTML = renderEmpty('✅', 'All caught up!', 'No pending caterer applications.');
        return;
      }

      list.innerHTML = caterers.map(c => `
        <div class="verification-card">
          <div class="avatar-lg" style="width:56px;height:56px;font-size:24px;flex-shrink:0">
            ${(c.business_name||'?').charAt(0)}
          </div>
          <div style="flex:1">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:var(--space-3)">
              <div>
                <div style="font-weight:800;font-size:var(--font-size-base)">${c.business_name}</div>
                <div style="color:var(--color-text-secondary);font-size:var(--font-size-sm)">${c.owner_name} · ${c.owner_email}</div>
                ${c.owner_phone ? `<div style="color:var(--color-text-muted);font-size:var(--font-size-xs)">${c.owner_phone}</div>` : ''}
              </div>
              <div style="display:flex;gap:var(--space-3)">
                <button class="btn btn-primary btn-sm verify-btn" data-id="${c.id}" data-action="approve">✓ Approve</button>
                <button class="btn btn-danger btn-sm verify-btn" data-id="${c.id}" data-action="reject">✕ Reject</button>
              </div>
            </div>
            ${c.description ? `<p style="margin-top:var(--space-3);font-size:var(--font-size-sm);color:var(--color-text-secondary)">${c.description}</p>` : ''}
            <div style="margin-top:var(--space-3);display:flex;gap:var(--space-5);font-size:var(--font-size-xs);color:var(--color-text-muted)">
              <span>📍 ${c.service_area || 'Not specified'}</span>
              <span>👥 ${c.min_guests}–${c.max_guests} guests</span>
              <span>💰 ₹${c.base_price_per_person}/person</span>
              <span>📅 Applied ${formatDate(c.created_at)}</span>
            </div>
          </div>
        </div>
      `).join('');

      document.querySelectorAll('.verify-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          const action = btn.dataset.action;
          let reason = '';
          if (action === 'reject') {
            reason = prompt('Reason for rejection (will be shared with caterer):') || '';
            if (reason === null) return; // cancelled
          }
          try {
            await api.admin.verifyCaterer(id, { action, reason });
            toast.success(`Caterer ${action === 'approve' ? 'approved' : 'rejected'}`);
            load();
          } catch (e) { toast.error(e.message); }
        });
      });
    } catch (e) {
      document.getElementById('verification-list').innerHTML = `<div class="alert alert-error"><span>✕</span> ${e.message}</div>`;
    }
  }

  load();
}
