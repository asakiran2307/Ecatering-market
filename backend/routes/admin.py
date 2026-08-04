import json
from flask import Blueprint, request, jsonify, g
from database import query, execute
from auth_helpers import require_role

admin_bp = Blueprint('admin', __name__)


# --- Caterer Verification ---

@admin_bp.route('/caterers/pending', methods=['GET'])
@require_role('admin')
def pending_caterers():
    rows = query(
        '''SELECT c.*, u.name AS owner_name, u.email AS owner_email, u.phone AS owner_phone,
                  u.created_at AS user_created_at
           FROM caterers c
           JOIN users u ON u.id = c.user_id
           WHERE c.verification_status = 'pending'
           ORDER BY c.created_at DESC'''
    )
    return jsonify(rows)


@admin_bp.route('/caterers/<int:caterer_id>/verify', methods=['POST'])
@require_role('admin')
def verify_caterer(caterer_id):
    data = request.get_json()
    action = data.get('action')  # 'approve' or 'reject'
    reason = (data.get('reason') or '').strip()

    if action not in ('approve', 'reject'):
        return jsonify({'error': 'action must be approve or reject'}), 400

    caterer = query('SELECT id FROM caterers WHERE id = ?', (caterer_id,), one=True)
    if not caterer:
        return jsonify({'error': 'Caterer not found'}), 404

    status = 'approved' if action == 'approve' else 'rejected'
    execute(
        'UPDATE caterers SET verification_status = ?, rejection_reason = ? WHERE id = ?',
        (status, reason if status == 'rejected' else '', caterer_id)
    )
    return jsonify({'message': f'Caterer {status}'})


# --- Users ---

@admin_bp.route('/users', methods=['GET'])
@require_role('admin')
def list_users():
    role = request.args.get('role', '')
    search = request.args.get('q', '').strip()
    page = max(1, request.args.get('page', 1, type=int))
    per_page = 20

    sql = 'SELECT id, name, email, role, phone, is_active, created_at FROM users WHERE 1=1'
    params = []
    if role:
        sql += ' AND role = ?'
        params.append(role)
    if search:
        sql += ' AND (name LIKE ? OR email LIKE ?)'
        params += [f'%{search}%', f'%{search}%']
    sql += ' ORDER BY created_at DESC'

    all_rows = query(sql, params)
    total = len(all_rows)
    users = [dict(r) for r in all_rows[(page-1)*per_page : page*per_page]]
    return jsonify({'users': users, 'total': total})


@admin_bp.route('/users/<int:user_id>/status', methods=['PUT'])
@require_role('admin')
def update_user_status(user_id):
    data = request.get_json()
    is_active = 1 if data.get('is_active') else 0
    user = query('SELECT id, role FROM users WHERE id = ?', (user_id,), one=True)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    if user['role'] == 'admin':
        return jsonify({'error': 'Cannot modify admin accounts'}), 403
    execute('UPDATE users SET is_active = ? WHERE id = ?', (is_active, user_id))
    return jsonify({'message': 'User status updated'})


# --- Analytics ---

