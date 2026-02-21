from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt, get_jwt_identity
from functools import wraps
from datetime import datetime, timedelta
import os
import requests
from utils import FeatureFlags as UtilFeatureFlags, admin_required, require_feature_flag, validate_json_input, secure_headers, log_api_access, handle_database_errors

# Flask Feature Flags API URL
FLASK_FLAGS_URL = os.getenv('FLASK_FLAGS_URL', 'http://flask:5000')

app = Flask(__name__)
CORS(app)

# JWT Configuration
jwt_secret = os.getenv('JWT_SECRET_KEY')
if not jwt_secret:
    if os.getenv('FLASK_ENV') == 'production':
        raise RuntimeError("CRITICAL: JWT_SECRET_KEY must be set in production environment.")
    print("⚠️  WARNING: Using insecure default JWT_SECRET_KEY. Do not use in production.")
    jwt_secret = '404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970'

app.config['JWT_SECRET_KEY'] = jwt_secret
jwt = JWTManager(app)

def admin_required():
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()
        def decorator(*args, **kwargs):
            claims = get_jwt()
            if claims.get('role') != 'ADMIN':
                return jsonify({'message': 'Admin access required'}), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper

# Database configuration
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://talentsphere_user:admin@localhost:5440/talentsphere')
USE_MOCK = not DATABASE_URL or 'mock' in DATABASE_URL.lower()

# Initialize database models (import regardless of mode)
from models import db, UserStreak, UserBadge, UserPoints, AVAILABLE_BADGES

if not USE_MOCK:
    try:
        app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        db.init_app(app)
        
        with app.app_context():
            db.create_all()
        
        print("✅ PostgreSQL database initialized")
    except Exception as e:
        print(f"⚠️  Database connection failed: {e}. Falling back to MOCK mode.")
        USE_MOCK = True
else:
    # Initialize db with app for mock mode as well (though it won't connect)
    db.init_app(app)

# Mock data storage (fallback)
if USE_MOCK:
    USER_STREAKS = {}
    USER_BADGES = {}
    USER_POINTS = {}
    AVAILABLE_BADGES = [
        {'id': 'first_course', 'name': 'First Course Complete', 'icon': '🎓'},
        {'id': 'week_warrior', 'name': '7-Day Streak', 'icon': '🔥'},
        {'id': 'code_master', 'name': '100 Challenges Solved', 'icon': '💻'},
        {'id': 'top_learner', 'name': 'Top 10% Student', 'icon': '⭐'}
    ]

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'gamification-service',
        'mode': 'MOCK' if USE_MOCK else 'PRODUCTION',
        'timestamp': datetime.now().isoformat()
    }), 200

