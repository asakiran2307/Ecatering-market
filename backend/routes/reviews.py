from flask import Blueprint, request, jsonify, g
from database import query, execute
from auth_helpers import require_role

reviews_bp = Blueprint('reviews', __name__)


@reviews_bp.route('', methods=['POST'])
@require_role('customer')
def create_review():
    data = request.get_json()
    order_id = data.get('order_id')
    rating = data.get('rating')
    comment = (data.get('comment') or '').strip()

    if not order_id or rating is None:
        return jsonify({'error': 'order_id and rating are required'}), 400
    if not (1 <= int(rating) <= 5):
        return jsonify({'error': 'Rating must be between 1 and 5'}), 400

    order = query(
        'SELECT * FROM orders WHERE id = ? AND customer_id = ? AND status = ?',
        (order_id, g.user['id'], 'completed'), one=True
    )
    if not order:
        return jsonify({'error': 'Order not found or not yet completed'}), 404

    existing = query('SELECT id FROM reviews WHERE order_id = ?', (order_id,), one=True)
    if existing:
        return jsonify({'error': 'You already reviewed this order'}), 409

    review_id = execute(
        'INSERT INTO reviews (order_id, customer_id, caterer_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
        (order_id, g.user['id'], order['caterer_id'], int(rating), comment)
    )

    # Update caterer rating
    stats = query(
        'SELECT AVG(rating) AS avg_rating, COUNT(*) AS cnt FROM reviews WHERE caterer_id = ?',
        (order['caterer_id'],), one=True
    )
    if stats and stats['cnt']:
        execute(
            'UPDATE caterers SET rating = ?, review_count = ? WHERE id = ?',
            (round(stats['avg_rating'], 2), stats['cnt'], order['caterer_id'])
        )

    review = query('SELECT * FROM reviews WHERE id = ?', (review_id,), one=True)
    return jsonify(dict(review)), 201


@reviews_bp.route('/caterer/<int:caterer_id>', methods=['GET'])
def get_caterer_reviews(caterer_id):
    page = max(1, request.args.get('page', 1, type=int))
    per_page = 10
    rows = query(
        '''SELECT r.*, u.name AS customer_name FROM reviews r
           JOIN users u ON u.id = r.customer_id
           WHERE r.caterer_id = ? ORDER BY r.created_at DESC''',
        (caterer_id,)
    )
    total = len(rows)
    reviews = [dict(r) for r in rows[(page-1)*per_page : page*per_page]]
    return jsonify({'reviews': reviews, 'total': total})