@admin_bp.route('/analytics', methods=['GET'])
@require_role('admin')
def analytics():
    total_orders = query('SELECT COUNT(*) AS cnt FROM orders', one=True)['cnt']
    pending_orders = query("SELECT COUNT(*) AS cnt FROM orders WHERE status = 'pending'", one=True)['cnt']
    completed_orders = query("SELECT COUNT(*) AS cnt FROM orders WHERE status = 'completed'", one=True)['cnt']
    gmv = query("SELECT COALESCE(SUM(total_cost),0) AS total FROM orders WHERE status IN ('completed','confirmed')", one=True)['total']
    total_customers = query("SELECT COUNT(*) AS cnt FROM users WHERE role='customer' AND is_active=1", one=True)['cnt']
    total_caterers = query("SELECT COUNT(*) AS cnt FROM caterers WHERE verification_status='approved'", one=True)['cnt']
    pending_caterers = query("SELECT COUNT(*) AS cnt FROM caterers WHERE verification_status='pending'", one=True)['cnt']
    open_disputes = query("SELECT COUNT(*) AS cnt FROM disputes WHERE status='open'", one=True)['cnt']

    # Orders by status
    status_breakdown = query(
        "SELECT status, COUNT(*) AS cnt FROM orders GROUP BY status ORDER BY cnt DESC"
    )

    # Revenue last 7 days
    from database import USE_POSTGRES
    date_filter = "created_at >= NOW() - INTERVAL '7 days'" if USE_POSTGRES else "created_at >= DATE('now', '-7 days')"
    date_trunc = "DATE(created_at)" if not USE_POSTGRES else "DATE(created_at)"
    daily_revenue = query(
        f"""SELECT {date_trunc} AS day, COALESCE(SUM(total_cost),0) AS revenue,
                  COUNT(*) AS orders
           FROM orders
           WHERE status IN ('completed','confirmed')
             AND {date_filter}
           GROUP BY day ORDER BY day"""
    )

    # Top caterers
    top_caterers = query(
        """SELECT c.business_name, c.rating, c.review_count,
                  COUNT(o.id) AS order_count,
                  COALESCE(SUM(o.total_cost),0) AS revenue
           FROM caterers c
           LEFT JOIN orders o ON o.caterer_id = c.id AND o.status IN ('completed','confirmed')
           WHERE c.verification_status = 'approved'
           GROUP BY c.id ORDER BY revenue DESC LIMIT 5"""
    )

    commission_rate = query("SELECT value FROM platform_settings WHERE key='commission_rate'", one=True)
    rate = float(commission_rate['value']) / 100 if commission_rate else 0.10
    commission_earned = round(gmv * rate, 2)

    return jsonify({
        'total_orders': total_orders,
        'pending_orders': pending_orders,
        'completed_orders': completed_orders,
        'gmv': round(gmv, 2),
        'commission_earned': commission_earned,
        'total_customers': total_customers,
        'total_caterers': total_caterers,
        'pending_caterers_verification': pending_caterers,
        'open_disputes': open_disputes,
        'status_breakdown': status_breakdown,
        'daily_revenue': daily_revenue,
        'top_caterers': top_caterers,
    })


# --- Platform Settings ---

@admin_bp.route('/settings', methods=['GET'])
@require_role('admin')
def get_settings():
    rows = query('SELECT * FROM platform_settings ORDER BY key')
    return jsonify(rows)


@admin_bp.route('/settings', methods=['PUT'])
@require_role('admin')
def update_settings():
    data = request.get_json()
    from database import USE_POSTGRES
    for key, value in data.items():
        v = json.dumps(value) if isinstance(value, (list, dict)) else str(value)
        if USE_POSTGRES:
            execute(
                'INSERT INTO platform_settings(key,value,updated_at) VALUES(%s,%s,NOW()) '
                'ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()',
                (key, v)
            )
        else:
            execute(
                'INSERT INTO platform_settings(key,value,updated_at) VALUES(?,?,CURRENT_TIMESTAMP) '
                'ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at',
                (key, v)
            )
    return jsonify({'message': 'Settings updated'})


# --- Platform Order Feed ---

@admin_bp.route('/orders', methods=['GET'])
@require_role('admin')
def admin_orders():
    status_filter = request.args.get('status', '')
    search = request.args.get('q', '').strip()
    page = max(1, request.args.get('page', 1, type=int))
    per_page = 20

    sql = '''SELECT o.*, c.business_name AS caterer_name, u.name AS customer_name
             FROM orders o
             JOIN caterers c ON c.id = o.caterer_id
             JOIN users u ON u.id = o.customer_id
             WHERE 1=1'''
    params = []
    if status_filter:
        sql += ' AND o.status = ?'
        params.append(status_filter)
    if search:
        sql += ' AND (u.name LIKE ? OR c.business_name LIKE ?)'
        params += [f'%{search}%', f'%{search}%']
    sql += ' ORDER BY o.created_at DESC'

    all_rows = query(sql, params)
    total = len(all_rows)
    orders = [dict(r) for r in all_rows[(page-1)*per_page : page*per_page]]
    return jsonify({'orders': orders, 'total': total})
