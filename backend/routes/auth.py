from flask import Blueprint, request, jsonify, g
from database import query, execute
from auth_helpers import hash_password, check_password, create_token, require_auth

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    role = data.get('role') or 'customer'
    phone = (data.get('phone') or '').strip()

    if not name or not email or not password:
        return jsonify({'error': 'Name, email and password are required'}), 400
    if role not in ('customer', 'caterer'):
        return jsonify({'error': 'Invalid role'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    existing = query('SELECT id FROM users WHERE email = ?', (email,), one=True)
    if existing:
        return jsonify({'error': 'Email already registered'}), 409

    password_hash = hash_password(password)
    user_id = execute(
        'INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)',
        (name, email, password_hash, role, phone)
    )

    # If caterer, create caterer profile with full details
    if role == 'caterer':
        import json
        business_name = (data.get('business_name') or name + "'s Catering").strip()
        service_area = (data.get('service_area') or '').strip()
        description = (data.get('description') or '').strip()
        min_guests = int(data.get('min_guests') or 10)
        base_price = float(data.get('base_price_per_person') or 0)
        cuisine_types = data.get('cuisine_types') or []
        cuisine_json = json.dumps(cuisine_types) if isinstance(cuisine_types, list) else str(cuisine_types)

        execute(
            '''INSERT INTO caterers (user_id, business_name, description, service_area, min_guests, base_price_per_person, cuisine_types, verification_status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
            (user_id, business_name, description, service_area, min_guests, base_price, cuisine_json, 'pending')
        )

    token = create_token(user_id, role)
    user = query('SELECT id, name, email, role, phone FROM users WHERE id = ?', (user_id,), one=True)
    return jsonify({'token': token, 'user': user}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = query('SELECT * FROM users WHERE email = ?', (email,), one=True)
    if not user or not check_password(password, user['password_hash']):
        return jsonify({'error': 'Invalid email or password'}), 401
    if not user['is_active']:
        return jsonify({'error': 'Account suspended. Contact support.'}), 403

    token = create_token(user['id'], user['role'])
    safe_user = {k: user[k] for k in ('id', 'name', 'email', 'role', 'phone')}
    return jsonify({'token': token, 'user': safe_user})


@auth_bp.route('/me', methods=['GET'])
@require_auth
def me():
    user = g.user
    safe = {k: user[k] for k in ('id', 'name', 'email', 'role', 'phone')}
    return jsonify(safe)


@auth_bp.route('/me', methods=['PUT'])
@require_auth
def update_me():
    data = request.get_json()
    user = g.user
    name = (data.get('name') or '').strip() or user['name']
    phone = (data.get('phone') or '').strip()
    execute('UPDATE users SET name = ?, phone = ? WHERE id = ?', (name, phone, user['id']))
    return jsonify({'message': 'Profile updated'})


@auth_bp.route('/change-password', methods=['POST'])
@require_auth
def change_password():
    data = request.get_json()
    current = data.get('current_password') or ''
    new_pw = data.get('new_password') or ''
    user = query('SELECT * FROM users WHERE id = ?', (g.user['id'],), one=True)
    if not check_password(current, user['password_hash']):
        return jsonify({'error': 'Current password is incorrect'}), 400
    if len(new_pw) < 6:
        return jsonify({'error': 'New password must be at least 6 characters'}), 400
    execute('UPDATE users SET password_hash = ? WHERE id = ?', (hash_password(new_pw), g.user['id']))
    return jsonify({'message': 'Password changed'})
