-- Ecatring Database Schema — PostgreSQL (Neon)

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('customer', 'caterer', 'admin')),
    phone TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS caterers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    business_name TEXT NOT NULL,
    description TEXT,
    cuisine_types TEXT DEFAULT '[]',
    event_types TEXT DEFAULT '[]',
    service_area TEXT,
    min_guests INTEGER DEFAULT 10,
    max_guests INTEGER DEFAULT 500,
    base_price_per_person REAL DEFAULT 0,
    verification_status TEXT DEFAULT 'pending' CHECK(verification_status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    rating REAL DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    caterer_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    unit TEXT DEFAULT 'per person',
    image_url TEXT,
    is_available INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (caterer_id) REFERENCES caterers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    caterer_id INTEGER NOT NULL,
    guest_count INTEGER NOT NULL,
    event_date TEXT NOT NULL,
    event_time TEXT,
    event_address TEXT NOT NULL,
    event_type TEXT,
    special_instructions TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected','confirmed','completed','cancelled')),
    total_cost REAL NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (customer_id) REFERENCES users(id),
    FOREIGN KEY (caterer_id) REFERENCES caterers(id)
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    menu_item_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_order REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

CREATE TABLE IF NOT EXISTS order_status_history (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    actor_id INTEGER,
    actor_name TEXT,
    actor_role TEXT,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    sender_id INTEGER,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    content TEXT NOT NULL,
    is_system INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL UNIQUE,
    customer_id INTEGER NOT NULL,
    caterer_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (customer_id) REFERENCES users(id),
    FOREIGN KEY (caterer_id) REFERENCES caterers(id)
);

CREATE TABLE IF NOT EXISTS disputes (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    reporter_id INTEGER NOT NULL,
    reporter_role TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK(status IN ('open','investigating','resolved')),
    resolution TEXT,
    resolved_by INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (reporter_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS platform_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    label TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default platform settings
INSERT INTO platform_settings (key, value, label) VALUES
    ('commission_rate', '10', 'Commission Rate (%)'),
    ('supported_cities', '["Mumbai","Delhi","Bangalore","Chennai","Hyderabad","Pune","Kolkata","Ahmedabad"]', 'Supported Cities'),
    ('min_order_notice_hours', '48', 'Minimum Order Notice (hours)'),
    ('max_guest_count', '5000', 'Maximum Guest Count'),
    ('platform_name', 'Ecatring', 'Platform Name'),
    ('featured_caterer_ids', '[]', 'Featured Caterer IDs')
ON CONFLICT (key) DO NOTHING;
