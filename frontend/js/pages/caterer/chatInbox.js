// pages/caterer/chatInbox.js — Caterer Chat Inbox
import api from '../../api.js';
import { renderLoader, renderEmpty, timeAgo } from '../../utils.js';

export async function renderCatererChatInbox(container) {
  container.innerHTML = `
    <div class="page-header" style="margin-bottom:var(--space-6)">
      <h1 class="page-title">Chat Inbox</h1>
      <p class="page-subtitle">All active order conversations</p>
    </div>
    <div id="threads-container">${renderLoader()}</div>
  `;

  try {
    const threads = await api.orders.chatThreads();
    const cont = document.getElementById('threads-container');

    if (!threads.length) {
      cont.innerHTML = renderEmpty('💬', 'No chat threads', 'Chat threads appear here when customers place orders.');
      return;
    }

    cont.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:var(--space-3)">
        ${threads.map(t => `
          <div class="card card-interactive" data-order="${t.order_id}" style="cursor:pointer">
            <div class="card-body" style="display:flex;gap:var(--space-5);align-items:center">
              <div class="avatar-lg" style="width:48px;height:48px;font-size:20px;flex-shrink:0">
                ${(t.customer_name||'?').charAt(0).toUpperCase()}
              </div>
              <div style="flex:1;min-width:0">
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <div style="font-weight:700">${t.customer_name}</div>
                  <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">${t.last_message_at ? timeAgo(t.last_message_at) : ''}</div>
                </div>
                <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">Order #${t.order_id} · <span class="badge badge-${t.status}" style="font-size:10px">${t.status}</span></div>
                <div style="margin-top:4px;font-size:var(--font-size-sm);color:var(--color-text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                  ${t.last_message || 'No messages yet'}
                </div>
              </div>
              <span style="font-size:20px;color:var(--color-text-muted)">›</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    cont.querySelectorAll('[data-order]').forEach(card => {
      card.addEventListener('click', () => window.location.hash = `#/orders/${card.dataset.order}/chat`);
    });
  } catch (e) {
    document.getElementById('threads-container').innerHTML = `<div class="alert alert-error"><span>✕</span> ${e.message}</div>`;
  }
}
