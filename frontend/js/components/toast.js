// toast.js — Toast notification system
export function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-text">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-exit');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);

  toast.addEventListener('click', () => {
    toast.classList.add('toast-exit');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  });
}

export const toast = {
  success: (m, d) => showToast(m, 'success', d),
  error:   (m, d) => showToast(m, 'error', d),
  info:    (m, d) => showToast(m, 'info', d),
  warning: (m, d) => showToast(m, 'warning', d),
};

export default toast;
