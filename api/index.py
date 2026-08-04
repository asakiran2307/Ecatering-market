"""
api/index.py — Vercel serverless entrypoint for the Ecatring Flask app.

Vercel @vercel/python looks for an `app` WSGI object in this file.
We add the backend directory to sys.path so all imports work correctly.
"""
import os
import sys

# Add backend directory to Python path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
sys.path.insert(0, backend_dir)

from app import app  # noqa: E402 — must come after sys.path manipulation

# Vercel expects the WSGI app to be named `app`
# Flask's `app` object is already a valid WSGI app.
