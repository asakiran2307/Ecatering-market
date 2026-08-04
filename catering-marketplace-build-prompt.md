# Master Build Prompt — Catering Marketplace Website

Use this prompt as-is to instruct a developer or AI coding tool to build the complete website.

---

## PROJECT BRIEF

Build a full-stack web platform called a **Catering Marketplace** that connects customers planning events with local catering businesses. Customers search for caterers, browse itemized menus with prices, build an order like an e-commerce cart, submit a booking request, and communicate with the caterer through an in-platform chat. Caterers manage their own menu, receive order requests, and accept/reject/counter them through the same chat. Admins verify caterers and oversee the platform.

Build this as a **responsive web application** (desktop + mobile browser). Do not include a native mobile app in this build — web only, for now.

---

## DESIGN & UI DIRECTION (STRICT)

- **Style:** professional, clean, minimal — closer to a business/SaaS product than a consumer social app.
- **No animations, no transitions, no hover-scale effects, no parallax, no motion of any kind.** Every state change (page load, click, navigation) should be instant and static. This is a hard requirement, not a preference.
- **No gradients, no drop shadows beyond subtle card separation, no decorative flourishes.** Flat design only.
- **Typography:** one clear sans-serif font family, consistent size scale, strong hierarchy (page titles, section headers, body text, captions clearly distinct by weight/size, not by color alone).
- **Color palette:** one primary brand color used sparingly (buttons, links, active states), neutral grays for backgrounds/borders/text, white space used generously. No more than 2–3 colors total plus neutrals.
- **Layout:** grid-based, consistent spacing, clearly aligned elements. Content should never feel cramped or cluttered.
- **Components:** simple rectangular cards and buttons, clear borders or subtle background contrast to separate sections — no rounded-pill overload, no glassmorphism, no skeuomorphism.
- **Consistency:** the same button style, input style, card style, and spacing rules must be reused identically across every page.
- **Accessibility:** sufficient color contrast, legible font sizes, clear focus states on inputs (a visible outline is fine — this is not a "transition/animation" and should stay).

---

## USER ROLES

1. **Customer** — searches caterers, builds orders, chats, tracks status, rates caterers.
2. **Caterer (Vendor)** — manages menu, receives/responds to orders, chats with customers.
3. **Admin** — approves caterers, resolves disputes, monitors platform activity.

Each role has a separate login and separate dashboard. Role-based access control must be enforced on the backend, not just hidden in the UI.

---

## PAGES TO BUILD

### Public / Customer-facing
1. **Home Page** — search bar (caterer name or location), featured caterers, category browsing, clean hero section with no imagery carousel/slider (static content only).
2. **Search Results Page** — filterable, sortable list of caterers (location, price range, rating, cuisine/event type).
3. **Caterer Profile Page** — caterer info, full menu grouped by category, per-item price, add-to-cart controls, live-updating order summary panel, guest count input, ratings/reviews section.
4. **Cart / Order Summary Page** — itemized list, guest count, event date/time/address, special instructions field, total cost breakdown, "Send Order Request" button.
5. **Order Status Page** — current status (Pending / Accepted / Rejected / Confirmed / Completed), status history, link to chat.
6. **Chat Page** — one thread per order, message history, system-generated status messages, message input.
7. **Customer Account Pages** — profile settings, order history, saved addresses.
8. **Login / Signup Pages** — separate flows for customer and caterer signup.

### Caterer Dashboard
9. **Caterer Menu Management** — add/edit/delete items, categories, prices, photos, availability toggle.
10. **Incoming Orders Page** — list of order requests with accept/reject/counter actions.
11. **Caterer Bookings Calendar** — confirmed bookings by date.
12. **Caterer Chat Inbox** — all active order chat threads in one place.
13. **Caterer Profile & Settings** — business info, service area, verification status.

### Admin Dashboard
14. **Caterer Verification Queue** — approve/reject new caterer applications.
15. **Platform Order Feed** — searchable list of all orders across the platform.
16. **Dispute Management** — view and resolve customer/caterer complaints.
17. **User Management** — view, suspend, or ban customer/caterer accounts.
18. **Analytics Dashboard** — total orders, GMV, active users, conversion rate, shown as static tables/simple bar charts (no animated chart transitions).
19. **Platform Settings** — commission rate, supported cities, featured caterer listings.

---

## CORE FUNCTIONALITY REQUIREMENTS

- **Search:** by caterer name and by location, with real-time filtering.
- **Cart logic:** price calculation must update instantly as items/guest count change, calculated per-person and as a total.
- **Order state machine:** Pending → Accepted → Confirmed → Completed, with Rejected and Cancelled as branch states. Every transition logged with timestamp and actor.
- **Chat:** one thread per order, persisted message history, tied to that order's ID. This is the only communication channel between customer and caterer — no third-party messaging integration.
- **Notifications:** in-app + email notification when an order is placed, accepted, rejected, or a new chat message arrives. A Telegram bot may additionally alert caterers of new incoming orders as a backend convenience (not customer-facing).
- **Authentication:** secure login for all three roles, with role-based route protection.
- **Ratings/Reviews:** customers can rate and review a caterer only after an order is marked Completed.

---

## BACKEND / DATA REQUIREMENTS

Design a database with these core entities and their key relationships:
- **Users** (role, name, contact info, credentials)
- **Caterers** (linked to a user, business details, verification status, service area, rating)
- **MenuItems** (linked to a caterer, name, price, category, availability, image)
- **Orders** (linked to customer and caterer, guest count, event date/address, status, total cost)
- **OrderItems** (linked to order and menu item, quantity, price at time of order)
- **Messages** (linked to an order, sender, timestamp, content)
- **Reviews** (linked to an order, rating, comment)
- **Disputes** (linked to an order, description, resolution status)

Build a clean REST (or equivalent) API layer that the frontend consumes — do not hardcode data into the frontend.

---

## NON-FUNCTIONAL REQUIREMENTS

- Fast page loads — no heavy client-side animation libraries should be included at all, since motion is explicitly disallowed.
- Enforce role-based permissions on every API endpoint, not just in the UI.
- Validate all form inputs (order details, menu prices, guest counts) on both frontend and backend.
- Keep the codebase modular: separate concerns for auth, orders, chat, and admin functionality.

---

## WHAT TO DELIVER

1. A fully working responsive web application covering every page listed above.
2. A working backend API with the data model described.
3. Functional chat tied to individual orders.
4. Role-based dashboards for Customer, Caterer, and Admin.
5. No animations, transitions, or decorative motion anywhere in the UI — confirm this explicitly before considering the build complete.
