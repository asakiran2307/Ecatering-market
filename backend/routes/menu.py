from flask import Blueprint, request, jsonify, g
from database import query, execute
from auth_helpers import require_role

menu_bp = Blueprint('menu', __name__)


def _get_caterer_id(user_id):
    c = query('SELECT id FROM caterers WHERE user_id = ?', (user_id,), one=True)
    return c['id'] if c else None


@menu_bp.route('/<int:caterer_id>/menu', methods=['GET'])
def get_menu(caterer_id):
    available_only = request.args.get('available', 'false').lower() == 'true'
    sql = 'SELECT * FROM menu_items WHERE caterer_id = ?'
    params = [caterer_id]
    if available_only:
        sql += ' AND is_available = 1'
    sql += ' ORDER BY category, sort_order, name'
    items = query(sql, params)
    return jsonify(items)


@menu_bp.route('/<int:caterer_id>/menu', methods=['POST'])
@require_role('caterer')
def add_menu_item(caterer_id):
    caterer_id_actual = _get_caterer_id(g.user['id'])
    if caterer_id_actual != caterer_id:
        return jsonify({'error': 'Forbidden'}), 403

    data = request.get_json()
    name = (data.get('name') or '').strip()
    category = (data.get('category') or '').strip()
    price = data.get('price')

    if not name or not category or price is None:
        return jsonify({'error': 'Name, category and price are required'}), 400

    item_id = execute(
        '''INSERT INTO menu_items (caterer_id, name, description, category, price, unit, image_url, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
        (caterer_id, name,
         data.get('description', ''),
         category,
         float(price),
         data.get('unit', 'per person'),
         data.get('image_url', ''),
         data.get('sort_order', 0))
    )
    item = query('SELECT * FROM menu_items WHERE id = ?', (item_id,), one=True)
    return jsonify(item), 201


@menu_bp.route('/<int:caterer_id>/menu/<int:item_id>', methods=['PUT'])
@require_role('caterer')
def update_menu_item(caterer_id, item_id):
    caterer_id_actual = _get_caterer_id(g.user['id'])
    if caterer_id_actual != caterer_id:
        return jsonify({'error': 'Forbidden'}), 403

    item = query('SELECT * FROM menu_items WHERE id = ? AND caterer_id = ?', (item_id, caterer_id), one=True)
    if not item:
        return jsonify({'error': 'Item not found'}), 404

    data = request.get_json()
    fields = ['name', 'description', 'category', 'price', 'unit', 'image_url', 'is_available', 'sort_order']
    updates = {f: data[f] for f in fields if f in data}

    if updates:
        set_clause = ', '.join(f'{k} = ?' for k in updates)
        execute(f'UPDATE menu_items SET {set_clause} WHERE id = ?', list(updates.values()) + [item_id])

    return jsonify(query('SELECT * FROM menu_items WHERE id = ?', (item_id,), one=True))


@menu_bp.route('/<int:caterer_id>/menu/<int:item_id>', methods=['DELETE'])
@require_role('caterer')
def delete_menu_item(caterer_id, item_id):
    caterer_id_actual = _get_caterer_id(g.user['id'])
    if caterer_id_actual != caterer_id:
        return jsonify({'error': 'Forbidden'}), 403

    item = query('SELECT id FROM menu_items WHERE id = ? AND caterer_id = ?', (item_id, caterer_id), one=True)
    if not item:
        return jsonify({'error': 'Item not found'}), 404

    execute('DELETE FROM menu_items WHERE id = ?', (item_id,))
    return jsonify({'message': 'Item deleted'})


@menu_bp.route('/<int:caterer_id>/menu/<int:item_id>/toggle', methods=['POST'])
@require_role('caterer')
def toggle_availability(caterer_id, item_id):
    caterer_id_actual = _get_caterer_id(g.user['id'])
    if caterer_id_actual != caterer_id:
        return jsonify({'error': 'Forbidden'}), 403

    item = query('SELECT * FROM menu_items WHERE id = ? AND caterer_id = ?', (item_id, caterer_id), one=True)
    if not item:
        return jsonify({'error': 'Item not found'}), 404

    new_status = 0 if item['is_available'] else 1
    execute('UPDATE menu_items SET is_available = ? WHERE id = ?', (new_status, item_id))
    return jsonify({'is_available': bool(new_status)})
