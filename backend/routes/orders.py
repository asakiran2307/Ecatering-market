from flask import Blueprint, request, jsonify, g
from database import query, execute
from auth_helpers import require_auth, require_role

orders_bp = Blueprint('orders', __name__)

VALID_TRANSITIONS = {
    'customer': {
        'pending': ['cancelled'],
        'accepted': ['confirmed', 'cancelled'],
        'confirmed': ['cancelled'],
    },
    'caterer': {
        'pending': ['accepted', 'rejected'],
        'confirmed': ['completed'],
    },
    'admin': {
        'pending': ['accepted', 'rejected', 'cancelled'],
        'accepted': ['confirmed', 'cancelled'],
        'confirmed': ['completed', 'cancelled'],
    }
}


def _add_status_history(order_id, status, actor_id, actor_name, actor_role, note=''):
    execute(
        '''INSERT INTO order_status_history (order_id, status, actor_id, actor_name, actor_role, note)
           VALUES (?, ?, ?, ?, ?, ?)''',
        (order_id, status, actor_id, actor_name, actor_role, note)
    )
    # Add system message to chat
    execute(
        '''INSERT INTO messages (order_id, sender_id, sender_name, sender_role, content, is_system)
           VALUES (?, ?, ?, ?, ?, 1)''',
        (order_id, actor_id, 'System', 'system',
         f'Order status changed to {status.upper()} by {actor_name}' + (f': {note}' if note else ''))
    )


