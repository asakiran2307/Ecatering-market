from flask import Blueprint, request, jsonify, g
from database import query, execute
from auth_helpers import require_auth, require_role

disputes_bp = Blueprint('disputes', __name__)


@disputes_bp.route('', methods=['POST'])
@require_auth
def create_dispute():
    data = request.get_json()
    order_id = data.get('order_id')
    description = (data.get('description') or '').strip()

    if not order_id or not description:
        return jsonify({'error': 'order_id and description are required'}), 400

    order = query('SELECT * FROM orders WHERE id = ?', (order_id,), one=True)
    if not order:
        return jsonify({'error': 'Order not found'}), 404

    if g.user['role'] == 'customer' and order['customer_id'] != g.user['id']:
        return jsonify({'error': 'Forbidden'}), 403
    if g.user['role'] == 'caterer':
        caterer = query('SELECT id FROM caterers WHERE user_id = ?', (g.user['id'],), one=True)
        if not caterer or order['caterer_id'] != caterer['id']:
            return jsonify({'error': 'Forbidden'}), 403

    dispute_id = execute(
        'INSERT INTO disputes (order_id, reporter_id, reporter_role, description) VALUES (?, ?, ?, ?)',
        (order_id, g.user['id'], g.user['role'], description)
    )
    dispute = query('SELECT * FROM disputes WHERE id = ?', (dispute_id,), one=True)
    return jsonify(dict(dispute)), 201


@disputes_bp.route('', methods=['GET'])
@require_role('admin')
def list_disputes():
    status_filter = request.args.get('status', '')
    sql = '''SELECT d.*, u.name AS reporter_name, o.status AS order_status
             FROM disputes d
             JOIN users u ON u.id = d.reporter_id
             JOIN orders o ON o.id = d.order_id'''
    params = []
    if status_filter:
        sql += ' WHERE d.status = ?'
        params.append(status_filter)
    sql += ' ORDER BY d.created_at DESC'
    return jsonify(query(sql, params))


@disputes_bp.route('/<int:dispute_id>', methods=['GET'])
@require_auth
def get_dispute(dispute_id):
    d = query(
        '''SELECT d.*, u.name AS reporter_name FROM disputes d
           JOIN users u ON u.id = d.reporter_id WHERE d.id = ?''',
        (dispute_id,), one=True
    )
    if not d:
        return jsonify({'error': 'Dispute not found'}), 404
    return jsonify(dict(d))


@disputes_bp.route('/<int:dispute_id>', methods=['PUT'])
@require_role('admin')
def update_dispute(dispute_id):
    d = query('SELECT * FROM disputes WHERE id = ?', (dispute_id,), one=True)
    if not d:
        return jsonify({'error': 'Dispute not found'}), 404

    data = request.get_json()
    status = data.get('status', d['status'])
    resolution = (data.get('resolution') or '').strip()

    execute(
        'UPDATE disputes SET status = ?, resolution = ?, resolved_by = ? WHERE id = ?',
        (status, resolution, g.user['id'] if status == 'resolved' else None, dispute_id)
    )
    return jsonify(query('SELECT * FROM disputes WHERE id = ?', (dispute_id,), one=True))
