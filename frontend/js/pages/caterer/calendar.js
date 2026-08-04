// pages/caterer/calendar.js — Bookings Calendar
import api from '../../api.js';
import { formatDate, renderLoader } from '../../utils.js';

export async function renderCatererCalendar(container) {
  container.innerHTML = `
    <div class="page-header-row" style="margin-bottom:var(--space-6)">
      <div>
        <h1 class="page-title">Bookings Calendar</h1>
        <p class="page-subtitle">View confirmed and completed bookings by date</p>
      </div>
      <div style="display:flex;gap:var(--space-3);align-items:center">
        <button class="btn btn-secondary btn-sm" id="prev-month">← Prev</button>
        <span id="month-label" style="font-weight:700;min-width:140px;text-align:center"></span>
        <button class="btn btn-secondary btn-sm" id="next-month">Next →</button>
      </div>
    </div>
    <div id="calendar-view">${renderLoader()}</div>
    <div id="day-orders" style="margin-top:var(--space-6)"></div>
  `;

  let year = new Date().getFullYear();
  let month = new Date().getMonth();
  let allOrders = [];

  async function loadOrders() {
    try {
      const data = await api.orders.list({ status: 'confirmed' });
      const data2 = await api.orders.list({ status: 'completed' });
      allOrders = [...(data.orders || []), ...(data2.orders || [])];
    } catch (e) {
      console.error(e);
    }
  }

  function renderCalendar() {
    const label = new Date(year, month).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    document.getElementById('month-label').textContent = label;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    // Group orders by date
    const byDate = {};
    allOrders.forEach(o => {
      const d = o.event_date?.split('T')[0] || '';
      if (d) { if (!byDate[d]) byDate[d] = []; byDate[d].push(o); }
    });

    let html = `
      <div class="calendar-grid">
        ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => `<div class="calendar-day-header">${d}</div>`).join('')}
        ${Array(firstDay).fill('').map(() => `<div class="calendar-cell calendar-cell-other"></div>`).join('')}
        ${Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
          const dayOrders = byDate[dateStr] || [];
          return `
            <div class="calendar-cell ${isToday ? 'calendar-cell-today' : ''}" data-date="${dateStr}" style="cursor:${dayOrders.length?'pointer':'default'}">
              <div class="calendar-date">${day}</div>
              ${dayOrders.slice(0,2).map(o => `
                <div class="calendar-event" title="Order #${o.id}: ${o.customer_name}">#${o.id} ${o.customer_name}</div>
              `).join('')}
              ${dayOrders.length > 2 ? `<div style="font-size:10px;color:var(--color-text-muted)">+${dayOrders.length-2} more</div>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;

    document.getElementById('calendar-view').innerHTML = html;

    document.querySelectorAll('.calendar-cell[data-date]').forEach(cell => {
      cell.addEventListener('click', () => {
        const date = cell.dataset.date;
        const dayOrders = byDate[date] || [];
        if (!dayOrders.length) { document.getElementById('day-orders').innerHTML = ''; return; }
        document.getElementById('day-orders').innerHTML = `
          <div class="card">
            <div class="card-header"><span class="font-semibold">Bookings on ${formatDate(date)}</span></div>
            <div class="card-body" style="padding:0">
              <table>
                <thead><tr><th>Order #</th><th>Customer</th><th>Guests</th><th>Total</th><th>Status</th></tr></thead>
                <tbody>
                  ${dayOrders.map(o => `
                    <tr style="cursor:pointer" onclick="location.hash='#/orders/${o.id}'">
                      <td><strong>#${o.id}</strong></td>
                      <td>${o.customer_name}</td>
                      <td>${o.guest_count}</td>
                      <td>₹${(o.total_cost||0).toLocaleString('en-IN')}</td>
                      <td><span class="badge badge-${o.status}">${o.status}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;
      });
    });
  }

  document.getElementById('prev-month').addEventListener('click', () => {
    month--; if (month < 0) { month = 11; year--; }
    renderCalendar();
  });
  document.getElementById('next-month').addEventListener('click', () => {
    month++; if (month > 11) { month = 0; year++; }
    renderCalendar();
  });

  await loadOrders();
  renderCalendar();
}
