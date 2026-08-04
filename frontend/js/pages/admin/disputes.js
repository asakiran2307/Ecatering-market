// pages/admin/disputes.js
import api from '../../api.js';
import toast from '../../components/toast.js';
import { formatDate, statusBadge, renderLoader, renderEmpty } from '../../utils.js';

export async function renderAdminDisputes(container) {
  container.innerHTML = `
    <div class="page-header" style="margin-bottom:var(--space-6)">
      <h1 class="page-title">Dispute Management</h1>
      <p class="page-subtitle">Review and resolve customer and caterer complaints</p>
    </div>
    <div class="filter-bar" style="margin-bottom:var(--space-6)">
      <select id="dispute-status-filter" class="filter-select">
        <option value="">All</option>
        <option value="open" selected>Open</option>
        <option value="investigating">Investigating</option>
        <option value="resolved">Resolved</option>
      </select>
    </div>
    <div id="disputes-list">${renderLoader()}</div>
  `;

  async function load() {
    const status = document.getElementById('dispute-status-filter').value;
    document.getElementById('disputes-list').innerHTML = renderLoader();
    try {
      const disputes = await api.disputes.list(status);
      if (!disputes.length) {
        document.getElementById('disputes-list').innerHTML = renderEmpty('⚖️', 'No disputes found', 'No disputes match the selected filter.');
        return;
      }
      document.getElementById('disputes-list').innerHTML = `
        <div class="table-wrapper">
          <table>
            <thead><tr>
              <th>ID</th><th>Order #</th><th>Reporter</th><th>Role</th><th>Status</th><th>Reported</th><th>Actions</th>
            </tr></thead>
            <tbody>
              ${disputes.map(d => `
                <tr>
                  <td>#${d.id}</td>
                  <td><a href="#/orders/${d.order_id}" class="text-primary-color">#${d.order_id}</a></td>
                  <td>${d.reporter_name}</td>
                  <td><span class="tag">${d.reporter_role}</span></td>
                  <td><span class="badge badge-${d.status}">${d.status}</span></td>
                  <td style="color:var(--color-text-muted)">${formatDate(d.created_at)}</td>
                  <td>
                    <button class="btn btn-secondary btn-sm view-dispute-btn" data-id="${d.id}">View</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      document.querySelectorAll('.view-dispute-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const d = disputes.find(x => x.id == btn.dataset.id);
          if (!d) return;

          const { showModal, closeModal } = await import('../../components/modal.js');
          const { close } = showModal({
            title: `Dispute #${d.id}`,
            body: `
              <div style="display:flex;flex-direction:column;gap:var(--space-4)">
                <div><strong>Order:</strong> #${d.order_id}</div>
                <div><strong>Reporter:</strong> ${d.reporter_name} (${d.reporter_role})</div>
                <div><strong>Description:</strong><p style="margin-top:var(--space-2);color:var(--color-text-secondary)">${d.description}</p></div>
                ${d.resolution ? `<div><strong>Resolution:</strong><p style="color:var(--color-text-secondary)">${d.resolution}</p></div>` : ''}
                <div class="form-group">
                  <label class="form-label" for="dispute-status-sel">Status</label>
                  <select id="dispute-status-sel" class="form-select">
                    <option value="open" ${d.status==='open'?'selected':''}>Open</option>
                    <option value="investigating" ${d.status==='investigating'?'selected':''}>Investigating</option>
                    <option value="resolved" ${d.status==='resolved'?'selected':''}>Resolved</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" for="dispute-resolution">Resolution Note</label>
                  <textarea id="dispute-resolution" class="form-textarea" rows="3">${d.resolution || ''}</textarea>
                </div>
              </div>
            `,
            footer: `
              <button class="btn btn-secondary" id="dispute-cancel">Cancel</button>
              <button class="btn btn-primary" id="dispute-save">Save</button>
            `,
          });

          document.getElementById('dispute-cancel').addEventListener('click', close);
          document.getElementById('dispute-save').addEventListener('click', async () => {
            try {
              await api.disputes.update(d.id, {
                status: document.getElementById('dispute-status-sel').value,
                resolution: document.getElementById('dispute-resolution').value.trim(),
              });
              toast.success('Dispute updated');
              close();
              load();
            } catch (e) { toast.error(e.message); }
          });
        });
      });
    } catch (e) {
      document.getElementById('disputes-list').innerHTML = `<div class="alert alert-error"><span>✕</span> ${e.message}</div>`;
    }
  }

  document.getElementById('dispute-status-filter').addEventListener('change', load);
  load();
}
