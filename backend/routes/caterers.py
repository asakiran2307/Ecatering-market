import json
import time
from flask import Blueprint, request, jsonify, g
from database import query, execute
from auth_helpers import require_auth, require_role, get_current_user

caterers_bp = Blueprint('caterers', __name__)

# Simple in-memory cache for featured caterers (60s TTL)
_featured_cache = {'data': None, 'ts': 0, 'ttl': 60}


def _caterer_row(c):
    if not c:
        return None
    c = dict(c)
    for field in ('cuisine_types', 'event_types'):
        try:
            c[field] = json.loads(c.get(field) or '[]')
        except Exception:
            c[field] = []
    return c


@caterers_bp.route('', methods=['GET'])
def list_caterers():
    search = request.args.get('q', '').strip()
    location = request.args.get('location', '').strip()
    cuisine = request.args.get('cuisine', '').strip()
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    min_rating = request.args.get('min_rating', type=float)
    sort = request.args.get('sort', 'rating')
    page = max(1, request.args.get('page', 1, type=int))
    per_page = 12

    sql = '''SELECT c.*, u.name AS owner_name, u.email AS owner_email,
                    u.phone AS owner_phone
             FROM caterers c
             JOIN users u ON u.id = c.user_id
             WHERE c.verification_status = 'approved' AND u.is_active = 1'''
    params = []

    from database import USE_POSTGRES
    like_op = 'ILIKE' if USE_POSTGRES else 'LIKE'

    if search:
        sql += f' AND (c.business_name {like_op} ? OR c.description {like_op} ?)'
        params += [f'%{search}%', f'%{search}%']
    if location:
        sql += f' AND c.service_area {like_op} ?'
        params.append(f'%{location}%')
    if cuisine:
        sql += f' AND c.cuisine_types {like_op} ?'
        params.append(f'%{cuisine}%')
    if min_price is not None:
        sql += ' AND c.base_price_per_person >= ?'
        params.append(min_price)
    if max_price is not None:
        sql += ' AND c.base_price_per_person <= ?'
        params.append(max_price)
    if min_rating is not None:
        sql += ' AND c.rating >= ?'
        params.append(min_rating)

    sort_map = {
        'rating': 'c.rating DESC',
        'price_asc': 'c.base_price_per_person ASC',
        'price_desc': 'c.base_price_per_person DESC',
        'newest': 'c.created_at DESC',
        'reviews': 'c.review_count DESC',
    }
    sql += f' ORDER BY {sort_map.get(sort, "c.rating DESC")}'

    all_rows = query(sql, params)
    total = len(all_rows)
    caterers = [_caterer_row(r) for r in all_rows[(page-1)*per_page : page*per_page]]

    return jsonify({
        'caterers': caterers,
        'total': total,
        'page': page,
        'per_page': per_page,
        'pages': (total + per_page - 1) // per_page
    })


@caterers_bp.route('/<int:caterer_id>', methods=['GET'])
def get_caterer(caterer_id):
    c = query(
        '''SELECT c.*, u.name AS owner_name, u.email AS owner_email, u.phone AS owner_phone
           FROM caterers c JOIN users u ON u.id = c.user_id
           WHERE c.id = ?''',
        (caterer_id,), one=True
    )
    if not c:
        return jsonify({'error': 'Caterer not found'}), 404

    caterer = _caterer_row(c)

    # Fetch menu grouped by category
    items = query(
        'SELECT * FROM menu_items WHERE caterer_id = ? ORDER BY category, sort_order, name',
        (caterer_id,)
    )
    menu = {}
    for item in items:
        cat = item['category']
        if cat not in menu:
            menu[cat] = []
        menu[cat].append(dict(item))
    caterer['menu'] = menu

    # Recent reviews
    reviews = query(
        '''SELECT r.*, u.name AS customer_name FROM reviews r
           JOIN users u ON u.id = r.customer_id
           WHERE r.caterer_id = ? ORDER BY r.created_at DESC LIMIT 10''',
        (caterer_id,)
    )
    caterer['reviews'] = [dict(r) for r in reviews]

    user = get_current_user()
    caterer['is_owner'] = bool(user and user['role'] == 'caterer' and
                                query('SELECT id FROM caterers WHERE id = ? AND user_id = ?',
                                      (caterer_id, user['id']), one=True))
    return jsonify(caterer)


@caterers_bp.route('/me', methods=['GET'])
@require_role('caterer')
def my_caterer_profile():
    c = query(
        'SELECT * FROM caterers WHERE user_id = ?', (g.user['id'],), one=True
    )
    if not c:
        return jsonify({'error': 'Caterer profile not found'}), 404
    return jsonify(_caterer_row(c))


@caterers_bp.route('/me', methods=['PUT'])
@require_role('caterer')
def update_my_caterer_profile():
    c = query('SELECT id FROM caterers WHERE user_id = ?', (g.user['id'],), one=True)
    if not c:
        return jsonify({'error': 'Caterer profile not found'}), 404

    data = request.get_json()
    fields = ['business_name', 'description', 'service_area',
              'min_guests', 'max_guests', 'base_price_per_person', 'image_url']
    json_fields = ['cuisine_types', 'event_types']

    updates = {}
    for f in fields:
        if f in data:
            updates[f] = data[f]
    for f in json_fields:
        if f in data:
            updates[f] = json.dumps(data[f]) if isinstance(data[f], list) else data[f]

    if updates:
        set_clause = ', '.join(f'{k} = ?' for k in updates)
        execute(
            f'UPDATE caterers SET {set_clause} WHERE id = ?',
            list(updates.values()) + [c['id']]
        )
    return jsonify({'message': 'Profile updated'})


@caterers_bp.route('/featured', methods=['GET'])
def featured():
    # Serve from cache if still fresh
    now = time.time()
    if _featured_cache['data'] is not None and (now - _featured_cache['ts']) < _featured_cache['ttl']:
        return jsonify(_featured_cache['data'])

    settings = query("SELECT value FROM platform_settings WHERE key = 'featured_caterer_ids'", one=True)
    try:
        ids = json.loads(settings['value']) if settings else []
    except Exception:
        ids = []

    if ids:
        from database import USE_POSTGRES
        ph = '%s' if USE_POSTGRES else '?'
        placeholders = ','.join([ph] * len(ids))
        rows = query(
            f'''SELECT c.*, u.name AS owner_name FROM caterers c
                JOIN users u ON u.id = c.user_id
                WHERE c.id IN ({placeholders}) AND c.verification_status = 'approved'
                ORDER BY c.rating DESC''',
            ids
        )
    else:
        rows = query(
            '''SELECT c.*, u.name AS owner_name FROM caterers c
               JOIN users u ON u.id = c.user_id
               WHERE c.verification_status = 'approved'
               ORDER BY c.rating DESC LIMIT 6'''
        )

    result = [_caterer_row(r) for r in rows]
    _featured_cache['data'] = result
    _featured_cache['ts'] = now
    return jsonify(result)
