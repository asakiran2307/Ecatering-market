import os
import sys

# Add backend dir to path
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

from database import init_db
from routes.auth import auth_bp
from routes.caterers import caterers_bp
from routes.menu import menu_bp
from routes.orders import orders_bp
from routes.messages import messages_bp
from routes.reviews import reviews_bp
from routes.disputes import disputes_bp
from routes.admin import admin_bp

frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend'))

app = Flask(__name__, static_folder=frontend_dir, static_url_path='')

CORS(app, resources={r"/*": {"origins": "*"}})

# Register blueprints
app.register_blueprint(auth_bp,     url_prefix='/api/auth')
app.register_blueprint(caterers_bp, url_prefix='/api/caterers')
app.register_blueprint(menu_bp,     url_prefix='/api/caterers')
app.register_blueprint(orders_bp,   url_prefix='/api/orders')
app.register_blueprint(messages_bp, url_prefix='/api/orders')
app.register_blueprint(reviews_bp,  url_prefix='/api/reviews')
app.register_blueprint(disputes_bp, url_prefix='/api/disputes')
app.register_blueprint(admin_bp,    url_prefix='/api/admin')


@app.route('/api/health')
def health():
    return jsonify({'status': 'ok', 'version': '1.0.0'})


# Frontend static files & single-page application fallback
@app.route('/')
def serve_index():
    return send_from_directory(frontend_dir, 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    if path.startswith('api/'):
        return jsonify({'error': 'Not found'}), 404
    file_path = os.path.join(frontend_dir, path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return send_from_directory(frontend_dir, path)
    return send_from_directory(frontend_dir, 'index.html')


@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Not found'}), 404


@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({'error': 'Method not allowed'}), 405


@app.errorhandler(500)
def internal_error(e):
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    print("Initializing database...")
    init_db()
    print("==================================================")
    print("  Ecatring App & API running at: http://localhost:5000")
    print("==================================================")
    app.run(host='0.0.0.0', port=5000, debug=True)
