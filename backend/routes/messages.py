from flask import Blueprint, request, jsonify, g
from database import query, execute
from auth_helpers import require_auth

messages_bp = Blueprint('messages', __name__)


def _check_order_access(order_id, user):
    order = query('SELECT * FROM orders WHERE id = ?', (order_id,), one=True)
    if not order:
        return None, 'Order not found'
    if user['role'] == 'customer' and order['customer_id'] != user['id']:
        return None, 'Forbidden'
    if user['role'] == 'caterer':
        caterer = query('SELECT id FROM caterers WHERE user_id = ?', (user['id'],), one=True)
        if not caterer or order['caterer_id'] != caterer['id']:
            return None, 'Forbidden'
    return order, None


@messages_bp.route('/<int:order_id>/messages', methods=['GET'])
@require_auth
def get_messages(order_id):
    _, err = _check_order_access(order_id, g.user)
    if err:
        return jsonify({'error': err}), 403 if err == 'Forbidden' else 404

    since = request.args.get('since', '')
    sql = 'SELECT * FROM messages WHERE order_id = ?'
    params = [order_id]
    if since:
        sql += ' AND created_at > ?'
        params.append(since)
    sql += ' ORDER BY created_at'
    msgs = query(sql, params)
    return jsonify(msgs)


@messages_bp.route('/<int:order_id>/messages', methods=['POST'])
@require_auth
def send_message(order_id):
    order, err = _check_order_access(order_id, g.user)
    if err:
        return jsonify({'error': err}), 403 if err == 'Forbidden' else 404

    data = request.get_json()
    content = (data.get('content') or '').strip()
    if not content:
        return jsonify({'error': 'Message content is required'}), 400

    msg_id = execute(
        '''INSERT INTO messages (order_id, sender_id, sender_name, sender_role, content)
           VALUES (?, ?, ?, ?, ?)''',
        (order_id, g.user['id'], g.user['name'], g.user['role'], content)
    )
    msg = query('SELECT * FROM messages WHERE id = ?', (msg_id,), one=True)
    return jsonify(msg), 201


@messages_bp.route('/caterer/threads', methods=['GET'])
@require_auth
def caterer_chat_threads():
    if g.user['role'] != 'caterer':
        return jsonify({'error': 'Forbidden'}), 403

    caterer = query('SELECT id FROM caterers WHERE user_id = ?', (g.user['id'],), one=True)
    if not caterer:
        return jsonify([])

    threads = query(
        '''SELECT o.id AS order_id, o.status, o.created_at,
                  u.name AS customer_name,
                  (SELECT content FROM messages WHERE order_id = o.id ORDER BY created_at DESC LIMIT 1) AS last_message,
                  (SELECT created_at FROM messages WHERE order_id = o.id ORDER BY created_at DESC LIMIT 1) AS last_message_at,
                  (SELECT COUNT(*) FROM messages WHERE order_id = o.id AND is_system = 0) AS message_count
           FROM orders o
           JOIN users u ON u.id = o.customer_id
           WHERE o.caterer_id = ? AND o.status NOT IN ('rejected','cancelled')
           ORDER BY last_message_at DESC NULLS LAST''',
        (caterer['id'],)
    )
    return jsonify(threads)
