# This file can be empty 

from flask import Flask # type: ignore
from app.api.endpoints import ultravox
from app.core.config import settings
import logging

def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)
    
    # Configure logging
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Register blueprints
    app.register_blueprint(ultravox.router, url_prefix='')
    
    return app 