// pages/signup.js
import api from '../api.js';
import auth from '../auth.js';
import toast from '../components/toast.js';

const CUISINE_OPTIONS = ['North Indian','South Indian','Continental','Chinese','Healthy','Street Food','Gujarati','Mughlai','Jain','Vegetarian'];

export function renderSignup(container, params) {
  const defaultRole = params?.get('role') || 'customer';
  document.body.classList.add('public-page');

  container.innerHTML = `
    <div class="auth-page">
      <div class="auth-card" style="max-width:560px">
        <div class="auth-logo">🍽 Ecatring</div>
        <h1 class="auth-title">Create your account</h1>

        <!-- Role Tabs -->
        <div class="tabs" style="margin-bottom:var(--space-6)">
          <button class="tab-btn ${defaultRole==='customer'?'active':''}" data-role="customer" id="tab-customer">I'm a Customer</button>
          <button class="tab-btn ${defaultRole==='caterer'?'active':''}" data-role="caterer" id="tab-caterer">I'm a Caterer</button>
        </div>

        <div id="signup-error" class="alert alert-error hidden">
          <span class="alert-icon">✕</span>
          <span id="signup-error-msg"></span>
        </div>

        <form id="signup-form" novalidate>
          <!-- Common fields -->
          <div class="form-row form-row-2">
            <div class="form-group">
              <label class="form-label" for="signup-name">Full Name</label>
              <input type="text" id="signup-name" class="form-input" placeholder="Your full name" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="signup-phone">Phone <span class="form-label-optional">(optional)</span></label>
              <input type="tel" id="signup-phone" class="form-input" placeholder="+91 98765 43210" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="signup-email">Email address</label>
            <input type="email" id="signup-email" class="form-input" placeholder="you@example.com" required />
          </div>

          <!-- Caterer-only fields -->
          <div id="caterer-fields" style="display:${defaultRole==='caterer'?'block':'none'}">
            <div class="form-group">
              <label class="form-label" for="signup-business">Business Name</label>
              <input type="text" id="signup-business" class="form-input" placeholder="Your catering business name" />
            </div>
            <div class="form-group">
              <label class="form-label" for="signup-location">Service Location / City</label>
              <input type="text" id="signup-location" class="form-input" placeholder="e.g. Mumbai, Thane, Pune" />
            </div>
            <div class="form-group">
              <label class="form-label" for="signup-description">Business Description <span class="form-label-optional">(optional)</span></label>
              <textarea id="signup-description" class="form-textarea" rows="2" placeholder="Tell customers about your catering service…"></textarea>
            </div>
            <div class="form-row form-row-2">
              <div class="form-group">
                <label class="form-label" for="signup-min-guests">Min Guests</label>
                <input type="number" id="signup-min-guests" class="form-input" value="20" min="1" />
              </div>
              <div class="form-group">
                <label class="form-label" for="signup-base-price">Base Price / Person (₹)</label>
                <input type="number" id="signup-base-price" class="form-input" value="350" min="0" step="10" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Cuisine Types</label>
              <div style="display:flex;flex-wrap:wrap;gap:var(--space-2);margin-top:4px" id="signup-cuisine-list">
                ${CUISINE_OPTIONS.map(c => `
                  <label style="display:flex;align-items:center;gap:4px;font-size:var(--font-size-sm);cursor:pointer;white-space:nowrap">
                    <input type="checkbox" value="${c}" class="signup-cuisine-cb" />
                    ${c}
                  </label>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Password -->
          <div class="form-row form-row-2">
            <div class="form-group">
              <label class="form-label" for="signup-password">Password</label>
              <input type="password" id="signup-password" class="form-input" placeholder="Min. 6 characters" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="signup-confirm">Confirm Password</label>
              <input type="password" id="signup-confirm" class="form-input" placeholder="Repeat password" required />
            </div>
          </div>

          <div id="caterer-note" style="display:${defaultRole==='caterer'?'block':'none'}">
            <div class="alert alert-info" style="margin-bottom:var(--space-4)">
              <span class="alert-icon">ℹ</span>
              Your account will be reviewed by our team before going live. This usually takes 1-2 business days.
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-full btn-lg" id="signup-submit">Create Account</button>
        </form>

        <div class="auth-footer">
          Already have an account? <a href="#/login">Sign in</a>
        </div>
      </div>
    </div>
  `;

  let selectedRole = defaultRole;

  document.querySelectorAll('.tab-btn[data-role]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn[data-role]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedRole = btn.dataset.role;
      const isCaterer = selectedRole === 'caterer';
      document.getElementById('caterer-fields').style.display = isCaterer ? 'block' : 'none';
      document.getElementById('caterer-note').style.display = isCaterer ? 'block' : 'none';
    });
  });

  document.getElementById('signup-form').addEventListener('submit', async e => {
    e.preventDefault();
    const name     = document.getElementById('signup-name').value.trim();
    const email    = document.getElementById('signup-email').value.trim();
    const phone    = document.getElementById('signup-phone').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirm  = document.getElementById('signup-confirm').value;

    const errBox = document.getElementById('signup-error');
    const errMsg = document.getElementById('signup-error-msg');
    const showErr = msg => { errMsg.textContent = msg; errBox.classList.remove('hidden'); };
    errBox.classList.add('hidden');

    if (!name || !email || !password) { showErr('Please fill in all required fields'); return; }
    if (password !== confirm)          { showErr('Passwords do not match'); return; }
    if (password.length < 6)           { showErr('Password must be at least 6 characters'); return; }

    if (selectedRole === 'caterer') {
      const biz = document.getElementById('signup-business').value.trim();
      if (!biz) { showErr('Business name is required for caterers'); return; }
      const loc = document.getElementById('signup-location').value.trim();
      if (!loc) { showErr('Service location is required for caterers'); return; }
    }

    const btn = document.getElementById('signup-submit');
    btn.textContent = 'Creating account…';
    btn.classList.add('btn-loading');

    try {
      const payload = { name, email, password, phone, role: selectedRole };

      if (selectedRole === 'caterer') {
        const selectedCuisines = [...document.querySelectorAll('.signup-cuisine-cb:checked')].map(c => c.value);
        payload.business_name       = document.getElementById('signup-business').value.trim();
        payload.service_area        = document.getElementById('signup-location').value.trim();
        payload.description         = document.getElementById('signup-description').value.trim();
        payload.min_guests          = parseInt(document.getElementById('signup-min-guests').value) || 20;
        payload.base_price_per_person = parseFloat(document.getElementById('signup-base-price').value) || 350;
        payload.cuisine_types       = selectedCuisines;
      }

      const { token, user } = await api.auth.signup(payload);
      auth.login(token, user);
      toast.success('Account created! Welcome to Ecatring!');
      if (user.role === 'caterer') window.location.hash = '#/caterer/settings';
      else window.location.hash = '#/';
    } catch (err) {
      showErr(err.message);
      btn.textContent = 'Create Account';
      btn.classList.remove('btn-loading');
    }
  });
}
