// modal.js — Reusable modal
export function showModal({ title, body, footer, onClose }) {
  const overlay = document.getElementById('modal-overlay');
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal-header">
        <h2 class="modal-title" id="modal-title">${title}</h2>
        <button class="modal-close" id="modal-close-btn" aria-label="Close">✕</button>
      </div>
      <div class="modal-body">${body}</div>
      ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
    </div>
  `;
  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  const close = () => {
    overlay.classList.add('hidden');
    overlay.innerHTML = '';
    document.body.style.overflow = '';
    if (onClose) onClose();
  };

  document.getElementById('modal-close-btn').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); }, { once: true });

  return { close };
}

export function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.add('hidden');
  overlay.innerHTML = '';
  document.body.style.overflow = '';
}

export function showConfirm({ title, message, confirmText = 'Confirm', danger = false }) {
  return new Promise(resolve => {
    const { close } = showModal({
      title,
      body: `<p style="color:var(--color-text-secondary)">${message}</p>`,
      footer: `
        <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="modal-confirm">${confirmText}</button>
      `,
    });
    document.getElementById('modal-cancel').addEventListener('click', () => { close(); resolve(false); });
    document.getElementById('modal-confirm').addEventListener('click', () => { close(); resolve(true); });
  });
}
