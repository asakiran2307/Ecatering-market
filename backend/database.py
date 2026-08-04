"""
database.py — PostgreSQL (Neon) + SQLite fallback database module.

Uses a ThreadedConnectionPool for PostgreSQL so connections are reused
across requests instead of creating a fresh TCP connection every time.
"""
import os
import re
import sqlite3
import threading

load_dotenv_done = False

def _load_env():
    global load_dotenv_done
    if not load_dotenv_done:
        try:
            from dotenv import load_dotenv
            load_dotenv()
        except ImportError:
            pass
        load_dotenv_done = True

_load_env()

DATABASE_URL = os.environ.get('DATABASE_URL', '')
USE_POSTGRES = bool(DATABASE_URL)

# ---------------------------------------------------------------------------
# SQLite path (local dev fallback)
# ---------------------------------------------------------------------------
DB_PATH = os.path.join(os.path.dirname(__file__), 'ecatring.db')
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), 'schema.sql')
SCHEMA_PG_PATH = os.path.join(os.path.dirname(__file__), 'schema_pg.sql')


# ---------------------------------------------------------------------------
# PostgreSQL connection pool (reuse connections — avoids per-request TCP overhead)
# ---------------------------------------------------------------------------
_pg_pool = None
_pg_pool_lock = threading.Lock()

def _get_pg_pool():
    global _pg_pool
    if _pg_pool is None:
        with _pg_pool_lock:
            if _pg_pool is None:
                import psycopg2.pool
                _pg_pool = psycopg2.pool.ThreadedConnectionPool(
                    minconn=1,
                    maxconn=10,
                    dsn=DATABASE_URL
                )
    return _pg_pool


def _pg_sql(sql: str, params=()) -> str:
    """Convert SQLite-style ? placeholders to PostgreSQL %s; escape literal %."""
    if params:
        sql = sql.replace('%', '%%')
    return re.sub(r'\?', '%s', sql)


def _pg_query(sql: str, params=(), one=False):
    import psycopg2.extras
    sql = _pg_sql(sql, params)
    pool = _get_pg_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(sql, params)
        rv = cur.fetchone() if one else cur.fetchall()
        conn.commit()
        if one:
            return dict(rv) if rv else None
        return [dict(r) for r in rv]
    except Exception:
        conn.rollback()
        raise
    finally:
        pool.putconn(conn)


def _pg_execute(sql: str, params=()):
    sql = _pg_sql(sql, params)
    # Append RETURNING id for INSERT so we can return lastrowid
    if sql.strip().upper().startswith('INSERT') and 'RETURNING' not in sql.upper():
        sql = sql.rstrip().rstrip(';') + ' RETURNING id'
    pool = _get_pg_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute(sql, params)
        conn.commit()
        if sql.strip().upper().startswith('INSERT'):
            row = cur.fetchone()
            return row[0] if row else None
        return None
    except Exception:
        conn.rollback()
        raise
    finally:
        pool.putconn(conn)


def _pg_execute_many(sql: str, params_list):
    sql = _pg_sql(sql)
    pool = _get_pg_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.executemany(sql, params_list)
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        pool.putconn(conn)


def _pg_init_db():
    schema_path = SCHEMA_PG_PATH if os.path.exists(SCHEMA_PG_PATH) else SCHEMA_PATH
    with open(schema_path, 'r') as f:
        ddl = f.read()
    pool = _get_pg_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute(ddl)
        conn.commit()
        print(f'[DB] PostgreSQL schema initialised from {schema_path}')
    except Exception:
        conn.rollback()
        raise
    finally:
        pool.putconn(conn)


# ---------------------------------------------------------------------------
# SQLite helpers
# ---------------------------------------------------------------------------
def _get_sqlite_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys = ON')
    conn.execute('PRAGMA journal_mode = WAL')
    return conn


def _sqlite_query(sql: str, params=(), one=False):
    conn = _get_sqlite_conn()
    try:
        cur = conn.execute(sql, params)
        rv = cur.fetchone() if one else cur.fetchall()
        conn.commit()
        if one:
            return dict(rv) if rv else None
        return [dict(r) for r in rv]
    finally:
        conn.close()


def _sqlite_execute(sql: str, params=()):
    conn = _get_sqlite_conn()
    try:
        cur = conn.execute(sql, params)
        conn.commit()
        return cur.lastrowid
    finally:
        conn.close()


def _sqlite_execute_many(sql: str, params_list):
    conn = _get_sqlite_conn()
    try:
        conn.executemany(sql, params_list)
        conn.commit()
    finally:
        conn.close()


def _sqlite_init_db():
    conn = _get_sqlite_conn()
    with open(SCHEMA_PATH, 'r') as f:
        conn.executescript(f.read())
    conn.commit()
    conn.close()
    print(f'[DB] SQLite initialised at {DB_PATH}')


# ---------------------------------------------------------------------------
# Public API — identical interface regardless of backend
# ---------------------------------------------------------------------------
def get_db():
    """Return a raw connection (used internally, avoid in routes)."""
    if USE_POSTGRES:
        return _get_pg_pool().getconn()
    return _get_sqlite_conn()


def init_db():
    if USE_POSTGRES:
        _pg_init_db()
    else:
        _sqlite_init_db()


def query(sql: str, params=(), one=False):
    if USE_POSTGRES:
        return _pg_query(sql, params, one)
    return _sqlite_query(sql, params, one)


def execute(sql: str, params=()):
    if USE_POSTGRES:
        return _pg_execute(sql, params)
    return _sqlite_execute(sql, params)


def execute_many(sql: str, params_list):
    if USE_POSTGRES:
        return _pg_execute_many(sql, params_list)
    return _sqlite_execute_many(sql, params_list)
