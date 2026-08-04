"""
api/index.py — Vercel serverless entrypoint for the Ecatring Flask app.

Vercel @vercel/python looks for an `app` WSGI object in this file.
We add the backend directory to sys.path so all imports work correctly
both locally and in the Vercel serverless environment.
"""
import os
import sys

# Resolve the backend directory regardless of where Vercel runs this from
_here = os.path.dirname(os.path.abspath(__file__))
_backend = os.path.join(_here, '..', 'backend')
_backend = os.path.normpath(_backend)

if _backend not in sys.path:
    sys.path.insert(0, _backend)

from app import app  # noqa: E402 — must come after sys.path manipulation

# Vercel expects the WSGI app to be named `app`
# Flask's `app` object is already a valid WSGI app.
