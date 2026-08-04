"""
init_pg.py — One-time initialization script for the Neon PostgreSQL database.

Run this ONCE to create tables and seed data on your Neon DB:
    python init_pg.py

Requirements: DATABASE_URL must be set in backend/.env
"""
import os
import sys

# Ensure backend directory is on path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, '.env'))

from database import init_db, USE_POSTGRES

if not USE_POSTGRES:
    print('[ERROR] DATABASE_URL not set. Check backend/.env')
    sys.exit(1)

print('[INIT] Connecting to Neon PostgreSQL...')
try:
    init_db()
    print('[INIT] Schema created successfully.')
except Exception as e:
    print(f'[ERROR] Schema init failed: {e}')
    sys.exit(1)

# Now run the seed
print('[SEED] Running seed data...')
try:
    import seed  # noqa: F401 — imports and runs seed logic
    print('[SEED] Done.')
except Exception as e:
    print(f'[WARN] Seed failed (may already have data): {e}')

print('[DONE] Neon PostgreSQL is ready.')