@orders_bp.route('', methods=['POST'])
@require_role('customer')
def create_order():
    data = request.get_json()
    caterer_id = data.get('caterer_id')
    guest_count = data.get('guest_count')
    event_date = data.get('event_date')
    event_address = (data.get('event_address') or '').strip()
    items = data.get('items', [])  # [{menu_item_id, quantity}]

    if not caterer_id or not guest_count or not event_date or not event_address:
        return jsonify({'error': 'caterer_id, guest_count, event_date and event_address are required'}), 400
    if not items:
        return jsonify({'error': 'Order must have at least one item'}), 400

    caterer = query('SELECT * FROM caterers WHERE id = ? AND verification_status = ?',
                    (caterer_id, 'approved'), one=True)
    if not caterer:
        return jsonify({'error': 'Caterer not found or not approved'}), 404

    # Calculate total
    total = 0
    resolved_items = []
    for it in items:
        mi = query('SELECT * FROM menu_items WHERE id = ? AND caterer_id = ? AND is_available = 1',
                   (it['menu_item_id'], caterer_id), one=True)
        if not mi:
            return jsonify({'error': f'Menu item {it["menu_item_id"]} not found or unavailable'}), 400
        qty = max(1, int(it.get('quantity', 1)))
        item_total = mi['price'] * qty
        total += item_total
        resolved_items.append({'item': mi, 'qty': qty})

    order_id = execute(
        '''INSERT INTO orders (customer_id, caterer_id, guest_count, event_date, event_time,
           event_address, event_type, special_instructions, total_cost)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
        (g.user['id'], caterer_id, guest_count,
         event_date, data.get('event_time', ''),
         event_address, data.get('event_type', ''),
         data.get('special_instructions', ''), round(total, 2))
    )

    for ri in resolved_items:
        mi = ri['item']
        execute(
            '''INSERT INTO order_items (order_id, menu_item_id, name, category, quantity, price_at_order)
               VALUES (?, ?, ?, ?, ?, ?)''',
            (order_id, mi['id'], mi['name'], mi['category'], ri['qty'], mi['price'])
        )

    _add_status_history(order_id, 'pending', g.user['id'], g.user['name'], 'customer',
                        'Order placed')

    order = query('SELECT * FROM orders WHERE id = ?', (order_id,), one=True)
    return jsonify(dict(order)), 201


@orders_bp.route('', methods=['GET'])
@require_auth
def list_orders():
    user = g.user
    page = max(1, request.args.get('page', 1, type=int))
    per_page = 20
    status_filter = request.args.get('status', '')

    if user['role'] == 'customer':
        sql = '''SELECT o.*, c.business_name AS caterer_name, c.image_url AS caterer_image,
                        u.name AS customer_name
                 FROM orders o
                 JOIN caterers c ON c.id = o.caterer_id
                 JOIN users u ON u.id = o.customer_id
                 WHERE o.customer_id = ?'''
        params = [user['id']]
    elif user['role'] == 'caterer':
        caterer = query('SELECT id FROM caterers WHERE user_id = ?', (user['id'],), one=True)
        if not caterer:
            return jsonify({'orders': [], 'total': 0}), 200
        sql = '''SELECT o.*, c.business_name AS caterer_name, c.image_url AS caterer_image,
                        u.name AS customer_name
                 FROM orders o
                 JOIN caterers c ON c.id = o.caterer_id
                 JOIN users u ON u.id = o.customer_id
                 WHERE o.caterer_id = ?'''
        params = [caterer['id']]
    else:  # admin
        sql = '''SELECT o.*, c.business_name AS caterer_name, c.image_url AS caterer_image,
                        u.name AS customer_name
                 FROM orders o
                 JOIN caterers c ON c.id = o.caterer_id
                 JOIN users u ON u.id = o.customer_id
                 WHERE 1=1'''
        params = []

    if status_filter:
        sql += ' AND o.status = ?'
        params.append(status_filter)

    sql += ' ORDER BY o.created_at DESC'
    all_rows = query(sql, params)
    total = len(all_rows)
    orders = [dict(r) for r in all_rows[(page-1)*per_page : page*per_page]]

    return jsonify({'orders': orders, 'total': total, 'page': page, 'per_page': per_page})


@orders_bp.route('/<int:order_id>', methods=['GET'])
@require_auth
def get_order(order_id):
    user = g.user
    order = query(
        '''SELECT o.*, c.business_name AS caterer_name, c.image_url AS caterer_image,
                  c.user_id AS caterer_user_id, u.name AS customer_name, u.phone AS customer_phone
           FROM orders o
           JOIN caterers c ON c.id = o.caterer_id
           JOIN users u ON u.id = o.customer_id
           WHERE o.id = ?''',
        (order_id,), one=True
    )
    if not order:
        return jsonify({'error': 'Order not found'}), 404

    order = dict(order)

    # Access check
    if user['role'] == 'customer' and order['customer_id'] != user['id']:
        return jsonify({'error': 'Forbidden'}), 403
    if user['role'] == 'caterer':
        caterer = query('SELECT id FROM caterers WHERE user_id = ?', (user['id'],), one=True)
        if not caterer or order['caterer_id'] != caterer['id']:
            return jsonify({'error': 'Forbidden'}), 403

    # Items
    order['items'] = query(
        'SELECT * FROM order_items WHERE order_id = ? ORDER BY id', (order_id,)
    )
    # History
    order['status_history'] = query(
        'SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at',
        (order_id,)
    )
    # Review
    order['review'] = query('SELECT * FROM reviews WHERE order_id = ?', (order_id,), one=True)

    return jsonify(order)


@orders_bp.route('/<int:order_id>/status', methods=['PUT'])
@require_auth
def update_status(order_id):
    user = g.user
    data = request.get_json()
    new_status = data.get('status')
    note = (data.get('note') or '').strip()

    order = query('SELECT * FROM orders WHERE id = ?', (order_id,), one=True)
    if not order:
        return jsonify({'error': 'Order not found'}), 404

    # Permission check
    if user['role'] == 'customer' and order['customer_id'] != user['id']:
        return jsonify({'error': 'Forbidden'}), 403
    if user['role'] == 'caterer':
        caterer = query('SELECT id FROM caterers WHERE user_id = ?', (user['id'],), one=True)
        if not caterer or order['caterer_id'] != caterer['id']:
            return jsonify({'error': 'Forbidden'}), 403

    allowed = VALID_TRANSITIONS.get(user['role'], {}).get(order['status'], [])
    if new_status not in allowed:
        return jsonify({'error': f"Cannot transition from '{order['status']}' to '{new_status}'"}), 400

    from database import USE_POSTGRES
    ts_expr = 'NOW()' if USE_POSTGRES else 'CURRENT_TIMESTAMP'
    execute(
        f'UPDATE orders SET status = ?, updated_at = {ts_expr} WHERE id = ?',
        (new_status, order_id)
    )
    _add_status_history(order_id, new_status, user['id'], user['name'], user['role'], note)

    # Update caterer rating if completed
    if new_status == 'completed':
        caterer_id = order['caterer_id']
        stats = query(
            'SELECT AVG(rating) AS avg_rating, COUNT(*) AS cnt FROM reviews WHERE caterer_id = ?',
            (caterer_id,), one=True
        )
        if stats and stats['cnt']:
            execute('UPDATE caterers SET rating = ?, review_count = ? WHERE id = ?',
                    (round(stats['avg_rating'], 2), stats['cnt'], caterer_id))

    return jsonify({'message': 'Status updated', 'status': new_status})
