// pages/chat.js — Chat page (per-order thread)
import api from '../api.js';
import auth from '../auth.js';
import toast from '../components/toast.js';
import { formatDateTime, timeAgo } from '../utils.js';

export async function renderChat(container, orderId) {
  const user = auth.getUser();

  container.innerHTML = `
    <div class="page-content-wide" style="max-width:900px">
      <div class="breadcrumb">
        <a href="#/orders/${orderId}">Order #${orderId}</a>
        <span class="breadcrumb-sep">/</span>
        <span>Chat</span>
      </div>
      <div class="card" style="display:flex;flex-direction:column;height:calc(100vh - var(--navbar-height) - 160px);overflow:hidden">
        <div class="chat-header">
          <span style="font-size:18px">💬</span>
          <div>
            <div style="font-weight:700">Order #${orderId} Chat</div>
            <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">Messages are tied to this order</div>
          </div>
          <a href="#/orders/${orderId}" class="btn btn-secondary btn-sm" style="margin-left:auto">View Order</a>
        </div>
        <div class="chat-messages" id="chat-messages-list">
          <div style="text-align:center;color:var(--color-text-muted);font-size:var(--font-size-xs)">Loading messages…</div>
        </div>
        <div class="chat-input-area">
          <textarea id="chat-input" class="chat-input" rows="1" placeholder="Type a message…" maxlength="1000"></textarea>
          <button class="btn btn-primary" id="chat-send-btn">Send</button>
        </div>
      </div>
    </div>
  `;

  let lastMessageTime = '';
  let polling;

  async function loadMessages() {
    try {
      const messages = await api.orders.getMessages(orderId, lastMessageTime);
      const list = document.getElementById('chat-messages-list');
      if (!list) return;

      if (!messages.length && !lastMessageTime) {
        list.innerHTML = `<div class="chat-bubble chat-bubble-system">No messages yet. Start the conversation!</div>`;
        return;
      }

      if (messages.length > 0) {
        const fragment = document.createDocumentFragment();
        messages.forEach(msg => {
          const el = document.createElement('div');
          const isSystem = msg.is_system;
          const isMine = msg.sender_id === user?.id;
          el.className = `chat-bubble ${isSystem ? 'chat-bubble-system' : isMine ? 'chat-bubble-mine' : 'chat-bubble-theirs'}`;
          if (!isSystem && !isMine) {
            el.innerHTML = `<div class="chat-bubble-sender">${msg.sender_name}</div>`;
          }
          el.innerHTML += `${msg.content}`;
          if (!isSystem) {
            el.innerHTML += `<div class="chat-bubble-time">${timeAgo(msg.created_at)}</div>`;
          }
          fragment.appendChild(el);
          lastMessageTime = msg.created_at;
        });
        if (!lastMessageTime) {
          list.innerHTML = '';
        }
        list.appendChild(fragment);
        list.scrollTop = list.scrollHeight;
      }
    } catch (e) {
      console.error('Chat load error:', e);
    }
  }

  // Auto-resize textarea
  const input = document.getElementById('chat-input');
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(120, input.scrollHeight) + 'px';
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      document.getElementById('chat-send-btn').click();
    }
  });

  document.getElementById('chat-send-btn').addEventListener('click', async () => {
    const content = input.value.trim();
    if (!content) return;

    input.value = '';
    input.style.height = 'auto';
    const btn = document.getElementById('chat-send-btn');
    btn.disabled = true;

    try {
      await api.orders.sendMessage(orderId, { content });
      lastMessageTime = '';  // Reload all to be safe
      const list = document.getElementById('chat-messages-list');
      if (list) list.innerHTML = '';
      await loadMessages();
    } catch (e) {
      toast.error(e.message);
    } finally {
      btn.disabled = false;
      input.focus();
    }
  });

  // Initial load + polling
  lastMessageTime = '';
  await loadMessages();
  polling = setInterval(loadMessages, 4000);

  // Cleanup on navigate away
  window.addEventListener('hashchange', () => clearInterval(polling), { once: true });
}