@app.route('/api/v1/users/<user_id>/streaks', methods=['GET'])
@jwt_required()
@require_feature_flag('ENABLE_GAMIFICATION')
@secure_headers()
@log_api_access()
@handle_database_errors()
def get_user_streaks(user_id):
    """Get user's learning streaks"""
    current_user_id = get_jwt_identity()
    # In a real system, we'd compare UUIDs. Here we assume identity is available.
    # If identity is email, we'd fetch user.id first.
    # Feature flag check handled by decorator
    
    if USE_MOCK:
        # Mock response
        if user_id not in USER_STREAKS:
            import random
            USER_STREAKS[user_id] = {
                'current_streak': random.randint(1, 30),
                'longest_streak': random.randint(10, 60),
                'last_activity': datetime.now().isoformat(),
                'streak_start_date': (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat()
            }
        return jsonify(USER_STREAKS[user_id]), 200
    else:
        # PostgreSQL
        streak = UserStreak.query.filter_by(user_id=user_id).first()
        if not streak:
            streak = UserStreak(user_id=user_id)
            db.session.add(streak)
            db.session.commit()
        return jsonify(streak.to_dict()), 200

@app.route('/api/v1/users/<user_id>/badges', methods=['GET'])
@jwt_required()
@require_feature_flag('ENABLE_GAMIFICATION')
@secure_headers()
@log_api_access()
@handle_database_errors()
def get_user_badges(user_id):
    """Get user's earned badges"""
    # Feature flag check handled by decorator
    
    if USE_MOCK:
        # Mock response
        if user_id not in USER_BADGES:
            import random
            num_badges = random.randint(1, len(AVAILABLE_BADGES))
            earned_badges = random.sample(AVAILABLE_BADGES, num_badges)
            USER_BADGES[user_id] = [
                {**badge, 'earned_at': (datetime.now() - timedelta(days=random.randint(1, 90))).isoformat()}
                for badge in earned_badges
            ]
        return jsonify({'total': len(USER_BADGES[user_id]), 'badges': USER_BADGES[user_id]}), 200
    else:
        # PostgreSQL
        badges = UserBadge.query.filter_by(user_id=user_id).all()
        return jsonify({
            'total': len(badges),
            'badges': [badge.to_dict() for badge in badges]
        }), 200

@app.route('/api/v1/users/<user_id>/points', methods=['GET'])
@jwt_required()
@require_feature_flag('ENABLE_GAMIFICATION')
@secure_headers()
@log_api_access()
@handle_database_errors()
def get_user_points(user_id):
    """Get user's points and level"""
    # Feature flag check handled by decorator
    
    if USE_MOCK:
        # Mock response
        if user_id not in USER_POINTS:
            import random
            USER_POINTS[user_id] = {
                'total_points': random.randint(100, 10000),
                'level': random.randint(1, 20),
                'points_to_next_level': random.randint(50, 500)
            }
        return jsonify(USER_POINTS[user_id]), 200
    else:
        # PostgreSQL
        points = UserPoints.query.filter_by(user_id=user_id).first()
        if not points:
            points = UserPoints(user_id=user_id)
            db.session.add(points)
            db.session.commit()
        return jsonify(points.to_dict()), 200

@app.route('/api/v1/users/<user_id>/award-points', methods=['POST'])
@admin_required()
@require_feature_flag('ENABLE_GAMIFICATION')
@validate_json_input(required_fields=['points'], optional_fields=['reason'])
@secure_headers()
@log_api_access()
@handle_database_errors()
def award_points(user_id):
    """Award points to a user"""
    # Feature flag check handled by decorator
    
    data = request.get_json()
    points_to_award = data.get('points', 0)
    reason = data.get('reason', 'Activity completion')
    
    if USE_MOCK:
        # Mock update
        if user_id not in USER_POINTS:
            USER_POINTS[user_id] = {'total_points': 0, 'level': 1, 'points_to_next_level': 100}
        USER_POINTS[user_id]['total_points'] += points_to_award
        return jsonify({
            'message': f'Awarded {points_to_award} points for {reason}',
            'new_total': USER_POINTS[user_id]['total_points']
        }), 200
    else:
        # PostgreSQL update
        points = UserPoints.query.filter_by(user_id=user_id).first()
        if not points:
            points = UserPoints(user_id=user_id)
            db.session.add(points)
        
        points.total_points += points_to_award
        points.updated_at = datetime.utcnow()
        
        # Level up logic
        if points.total_points >= points.points_to_next_level:
            points.level += 1
            points.points_to_next_level = points.level * 100
        
        db.session.commit()
        
        return jsonify({
            'message': f'Awarded {points_to_award} points for {reason}',
            'new_total': points.total_points,
            'level': points.level
        }), 200

@app.route('/events/process', methods=['POST'])
@require_feature_flag('ENABLE_GAMIFICATION')
@validate_json_input(required_fields=['type'], optional_fields=['data'])
@secure_headers()
@log_api_access()
@handle_database_errors()
def process_event():
    """Process internal system events for gamification triggers"""
    # Feature flag check handled by decorator
        
    data = request.get_json()
    event_type = data.get('type', 'unknown')
    
    # Logic to process event asynchronously (e.g. queue it) would go here
    print(f"📨 Received event: {event_type}")
    
    return jsonify({
        'status': 'processed', 
        'event': event_type, 
        'timestamp': datetime.now().isoformat()
    }), 200

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5007))
    mode_str = 'MOCK' if USE_MOCK else 'PRODUCTION (PostgreSQL)'
    print(f"🎮 Gamification Service")
    print(f"   Mode: {mode_str}")
    print(f"   Port: {port}")
    if USE_MOCK:
        print(f"   💡 Set DATABASE_URL environment variable for production mode")
    app.run(host='0.0.0.0', port=port, debug=True)
