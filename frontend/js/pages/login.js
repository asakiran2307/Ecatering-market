// pages/login.js
import api from '../api.js';
import auth from '../auth.js';
import toast from '../components/toast.js';

export function renderLogin(container) {
  document.body.classList.add('public-page');

  container.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">🍽 Ecatring</div>
        <h1 class="auth-title">Welcome back</h1>
        <p class="auth-subtitle">Sign in to your account to continue</p>

        <div id="login-error" class="alert alert-error hidden">
          <span class="alert-icon">✕</span>
          <span id="login-error-msg"></span>
        </div>

        <form id="login-form" novalidate>
          <div class="form-group">
            <label class="form-label" for="login-email">Email address</label>
            <input type="email" id="login-email" class="form-input" placeholder="you@example.com"
                   autocomplete="email" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="login-password">Password</label>
            <input type="password" id="login-password" class="form-input" placeholder="Your password"
                   autocomplete="current-password" required />
          </div>
          <button type="submit" class="btn btn-primary btn-full btn-lg" id="login-submit">Sign in</button>
        </form>


        <div class="auth-footer">
          Don't have an account? <a href="#/signup">Create one</a>
        </div>
      </div>
    </div>
  `;

  async function doLogin(email, password) {
    const btn = document.getElementById('login-submit');
    const errBox = document.getElementById('login-error');
    const errMsg = document.getElementById('login-error-msg');
    btn.textContent = 'Signing in…';
    btn.classList.add('btn-loading');
    errBox.classList.add('hidden');

    try {
      const { token, user } = await api.auth.login({ email, password });
      auth.login(token, user);
      toast.success(`Welcome back, ${user.name}!`);
      // Redirect by role
      if (user.role === 'caterer') window.location.hash = '#/caterer/orders';
      else if (user.role === 'admin') window.location.hash = '#/admin/analytics';
      else window.location.hash = '#/';
    } catch (e) {
      errMsg.textContent = e.message;
      errBox.classList.remove('hidden');
      btn.textContent = 'Sign in';
      btn.classList.remove('btn-loading');
    }
  }

  document.getElementById('login-form').addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    if (!email || !password) { toast.error('Please fill in all fields'); return; }
    doLogin(email, password);
  });

}
