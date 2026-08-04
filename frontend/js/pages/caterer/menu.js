// pages/caterer/menu.js — Menu Management
import api from '../../api.js';
import auth from '../../auth.js';
import toast from '../../components/toast.js';
import { showModal, closeModal } from '../../components/modal.js';
import { renderLoader, renderEmpty } from '../../utils.js';

let catererId = null;

export async function renderCatererMenu(container) {
  // Get caterer ID
  try {
    const caterer = await api.caterers.myProfile();
    catererId = caterer.id;
  } catch (e) {
    container.innerHTML = `<div class="alert alert-error"><span>✕</span> ${e.message}</div>`;
    return;
  }

  container.innerHTML = `
    <div class="page-header-row" style="margin-bottom:var(--space-6)">
      <div>
        <h1 class="page-title">Menu Management</h1>
        <p class="page-subtitle">Add, edit, and manage your menu items</p>
      </div>
      <button class="btn btn-primary" id="add-item-btn">+ Add Item</button>
    </div>
    <div id="menu-container">${renderLoader()}</div>
  `;

  document.getElementById('add-item-btn').addEventListener('click', () => openItemModal(null));

  await loadMenu(container);
}

async function loadMenu(container) {
  const menuContainer = document.getElementById('menu-container');
  if (!menuContainer) return;
  menuContainer.innerHTML = renderLoader();

  try {
    const items = await api.caterers.getMenu(catererId);
    if (!items.length) {
      menuContainer.innerHTML = renderEmpty('🍽', 'No menu items', 'Add your first menu item to start accepting orders.', '<button class="btn btn-primary" onclick="document.getElementById(\'add-item-btn\').click()">Add First Item</button>');
      return;
    }

    // Group by category
    const grouped = {};
    items.forEach(i => { if (!grouped[i.category]) grouped[i.category] = []; grouped[i.category].push(i); });

    menuContainer.innerHTML = Object.entries(grouped).map(([cat, catItems]) => `
      <div style="margin-bottom:var(--space-8)">
        <div style="font-size:var(--font-size-base);font-weight:700;color:var(--color-primary);padding-bottom:var(--space-3);border-bottom:2px solid var(--color-primary);margin-bottom:var(--space-4)">${cat}</div>
        <div class="table-wrapper">
          <table>
            <thead><tr>
              <th>Item Name</th>
              <th>Description</th>
              <th>Price</th>
              <th>Unit</th>
              <th>Available</th>
              <th>Actions</th>
            </tr></thead>
            <tbody>
              ${catItems.map(item => `
                <tr>
                  <td style="font-weight:600">${item.name}</td>
                  <td style="color:var(--color-text-secondary);max-width:200px">${item.description || '—'}</td>
                  <td style="font-weight:700">₹${item.price}</td>
                  <td>${item.unit || 'per person'}</td>
                  <td>
                    <label class="toggle-wrap">
                      <label class="toggle">
                        <input type="checkbox" class="toggle-availability" data-id="${item.id}" ${item.is_available ? 'checked' : ''} />
                        <span class="toggle-slider"></span>
                      </label>
                    </label>
                  </td>
                  <td>
                    <div style="display:flex;gap:var(--space-2)">
                      <button class="btn btn-secondary btn-sm edit-item-btn" data-item='${JSON.stringify(item).replace(/'/g,"&#39;")}'>Edit</button>
                      <button class="btn btn-danger btn-sm delete-item-btn" data-id="${item.id}">Delete</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `).join('');

    // Toggle availability
    document.querySelectorAll('.toggle-availability').forEach(toggle => {
      toggle.addEventListener('change', async () => {
        try {
          await api.caterers.toggleItem(catererId, toggle.dataset.id);
          toast.info(`Item ${toggle.checked ? 'enabled' : 'disabled'}`);
        } catch (e) { toast.error(e.message); toggle.checked = !toggle.checked; }
      });
    });

    // Edit
    document.querySelectorAll('.edit-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = JSON.parse(btn.dataset.item.replace(/&#39;/g,"'"));
        openItemModal(item);
      });
    });

    // Delete
    document.querySelectorAll('.delete-item-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this item?')) return;
        try {
          await api.caterers.deleteItem(catererId, btn.dataset.id);
          toast.success('Item deleted');
          await loadMenu(null);
        } catch (e) { toast.error(e.message); }
      });
    });

  } catch (e) {
    menuContainer.innerHTML = `<div class="alert alert-error"><span>✕</span> ${e.message}</div>`;
  }
}

function openItemModal(item) {
  const isEdit = !!item;
  const CATEGORIES = ['Starters','Main Course','Rice & Breads','Accompaniments','Desserts','Beverages','Continental','South Indian','Street Food','Healthy Options','Chaat','Other'];

  const { close } = showModal({
    title: isEdit ? 'Edit Menu Item' : 'Add Menu Item',
    body: `
      <form id="item-form">
        <div class="form-group">
          <label class="form-label" for="item-name">Item Name *</label>
          <input type="text" id="item-name" class="form-input" value="${item?.name || ''}" required />
        </div>
        <div class="form-row form-row-2">
          <div class="form-group">
            <label class="form-label" for="item-category">Category *</label>
            <select id="item-category" class="form-select">
              ${CATEGORIES.map(c => `<option value="${c}" ${item?.category===c?'selected':''}>${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="item-price">Price (₹) *</label>
            <input type="number" id="item-price" class="form-input" min="0" step="0.01" value="${item?.price || ''}" required />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="item-unit">Price Unit</label>
          <select id="item-unit" class="form-select">
            ${['per person','per plate','per piece','per serving','per kg','per litre'].map(u => `<option ${item?.unit===u?'selected':''}>${u}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="item-desc">Description <span class="form-label-optional">(optional)</span></label>
          <textarea id="item-desc" class="form-textarea" rows="2">${item?.description || ''}</textarea>
        </div>
      </form>
    `,
    footer: `
      <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
      <button class="btn btn-primary" id="modal-save">${isEdit ? 'Save Changes' : 'Add Item'}</button>
    `,
  });

  document.getElementById('modal-cancel').addEventListener('click', close);
  document.getElementById('modal-save').addEventListener('click', async () => {
    const name = document.getElementById('item-name').value.trim();
    const category = document.getElementById('item-category').value;
    const price = parseFloat(document.getElementById('item-price').value);
    const unit = document.getElementById('item-unit').value;
    const description = document.getElementById('item-desc').value.trim();

    if (!name || !price) { toast.error('Name and price are required'); return; }

    const btn = document.getElementById('modal-save');
    btn.textContent = 'Saving…';
    btn.classList.add('btn-loading');

    try {
      if (isEdit) {
        await api.caterers.updateItem(catererId, item.id, { name, category, price, unit, description });
        toast.success('Item updated');
      } else {
        await api.caterers.addItem(catererId, { name, category, price, unit, description });
        toast.success('Item added');
      }
      close();
      await loadMenu(null);
    } catch (e) {
      toast.error(e.message);
      btn.textContent = isEdit ? 'Save Changes' : 'Add Item';
      btn.classList.remove('btn-loading');
    }
  });
}
