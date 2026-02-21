from flask import Flask
from config import Config
from .extensions import db
import os

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Configure CORS for frontend MFEs
    from flask_cors import CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": [
                "http://localhost:3000",  # Shell MFE
                "http://localhost:3001",  # LMS MFE
                "http://localhost:3002",  # Challenge MFE
                "http://localhost:8000",  # API Gateway
            ],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "X-User-Id", "X-User-Role", "X-Request-ID", "X-Correlation-ID"],
            "expose_headers": ["X-Request-ID", "X-Response-Time"]
        }
    })
    
    # Initialize extensions
    db.init_app(app)
    
    # Register blueprints
    from app.auth.routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')
    
    from app.profile.routes import profile_bp
    app.register_blueprint(profile_bp, url_prefix='/api/v1')
    
    from app.courses.routes import courses_bp
    app.register_blueprint(courses_bp, url_prefix='/api/v1/courses')
    
    from app.progress.routes import progress_bp
    app.register_blueprint(progress_bp, url_prefix='/api/v1/enrollments')
    
    from app.challenges.routes import challenges_bp
    app.register_blueprint(challenges_bp, url_prefix='/api/v1/challenges')
    
    from app.feature_flags.routes import feature_flags_bp
    app.register_blueprint(feature_flags_bp, url_prefix='/api/v1/flags')
    
    from app.lessons.routes import lessons_bp
    app.register_blueprint(lessons_bp, url_prefix='/api/v1/lessons')
    
    from app.api_key.routes import api_key_bp
    app.register_blueprint(api_key_bp, url_prefix='/api/v1/api-keys')
    
    # AI Assistant service
    try:
        from app.ai.routes import ai_bp
        app.register_blueprint(ai_bp, url_prefix='/api/v1/ai')
    except ImportError:
        print("AI service not available - OpenAI not configured")
    
    # Initialize middleware (error handlers, correlation ID, logging)
    from .middleware import init_middleware
    init_middleware(app)
    
    # Initialize Prometheus Metrics
    if not app.config.get('TESTING'):
        from prometheus_flask_exporter import PrometheusMetrics
        metrics = PrometheusMetrics(app)
        metrics.info('app_info', 'Application info', version='2.3.0')
    
    # Create tables
    with app.app_context():
        db.create_all()
    
    return app