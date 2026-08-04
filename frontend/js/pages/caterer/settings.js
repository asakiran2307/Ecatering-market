// pages/caterer/settings.js — Caterer Profile & Settings
import api from '../../api.js';
import auth from '../../auth.js';
import toast from '../../components/toast.js';
import { renderLoader } from '../../utils.js';

export async function renderCatererSettings(container) {
  container.innerHTML = `
    <div class="page-header" style="margin-bottom:var(--space-6)">
      <h1 class="page-title">Profile & Settings</h1>
      <p class="page-subtitle">Manage your business profile and account settings</p>
    </div>
    <div id="settings-content">${renderLoader()}</div>
  `;

  let caterer;
  try {
    caterer = await api.caterers.myProfile();
  } catch (e) {
    document.getElementById('settings-content').innerHTML = `<div class="alert alert-error"><span>✕</span> ${e.message}</div>`;
    return;
  }

  const user = auth.getUser();
  const cuisines = Array.isArray(caterer.cuisine_types) ? caterer.cuisine_types : [];
  const eventTypes = Array.isArray(caterer.event_types) ? caterer.event_types : [];

  const verStatusColor = { approved: 'badge-approved', pending: 'badge-pending', rejected: 'badge-rejected' };

  document.getElementById('settings-content').innerHTML = `
    <div class="grid-2" style="gap:var(--space-8);align-items:start">
      <div>
        <!-- Verification Status -->
        <div class="card" style="margin-bottom:var(--space-6)">
          <div class="card-body">
            <div style="display:flex;align-items:center;gap:var(--space-5)">
              <div class="avatar-lg" style="font-size:32px">🍽</div>
              <div style="flex:1">
                <div style="font-weight:800;font-size:var(--font-size-lg)">${caterer.business_name}</div>
                <div style="color:var(--color-text-secondary);font-size:var(--font-size-sm);margin:4px 0">${user?.email}</div>
                <div>
                  Verification: <span class="badge ${verStatusColor[caterer.verification_status]}">${caterer.verification_status}</span>
                </div>
              </div>
            </div>
            ${caterer.verification_status === 'pending' ? `
              <div class="alert alert-info" style="margin-top:var(--space-5)">
                <span class="alert-icon">ℹ</span>
                Your profile is under review. You'll be notified once approved.
              </div>
            ` : ''}
            ${caterer.verification_status === 'rejected' ? `
              <div class="alert alert-error" style="margin-top:var(--space-5)">
                <span class="alert-icon">✕</span>
                <span>Application rejected. ${caterer.rejection_reason ? `Reason: ${caterer.rejection_reason}` : ''}</span>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Business Info -->
        <div class="card">
          <div class="card-header"><span class="font-semibold">Business Information</span></div>
          <div class="card-body">
            <form id="caterer-profile-form">
              <div class="form-group">
                <label class="form-label" for="biz-name">Business Name</label>
                <input type="text" id="biz-name" class="form-input" value="${caterer.business_name}" />
              </div>
              <div class="form-group">
                <label class="form-label" for="biz-desc">Description</label>
                <textarea id="biz-desc" class="form-textarea" rows="3">${caterer.description || ''}</textarea>
              </div>
              <div class="form-group">
                <label class="form-label" for="service-area">Service Area</label>
                <input type="text" id="service-area" class="form-input" value="${caterer.service_area || ''}" placeholder="e.g. Mumbai, Thane, Navi Mumbai" />
              </div>
              <div class="form-row form-row-2">
                <div class="form-group">
                  <label class="form-label" for="min-guests">Min Guests</label>
                  <input type="number" id="min-guests" class="form-input" value="${caterer.min_guests || 10}" min="1" />
                </div>
                <div class="form-group">
                  <label class="form-label" for="max-guests">Max Guests</label>
                  <input type="number" id="max-guests" class="form-input" value="${caterer.max_guests || 500}" min="1" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" for="base-price">Base Price per Person (₹)</label>
                <input type="number" id="base-price" class="form-input" value="${caterer.base_price_per_person || 0}" min="0" step="10" />
              </div>
              <div class="form-group">
                <label class="form-label">Cuisine Types</label>
                <div style="display:flex;flex-wrap:wrap;gap:var(--space-2)" id="cuisine-checkboxes">
                  ${['North Indian','South Indian','Continental','Chinese','Healthy','Street Food','Gujarati','Mughlai','Jain','Vegetarian'].map(c => `
                    <label style="display:flex;align-items:center;gap:4px;font-size:var(--font-size-sm);cursor:pointer">
                      <input type="checkbox" value="${c}" ${cuisines.includes(c)?'checked':''} class="cuisine-cb" />
                      ${c}
                    </label>
                  `).join('')}
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Event Types</label>
                <div style="display:flex;flex-wrap:wrap;gap:var(--space-2)">
                  ${['Wedding','Corporate','Birthday','Pooja','Conference','Social Gathering','Food Festival'].map(e => `
                    <label style="display:flex;align-items:center;gap:4px;font-size:var(--font-size-sm);cursor:pointer">
                      <input type="checkbox" value="${e}" ${eventTypes.includes(e)?'checked':''} class="event-cb" />
                      ${e}
                    </label>
                  `).join('')}
                </div>
              </div>
              <button type="submit" class="btn btn-primary">Save Changes</button>
            </form>
          </div>
        </div>
      </div>

      <!-- Right: Stats + Account -->
      <div style="display:flex;flex-direction:column;gap:var(--space-6)">
        <div class="card">
          <div class="card-header"><span class="font-semibold">Performance Stats</span></div>
          <div class="card-body">
            <div class="stats-grid" style="grid-template-columns:1fr 1fr">
              <div class="stat-card"><div class="stat-icon">⭐</div><div class="stat-label">Rating</div><div class="stat-value">${(caterer.rating||0).toFixed(1)}</div></div>
              <div class="stat-card"><div class="stat-icon">💬</div><div class="stat-label">Reviews</div><div class="stat-value">${caterer.review_count||0}</div></div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><span class="font-semibold">Account Settings</span></div>
          <div class="card-body">
            <form id="account-form">
              <div class="form-group">
                <label class="form-label" for="owner-name">Your Name</label>
                <input type="text" id="owner-name" class="form-input" value="${user?.name || ''}" />
              </div>
              <div class="form-group">
                <label class="form-label" for="owner-phone">Phone</label>
                <input type="tel" id="owner-phone" class="form-input" value="${user?.phone || ''}" />
              </div>
              <button type="submit" class="btn btn-secondary">Update Account</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('caterer-profile-form').addEventListener('submit', async e => {
    e.preventDefault();
    const selectedCuisines = [...document.querySelectorAll('.cuisine-cb:checked')].map(c => c.value);
    const selectedEvents = [...document.querySelectorAll('.event-cb:checked')].map(c => c.value);
    try {
      await api.caterers.updateProfile({
        business_name: document.getElementById('biz-name').value.trim(),
        description: document.getElementById('biz-desc').value.trim(),
        service_area: document.getElementById('service-area').value.trim(),
        min_guests: parseInt(document.getElementById('min-guests').value),
        max_guests: parseInt(document.getElementById('max-guests').value),
        base_price_per_person: parseFloat(document.getElementById('base-price').value),
        cuisine_types: selectedCuisines,
        event_types: selectedEvents,
      });
      toast.success('Profile saved');
    } catch (err) { toast.error(err.message); }
  });

  document.getElementById('account-form').addEventListener('submit', async e => {
    e.preventDefault();
    try {
      await api.auth.updateMe({ name: document.getElementById('owner-name').value.trim(), phone: document.getElementById('owner-phone').value.trim() });
      auth.refresh();
      toast.success('Account updated');
    } catch (err) { toast.error(err.message); }
  });
}
