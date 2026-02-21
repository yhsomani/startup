from flask import Flask
from app.routes import collab_bp, socketio
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Configure app from env
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'default-secret-key')
    app.config['DEBUG'] = os.getenv('FLASK_ENV') == 'development'
    
    # Initialize extensions
    # SocketIO is already initialized in routes.py, but we need to bind it to the app here
    socketio.init_app(app)
    
    # Register Blueprint
    # Note: URL prefix should match the gateway configuration
    app.register_blueprint(collab_bp, url_prefix='/api/v1/collaboration')
    
    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 1234))
    print(f"Starting Collaboration Service on port {port}")
    socketio.run(app, host='0.0.0.0', port=port, debug=app.config['DEBUG'])
