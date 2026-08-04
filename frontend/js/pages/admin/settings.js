// pages/admin/settings.js — Platform Settings
import api from '../../api.js';
import toast from '../../components/toast.js';
import { renderLoader } from '../../utils.js';

export async function renderAdminSettings(container) {
  container.innerHTML = `
    <div class="page-header" style="margin-bottom:var(--space-6)">
      <h1 class="page-title">Platform Settings</h1>
      <p class="page-subtitle">Configure global platform behavior</p>
    </div>
    <div id="settings-form-area">${renderLoader()}</div>
  `;

  try {
    const rows = await api.admin.getSettings();
    const settings = {};
    rows.forEach(r => settings[r.key] = r.value);

    // Parse cities
    let cities = [];
    try { cities = JSON.parse(settings.supported_cities || '[]'); } catch {}

    let featuredIds = [];
    try { featuredIds = JSON.parse(settings.featured_caterer_ids || '[]'); } catch {}

    document.getElementById('settings-form-area').innerHTML = `
      <div class="grid-2" style="gap:var(--space-6);align-items:start">
        <div>
          <div class="card" style="margin-bottom:var(--space-6)">
            <div class="card-header"><span class="font-semibold">Commission & Fees</span></div>
            <div class="card-body">
              <div class="form-group">
                <label class="form-label" for="commission-rate">Commission Rate (%)</label>
                <input type="number" id="commission-rate" class="form-input" value="${settings.commission_rate || 10}" min="0" max="50" step="0.5" />
                <span class="form-hint">Percentage of order value taken as platform commission</span>
              </div>
              <div class="form-group">
                <label class="form-label" for="min-notice-hours">Minimum Order Notice (hours)</label>
                <input type="number" id="min-notice-hours" class="form-input" value="${settings.min_order_notice_hours || 48}" min="0" />
              </div>
              <div class="form-group">
                <label class="form-label" for="max-guest-count">Maximum Guest Count</label>
                <input type="number" id="max-guest-count" class="form-input" value="${settings.max_guest_count || 5000}" min="1" />
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><span class="font-semibold">Supported Cities</span></div>
            <div class="card-body">
              <div id="cities-list" style="display:flex;flex-wrap:wrap;gap:var(--space-2);margin-bottom:var(--space-4)">
                ${cities.map(city => `
                  <span class="tag" style="gap:var(--space-2)">
                    ${city}
                    <button onclick="this.parentElement.remove()" style="border:none;background:none;cursor:pointer;font-size:12px;color:var(--color-text-muted)">×</button>
                  </span>
                `).join('')}
              </div>
              <div style="display:flex;gap:var(--space-3)">
                <input type="text" id="new-city" class="form-input" placeholder="Add city…" style="flex:1" />
                <button class="btn btn-secondary" id="add-city-btn">Add</button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div class="card" style="margin-bottom:var(--space-6)">
            <div class="card-header"><span class="font-semibold">Featured Caterers</span></div>
            <div class="card-body">
              <div class="form-group">
                <label class="form-label" for="featured-ids">Featured Caterer IDs</label>
                <input type="text" id="featured-ids" class="form-input" value="${featuredIds.join(', ')}"
                       placeholder="e.g. 1, 2, 3" />
                <span class="form-hint">Comma-separated caterer IDs to feature on the home page. Leave empty to auto-select top-rated.</span>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><span class="font-semibold">Platform Info</span></div>
            <div class="card-body">
              <div class="form-group">
                <label class="form-label" for="platform-name">Platform Name</label>
                <input type="text" id="platform-name" class="form-input" value="${settings.platform_name || 'Ecatring'}" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style="margin-top:var(--space-8)">
        <button class="btn btn-primary btn-lg" id="save-settings-btn">Save All Settings</button>
      </div>
    `;

    document.getElementById('add-city-btn').addEventListener('click', () => {
      const input = document.getElementById('new-city');
      const city = input.value.trim();
      if (!city) return;
      const list = document.getElementById('cities-list');
      const el = document.createElement('span');
      el.className = 'tag';
      el.style.gap = 'var(--space-2)';
      el.innerHTML = `${city}<button onclick="this.parentElement.remove()" style="border:none;background:none;cursor:pointer;font-size:12px;color:var(--color-text-muted)">×</button>`;
      list.appendChild(el);
      input.value = '';
    });
    document.getElementById('new-city').addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('add-city-btn').click();
    });

    document.getElementById('save-settings-btn').addEventListener('click', async () => {
      const btn = document.getElementById('save-settings-btn');
      btn.textContent = 'Saving…';
      btn.classList.add('btn-loading');

      const updatedCities = [...document.querySelectorAll('#cities-list .tag')].map(el =>
        el.textContent.trim().replace('×','').trim()
      ).filter(Boolean);

      const rawIds = document.getElementById('featured-ids').value;
      const featIds = rawIds.split(',').map(x => parseInt(x.trim())).filter(n => !isNaN(n));

      try {
        await api.admin.updateSettings({
          commission_rate: document.getElementById('commission-rate').value,
          min_order_notice_hours: document.getElementById('min-notice-hours').value,
          max_guest_count: document.getElementById('max-guest-count').value,
          platform_name: document.getElementById('platform-name').value.trim(),
          supported_cities: updatedCities,
          featured_caterer_ids: featIds,
        });
        toast.success('Settings saved');
      } catch (e) { toast.error(e.message); }
      finally {
        btn.textContent = 'Save All Settings';
        btn.classList.remove('btn-loading');
      }
    });
  } catch (e) {
    document.getElementById('settings-form-area').innerHTML = `<div class="alert alert-error"><span>✕</span> ${e.message}</div>`;
  }
}
