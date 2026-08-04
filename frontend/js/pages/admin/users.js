// pages/admin/users.js — User Management
import api from '../../api.js';
import toast from '../../components/toast.js';
import { formatDate, renderLoader, renderEmpty, debounce } from '../../utils.js';

export async function renderAdminUsers(container) {
  container.innerHTML = `
    <div class="page-header" style="margin-bottom:var(--space-6)">
      <h1 class="page-title">User Management</h1>
      <p class="page-subtitle">View, suspend, or ban platform accounts</p>
    </div>
    <div class="filter-bar" style="margin-bottom:var(--space-6)">
      <div class="search-input-wrap" style="flex:1">
        <span class="search-icon">🔍</span>
        <input type="text" id="user-search" placeholder="Search by name or email…" />
      </div>
      <select id="user-role-filter" class="filter-select">
        <option value="">All Roles</option>
        <option value="customer">Customers</option>
        <option value="caterer">Caterers</option>
      </select>
    </div>
    <div id="users-table">${renderLoader()}</div>
  `;

  async function load() {
    const q = document.getElementById('user-search').value.trim();
    const role = document.getElementById('user-role-filter').value;
    document.getElementById('users-table').innerHTML = renderLoader();
    try {
      const data = await api.admin.users({ ...(q ? { q } : {}), ...(role ? { role } : {}) });
      const users = data.users || [];
      if (!users.length) {
        document.getElementById('users-table').innerHTML = renderEmpty('👥', 'No users found', 'No users match your search.');
        return;
      }
      document.getElementById('users-table').innerHTML = `
        <div class="table-wrapper">
          <table>
            <thead><tr>
              <th>Name</th><th>Email</th><th>Role</th><th>Phone</th><th>Joined</th><th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody>
              ${users.map(u => `
                <tr>
                  <td style="font-weight:600">${u.name}</td>
                  <td>${u.email}</td>
                  <td><span class="tag">${u.role}</span></td>
                  <td>${u.phone || '—'}</td>
                  <td style="color:var(--color-text-muted)">${formatDate(u.created_at)}</td>
                  <td>
                    <span class="badge ${u.is_active ? 'badge-confirmed' : 'badge-rejected'}">
                      ${u.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td>
                    ${u.role !== 'admin' ? `
                      <button class="btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-primary'} toggle-user-btn"
                              data-id="${u.id}" data-active="${u.is_active}">
                        ${u.is_active ? 'Suspend' : 'Reactivate'}
                      </button>
                    ` : '<span class="text-muted text-xs">Protected</span>'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div style="margin-top:var(--space-3);font-size:var(--font-size-sm);color:var(--color-text-muted)">
          ${users.length} of ${data.total} users
        </div>
      `;

      document.querySelectorAll('.toggle-user-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const isActive = btn.dataset.active === '1' || btn.dataset.active === 'true';
          const msg = isActive
            ? 'Suspend this user? They will not be able to log in.'
            : 'Reactivate this user?';
          if (!confirm(msg)) return;
          try {
            await api.admin.updateUserStatus(btn.dataset.id, { is_active: !isActive });
            toast.success(`User ${isActive ? 'suspended' : 'reactivated'}`);
            load();
          } catch (e) { toast.error(e.message); }
        });
      });
    } catch (e) {
      document.getElementById('users-table').innerHTML = `<div class="alert alert-error"><span>✕</span> ${e.message}</div>`;
    }
  }

  const debouncedLoad = debounce(load, 350);
  document.getElementById('user-search').addEventListener('input', debouncedLoad);
  document.getElementById('user-role-filter').addEventListener('change', load);
  load();
}
