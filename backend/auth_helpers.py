import jwt
import bcrypt
import os
import time
from functools import wraps
from flask import request, jsonify, g
from database import query

TOKEN_EXPIRY_HOURS = 72


def get_secret_key() -> str:
    return os.environ.get('JWT_SECRET', 'ecatring-super-secret-key-2026-production-ready-key-minimum-64-bytes')


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def check_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_token(user_id: int, role: str) -> str:
    now = int(time.time())
    payload = {
        'sub': str(user_id),  # PyJWT requires 'sub' to be a string
        'role': str(role),
        'iat': now,
        'exp': now + (TOKEN_EXPIRY_HOURS * 3600),
    }
    secret = get_secret_key()
    token = jwt.encode(payload, secret, algorithm='HS256')
    if isinstance(token, bytes):
        token = token.decode('utf-8')
    return token


def decode_token(token: str) -> dict | None:
    if not token or not isinstance(token, str):
        return None
    try:
        secret = get_secret_key()
        res = jwt.decode(token, secret, algorithms=['HS256'])
        return res
    except Exception as e:
        print(f"[AUTH ERROR] Failed to decode token: {type(e).__name__}: {e}")
        return None


def get_current_user():
    auth_header = request.headers.get('Authorization') or request.environ.get('HTTP_AUTHORIZATION', '')
    if not auth_header:
        return None
    
    if auth_header.startswith('Bearer '):
        token = auth_header[7:].strip()
    else:
        token = auth_header.strip()

    payload = decode_token(token)
    if not payload or 'sub' not in payload:
        return None

    try:
        user_id = int(payload['sub'])
    except (ValueError, TypeError):
        return None

    user = query('SELECT * FROM users WHERE id = ? AND is_active = 1', (user_id,), one=True)
    return user


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        g.user = user
        return f(*args, **kwargs)
    return decorated


def require_role(*roles):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user = get_current_user()
            if not user:
                return jsonify({'error': 'Authentication required'}), 401
            if user['role'] not in roles:
                return jsonify({'error': 'Insufficient permissions'}), 403
            g.user = user
            return f(*args, **kwargs)
        return decorated
    return decorator
