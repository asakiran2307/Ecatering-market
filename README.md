# Ecatring — Catering Marketplace

A full-stack web platform connecting customers with local catering businesses.

## Tech Stack

- **Frontend**: HTML, CSS, Vanilla JS (ES Modules, SPA with hash routing)
- **Backend**: Python (Flask REST API)
- **Database**: SQLite (via Python's built-in sqlite3)
- **Auth**: JWT tokens (PyJWT + bcrypt)

## Quick Start

### Option A: Use the startup script (Windows)
```
Double-click start.bat
```

### Option B: Manual setup

**1. Install Python dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

**2. Seed the database:**
```bash
python seed.py
```

**3. Start the backend:**
```bash
python app.py
```
The API will be available at `http://localhost:5000`

**4. Open the frontend:**
Open `frontend/index.html` in your browser.

> **Note**: If you open the HTML file directly (`file://`), it may have CORS issues in some browsers. Use a local file server:
> ```bash
> # In the frontend directory:
> python -m http.server 3000
> # Then open http://localhost:3000
> ```

---

## Demo Credentials

| Role     | Email                     | Password    |
|----------|---------------------------|-------------|
| Admin    | admin@ecatring.com        | admin123    |
| Caterer  | priya@spicegarden.com     | caterer123  |
| Customer | rahul@example.com         | customer123 |

---

## Project Structure

```
Ecatring/
├── backend/
│   ├── app.py              # Flask application entry point
│   ├── database.py         # SQLite connection helper
│   ├── auth_helpers.py     # JWT auth + decorators
│   ├── schema.sql          # Database schema
│   ├── seed.py             # Sample data script
│   ├── requirements.txt    # Python dependencies
│   └── routes/
│       ├── auth.py         # Login, signup, profile
│       ├── caterers.py     # Caterer listing & profiles
│       ├── menu.py         # Menu item CRUD
│       ├── orders.py       # Order creation & status
│       ├── messages.py     # Chat messages
│       ├── reviews.py      # Customer reviews
│       ├── disputes.py     # Dispute management
│       └── admin.py        # Admin operations
├── frontend/
│   ├── index.html          # SPA shell
│   ├── css/styles.css      # Complete design system
│   └── js/
│       ├── app.js          # Router & bootstrapper
│       ├── api.js          # API client
│       ├── auth.js         # Auth state
│       ├── cart.js         # Cart state
│       ├── utils.js        # Shared utilities
│       ├── components/     # Navbar, Sidebar, Toast, Modal
│       └── pages/          # All 19 page modules
├── start.bat               # Windows startup script
└── README.md
```

---

## Features

### Customer
- Browse and search caterers by location, cuisine, rating
- View detailed caterer profiles with full menu
- Add items to cart and build orders
- Submit order requests with event details
- Real-time chat with caterer per order
- Track order status with visual timeline
- Rate and review after completion

### Caterer
- Dashboard with incoming order management (Accept/Reject/Complete)
- Full menu management (add/edit/delete/toggle items)
- Bookings calendar view
- Chat inbox for all active orders
- Business profile management

### Admin
- Analytics dashboard (GMV, orders, commission)
- Caterer verification queue (approve/reject)
- Platform-wide order feed with search
- Dispute management and resolution
- User management (suspend/reactivate)
- Platform settings (commission rate, cities, featured caterers)

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/signup` | Register |
| GET | `/api/caterers` | List caterers |
| GET | `/api/caterers/:id` | Caterer profile + menu |
| POST | `/api/orders` | Place order |
| GET | `/api/orders/:id` | Order details |
| PUT | `/api/orders/:id/status` | Update order status |
| GET/POST | `/api/orders/:id/messages` | Chat messages |
| POST | `/api/reviews` | Submit review |
| GET | `/api/admin/analytics` | Platform analytics |
| ... | | And many more |
