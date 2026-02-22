"""
Flask application factory and configuration setup.
"""
import os
from flask import Flask
from flask_cors import CORS


def create_app(config_class=None):
    """Create and configure Flask application."""
    app = Flask(__name__)

    # Load configuration
    if config_class:
        app.config.from_object(config_class)
    else:
        # Default configuration
        app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')
        app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
            'DATABASE_URL', 
            'postgresql://postgres:postgres@localhost:5432/talentsphere'
        )
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET', 'jwt-secret-key')
        


# Initialize extensions
    from .extensions import db, jwt, migrate
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    # Initialize CORS
    cors_origins = os.environ.get('CORS_ORIGIN', 'http://localhost:3000').split(',')
    CORS(app, resources={
        r"/*": {
            "origins": cors_origins,
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

    # Initialize middleware
    from .middleware import init_middleware
    init_middleware(app)

    # Register blueprints
    from .auth import auth_bp
    from .progress import progress_bp
    from .profile import profile_bp
    from .challenges import challenges_bp

    app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')
    app.register_blueprint(progress_bp, url_prefix='/api/v1/progress')
    app.register_blueprint(profile_bp, url_prefix='/api/v1/profile')
    app.register_blueprint(challenges_bp, url_prefix='/api/v1/challenges')

        # Health check endpoint
    @app.route('/health')
    def health():
        return {'status': 'healthy', 'service': 'flask-backend'}

    return app
