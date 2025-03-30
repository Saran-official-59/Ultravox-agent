# This file can be empty 

from flask import Flask # type: ignore

def create_app():
    app = Flask(__name__)
    
    # Register your blueprints
    from app.api.endpoints import ultravox
    app.register_blueprint(ultravox.router)
    
    return app 